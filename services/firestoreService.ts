
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
 * Utility: Mengonversi akumulasi baris ke format Juz/Hal/Baris (Standard 15 Lines)
 */
const normalizeHafalan = (totalLines: number) => {
  const LINES_PER_PAGE = 15;
  const PAGES_PER_JUZ = 20;
  const LINES_PER_JUZ = LINES_PER_PAGE * PAGES_PER_JUZ;

  const juz = Math.floor(totalLines / LINES_PER_JUZ);
  const remainingAfterJuz = totalLines % LINES_PER_JUZ;
  
  const pages = Math.floor(remainingAfterJuz / LINES_PER_PAGE);
  const lines = remainingAfterJuz % LINES_PER_PAGE;

  return { juz, pages, lines };
};

/**
 * Utility: Menghitung total baris dari objek hafalan
 */
const toTotalLines = (h: { juz: number, pages: number, lines: number }) => {
  return (h.juz * 20 * 15) + (h.pages * 15) + h.lines;
};

/**
 * Helper: Parse string "Surah:Ayat" menjadi object pointer
 */
const parsePointer = (str: string) => {
  if (!str || str === '-') return null;
  const parts = str.split(':');
  if (parts.length < 2) return null;
  return { surah: parts[0].trim(), ayah: parseInt(parts[1]) || 1 };
};

export const getAllTeachers = async (): Promise<User[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getTeacherById = async (id: string): Promise<User | undefined> => {
  if (!db) return undefined;
  const docRef = doc(db, 'users', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as User : undefined;
};

export const addTeacher = async (name: string, email: string, nickname: string, role: Role): Promise<User> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, 'users'), { name, nickname, email, role, createdAt: serverTimestamp() });
  return { id: docRef.id, name, nickname, email, role, createdAt: new Date().toISOString() } as User;
};

export const updateTeacher = async (id: string, data: Partial<User>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, 'users', id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

// --- FETCH FUNCTIONS ---

export const getStudentsByTeacher = async (teacherId: string): Promise<Student[]> => {
  if (!db) return [];
  const q = query(collection(db, 'siswa'), where('teacherId', '==', teacherId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};

export const getReportsByTeacher = async (teacherId: string): Promise<Report[]> => {
  if (!db) return [];
  const q = query(collection(db, 'laporan'), where('teacherId', '==', teacherId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
};

// --- REALTIME LISTENERS ---

export const subscribeToStudentsByTeacher = (
  teacherId: string, 
  onUpdate: (students: Student[]) => void
): Unsubscribe => {
  if (!db) return () => {}; 
  const q = query(collection(db, 'siswa'), where('teacherId', '==', teacherId));
  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    onUpdate(students);
  });
};

export const subscribeToReportsByTeacher = (
  teacherId: string,
  onUpdate: (reports: Report[]) => void
): Unsubscribe => {
  if (!db) return () => {};
  const q = query(collection(db, 'laporan'), where('teacherId', '==', teacherId));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
    onUpdate(reports);
  });
};

// --- SEMESTER REPORT FUNCTIONS ---

export const saveSemesterReport = async (report: SemesterReport): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const reportId = `${report.studentId}_${report.academicYear.replace(/\//g, '-')}_${report.semester}`;
  const docRef = doc(db, 'rapor_semester', reportId);
  await setDoc(docRef, { ...report, updatedAt: serverTimestamp() });
};

export const getSemesterReport = async (studentId: string, academicYear: string, semester: string): Promise<SemesterReport | null> => {
  if (!db) return null;
  const reportId = `${studentId}_${academicYear.replace(/\//g, '-')}_${semester}`;
  const docSnap = await getDoc(doc(db, 'rapor_semester', reportId));
  return docSnap.exists() ? docSnap.data() as SemesterReport : null;
};

export const deleteSemesterReport = async (studentId: string, academicYear: string, semester: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const reportId = `${studentId}_${academicYear.replace(/\//g, '-')}_${semester}`;
  await deleteDoc(doc(db, 'rapor_semester', reportId));
};

export const getAllSemesterReports = async (): Promise<SemesterReport[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'rapor_semester'));
  return snapshot.docs.map(doc => ({ ...doc.data() } as SemesterReport));
};

export const subscribeToSemesterReports = (teacherId: string, onUpdate: (reports: SemesterReport[]) => void): Unsubscribe => {
  if (!db) return () => {};
  const q = query(collection(db, 'rapor_semester'), where('teacherId', '==', teacherId));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({ ...doc.data() } as SemesterReport));
    onUpdate(reports);
  });
};

