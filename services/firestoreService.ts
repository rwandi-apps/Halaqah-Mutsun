import {
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Report, Student } from '../types';
import { QURAN_FULL_MAP, JUZ_BOUNDARIES } from './tahfizh/quranFullData';

/**
 * =========================
 * UTIL POINTER
 * =========================
 */

const normalizeSurah = (name: string) =>
  name.replace(/[’‘`]/g, "'").replace(/Al\s+/g, 'Al-').trim();

const parsePointer = (str?: string | null) => {
  if (!str || str === '-') return null;
  const [surah, ayah] = str.split(':');
  if (!surah || !ayah) return null;
  return {
    surah: normalizeSurah(surah),
    ayah: parseInt(ayah.trim())
  };
};

const pointerToKey = (p: { surah: string; ayah: number }) =>
  `${p.surah}:${p.ayah}`;

/**
 * =========================
 * DERIVED DISPLAY
 * =========================
 * Dipakai UI, BUKAN disimpan
 */
export const deriveHafalanDisplay = (endPointer: string) => {
  const data = QURAN_FULL_MAP[endPointer];
  if (!data) return { juz: 0, pages: 0, lines: 0 };

  const juzStartPage = JUZ_BOUNDARIES[data.juz].startPage;

  return {
    juz: data.juz,
    pages: data.page - juzStartPage,
    lines: data.line
  };
};

/**
 * =========================
 * SAVE SDQ REPORT (FINAL)
 * =========================
 */
export const saveSDQReport = async (
  reportData: Omit<Report, 'id' | 'createdAt'>
): Promise<void> => {
  if (!db) throw new Error('Firestore not initialized');

  await runTransaction(db, async (tx) => {
    const studentRef = doc(db, 'siswa', reportData.studentId);
    const reportRef = doc(collection(db, 'laporan'));

    const snap = await tx.get(studentRef);
    if (!snap.exists()) throw new Error('Siswa tidak ditemukan');

    const student = snap.data() as Student;

    let finalProgress = student.currentProgress ?? null;
    let finalTotalHafalan = student.totalHafalan ?? null;

    const tahfizhRange = reportData.tahfizh?.individual;
    const createdAt = new Date().toISOString();

    /**
     * =========================
     * CASE 1 — LAPORAN SEMESTER
     * (HARD BASELINE)
     * =========================
     */
    if (reportData.type === 'Laporan Semester') {
      const end = tahfizhRange?.split(' - ')[1];
      if (end) {
        finalProgress = end.trim();
        finalTotalHafalan = { endPointer: finalProgress };
      }
    }

    /**
     * =========================
     * CASE 2 — LAPORAN BULANAN
     * (ROLLING PROGRESS)
     * =========================
     */
    else {
      if (tahfizhRange && tahfizhRange !== '-') {
        const [, endStr] = tahfizhRange.split(' - ');
        const endPtr = parsePointer(endStr);

        if (endPtr) {
          const endKey = pointerToKey(endPtr);

          if (!QURAN_FULL_MAP[endKey]) {
            throw new Error(`Pointer Quran tidak valid: ${endKey}`);
          }

          // 🔑 UPDATE PROGRESS SAJA
          finalProgress = endKey;
          finalTotalHafalan = { endPointer: endKey };
        }
      }
    }

    /**
     * =========================
     * UPDATE SISWA
     * =========================
     */
    tx.update(studentRef, {
      totalHafalan: finalTotalHafalan,
      currentProgress: finalProgress,
      lastUpdated: serverTimestamp()
    });

    /**
     * =========================
     * SIMPAN LAPORAN SNAPSHOT
     * =========================
     */
    tx.set(reportRef, {
      ...reportData,
      totalHafalan: finalTotalHafalan,
      createdAt
    });
  });
};
