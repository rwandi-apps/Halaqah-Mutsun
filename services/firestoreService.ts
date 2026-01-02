import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  onSnapshot,
  Unsubscribe,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Student, Report, Role, SemesterReport } from '../types';
import { extractClassLevel } from './sdqTargets';
import { TahfizhEngineSDQ } from './tahfizh/engine';

/**
 * SDQ INTERNAL CONSTANTS
 * Mushaf Madinah: 15 baris / halaman, 20 halaman / juz
 */
const LINES_PER_PAGE = 15;
const PAGES_PER_JUZ = 20;
const LINES_PER_JUZ = LINES_PER_PAGE * PAGES_PER_JUZ;

/**
 * NORMALIZE total baris → { juz, pages, lines }
 */
const normalizeLinesToHafalan = (totalLines: number) => {
  const juz = Math.floor(totalLines / LINES_PER_JUZ);
  const sisaSetelahJuz = totalLines % LINES_PER_JUZ;
  const pages = Math.floor(sisaSetelahJuz / LINES_PER_PAGE);
  const lines = sisaSetelahJuz % LINES_PER_PAGE;
  return { juz, pages, lines };
};

/**
 * KONVERSI hafalan → total baris mentah
 */
const hafalanToTotalLines = (h?: { juz: number; pages: number; lines: number }) => {
  if (!h) return 0;
  return (h.juz * LINES_PER_JUZ) + (h.pages * LINES_PER_PAGE) + h.lines;
};

/**
 * PARSE "Surah:Ayat" → pointer engine
 */
const parsePointer = (str?: string) => {
  if (!str || str === '-' || str.toLowerCase() === 'belum ada') return null;
  const parts = str.split(':');
  if (parts.length < 2) return null;
  return {
    surah: parts[0].trim(),
    ayah: parseInt(parts[1]) || 1
  };
};

/**
 * AMBIL ujung range "A:1 - B:10" → "B:10"
 */
const getRangeEnd = (range: string) => {
  if (!range || range === '-') return '';
  const p = range.split(' - ');
  return p.length === 2 ? p[1].trim() : p[0].trim();
};

/**
 * ===============================
 * CORE LOGIC: SIMPAN LAPORAN SDQ
 * ===============================
 */
export const saveSDQReport = async (
  reportData: Omit<Report, 'id' | 'createdAt'>
): Promise<void> => {
  if (!db) throw new Error('Firestore not initialized');

  await runTransaction(db, async (tx) => {
    const studentRef = doc(db, 'siswa', reportData.studentId);
    const reportRef = doc(collection(db, 'laporan'));

    const studentSnap = await tx.get(studentRef);
    if (!studentSnap.exists()) throw new Error('Siswa tidak ditemukan');

    const student = studentSnap.data() as Student;

    let updatedTotalHafalan = student.totalHafalan || { juz: 0, pages: 0, lines: 0 };
    let updatedProgress = student.currentProgress || 'Belum Ada';

    /**
     * ===============================
     * CASE A — LAPORAN SEMESTER
     * ===============================
     * Baseline resmi (reset)
     */
    if (reportData.type === 'Laporan Semester' && reportData.totalHafalan) {
      updatedTotalHafalan = reportData.totalHafalan;

      const end = getRangeEnd(reportData.tahfizh?.individual || '');
      if (end) updatedProgress = end;
    }

    /**
     * ===============================
     * CASE B — LAPORAN BULANAN
     * ===============================
     * HANYA TAMBAH DELTA BARU
     */
    else {
      const tahfizh = reportData.tahfizh?.individual;
      if (!tahfizh || tahfizh === '-') {
        // tidak ada setoran → tidak mengubah hafalan
      } else {
        const endStr = getRangeEnd(tahfizh);
        const newEndPtr = parsePointer(endStr);
        if (!newEndPtr) return;

        const lastProgressStr = student.currentProgress;
        const lastProgressPtr = parsePointer(lastProgressStr);

        let deltaLines = 0;

        // 🟢 SISWA BARU
        if (!lastProgressPtr) {
          const startStr = tahfizh.split(' - ')[0]?.trim();
          const startPtr = parsePointer(startStr);
          if (!startPtr) return;

          const calc = TahfizhEngineSDQ.calculateCapaian(startPtr, newEndPtr);
          deltaLines = calc.quran.totalBaris;
        }

        // 🟢 SISWA LANJUTAN
        else {
          // Tolak input mundur / sama
          if (lastProgressStr === endStr) return;

          const calc = TahfizhEngineSDQ.calculateCapaian(
            lastProgressPtr,
            newEndPtr
          );
          deltaLines = calc.quran.totalBaris;
        }

        // 🟢 UPDATE TOTAL
        if (deltaLines > 0) {
          const oldLines = hafalanToTotalLines(student.totalHafalan);
          const newTotalLines = oldLines + deltaLines;

          updatedTotalHafalan = normalizeLinesToHafalan(newTotalLines);
          updatedProgress = endStr;
        }
      }
    }

    /**
     * ===============================
     * SIMPAN KE DATABASE
     * ===============================
     */
    tx.update(studentRef, {
      totalHafalan: updatedTotalHafalan,
      currentProgress: updatedProgress,
      lastUpdated: serverTimestamp()
    });

    tx.set(reportRef, {
      ...reportData,
      totalHafalan: updatedTotalHafalan,
      createdAt: new Date().toISOString()
    });
  });
};

/**
 * Legacy alias
 */
export const addReport = async (
  report: Omit<Report, 'id' | 'createdAt'>
): Promise<Report> => {
  await saveSDQReport(report);
  return { id: 'auto', ...report, createdAt: new Date().toISOString() } as Report;
};