export const addStudent = async (student: Omit<Student, 'id' | 'attendance' | 'behaviorScore'>): Promise<Student> => {
  if (!db) throw new Error("Firestore not initialized");
  const level = extractClassLevel(student.className);
  const docRef = await addDoc(collection(db, 'siswa'), { ...student, classLevel: level, attendance: 100, behaviorScore: 10, createdAt: serverTimestamp() });
  return { id: docRef.id, ...student, classLevel: level, attendance: 100, behaviorScore: 10, createdAt: new Date().toISOString() } as Student;
};

export const updateStudent = async (id: string, data: Partial<Student>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, 'siswa', id);
  const updateData = { ...data };
  
  if (data.className) {
    (updateData as any).classLevel = extractClassLevel(data.className);
  }
  
  await updateDoc(docRef, updateData);
};

/**
 * IMPLEMENTASI STRATEGI ROLLING TOTAL & BASELINE (SDQ ENGINE)
 */
export const saveSDQReport = async (
  reportData: Omit<Report, 'id' | 'createdAt'>
): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");

  await runTransaction(db, async (transaction) => {
    const studentRef = doc(db, 'siswa', reportData.studentId);
    const reportRef = doc(collection(db, 'laporan'));

    const studentSnap = await transaction.get(studentRef);
    if (!studentSnap.exists()) {
      throw new Error("Siswa tidak ditemukan");
    }

    const studentData = studentSnap.data() as Student;
    const createdAt = new Date().toISOString();

    // ===============================
    // BASE STATE SISWA
    // ===============================
    let finalTotalHafalan = studentData.totalHafalan ?? {
      juz: 0,
      pages: 0,
      lines: 0
    };

    let finalProgress = studentData.currentProgress ?? null;

    // ===============================
    // CASE 1 — LAPORAN SEMESTER
    // (Hard Baseline)
    // ===============================
    if (reportData.type === 'Laporan Semester') {
      if (reportData.totalHafalan) {
        finalTotalHafalan = reportData.totalHafalan;
      }

      const endRange = reportData.tahfizh?.individual?.split(' - ')[1];
      if (endRange && endRange !== '-') {
        finalProgress = endRange.trim();
      }
    }

    // ===============================
    // CASE 2 — LAPORAN BULANAN
    // (Rolling Delta)
    // ===============================
    else {
      let currentTotalLines = toTotalLines(finalTotalHafalan);

      const rangeStr = reportData.tahfizh?.individual;
      if (rangeStr && rangeStr !== '-') {
        const parts = rangeStr.split(' - ');

        if (parts.length === 2) {
          const endPtr = parsePointer(parts[1]);

          // 🔑 START POINTER WAJIB DARI PROGRESS TERAKHIR
          const startPtr = finalProgress
            ? parsePointer(finalProgress)
            : parsePointer(parts[0]); // fallback utk data lama

          if (startPtr && endPtr) {
            const delta = TahfizhEngineSDQ.calculateCapaian(
              startPtr,
              endPtr
            );

            // ✅ TAMBAH HANYA DELTA BARIS BARU
            currentTotalLines += delta.quran.totalBaris;

            finalProgress = parts[1].trim();
          }
        }
      }

      finalTotalHafalan = normalizeHafalan(currentTotalLines);
    }

    // ===============================
    // UPDATE DATA SISWA
    // ===============================
    transaction.update(studentRef, {
      totalHafalan: finalTotalHafalan,
      currentProgress: finalProgress,
      lastUpdated: serverTimestamp()
    });

    // ===============================
    // SIMPAN LAPORAN (SNAPSHOT)
    // ===============================
    transaction.set(reportRef, {
      ...reportData,
      totalHafalan: finalTotalHafalan,
      createdAt
    });
  });
};

/**
 * Legacy support: aliasing addReport to the new SDQ logic
 */
export const addReport = async (report: Omit<Report, 'id' | 'createdAt'>): Promise<Report> => {
  await saveSDQReport(report);
  return { id: 'temp-id', ...report, createdAt: new Date().toISOString() } as Report;
};

export const updateReport = async (reportId: string, data: Partial<Report>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, 'laporan', reportId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteReport = async (reportId: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, 'laporan', reportId);
  await deleteDoc(docRef);
};

export const getAllStudents = async (): Promise<Student[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'siswa'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};
