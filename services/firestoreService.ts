
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
 * Standard Mushaf Madinah (15 lines per page, 20 pages per juz)
 */
const LINES_PER_PAGE = 15;
const PAGES_PER_JUZ = 20;
const LINES_PER_JUZ = LINES_PER_PAGE * PAGES_PER_JUZ;

/**
 * UTILITY: Normalisasi total baris ke objek {juz, pages, lines}
 * Digunakan untuk menyimpan state akhir di Firestore
 */
const normalizeLinesToHafalan = (totalLines: number) => {
  const juz = Math.floor(totalLines / LINES_PER_JUZ);
  const remainingAfterJuz = totalLines % LINES_PER_JUZ;
  const pages = Math.floor(remainingAfterJuz / LINES_PER_PAGE);
  const lines = remainingAfterJuz % LINES_PER_PAGE;
  return { juz, pages, lines };
};

/**
 * UTILITY: Konversi objek hafalan ke total baris mentah
 * Digunakan untuk perhitungan aritmatika delta
 */
const hafalanToTotalLines = (h: { juz: number, pages: number, lines: number } | undefined): number => {
  if (!h) return 0;
  return (Number(h.juz || 0) * LINES_PER_JUZ) + 
         (Number(h.pages || 0) * LINES_PER_PAGE) + 
         Number(h.lines || 0);
};

/**
 * HELPER: Parsing string "Surah:Ayat" menjadi objek pointer untuk engine
 */
const parsePointer = (str: string | undefined) => {
  if (!str || str === '-' || str.trim() === '' || str.toLowerCase() === 'belum ada') return null;
  const parts = str.split(':');
  if (parts.length < 2) return null;
  return { 
    surah: parts[0].trim(), 
    ayah: parseInt(parts[1]) || 1 
  };
};

/**
 * HELPER: Mendapatkan bagian akhir dari range (misal "A:1 - B:10" -> "B:10")
 */
const getRangeEnd = (rangeStr: string): string => {
  if (!rangeStr || rangeStr === '-') return '';
  const parts = rangeStr.split(' - ');
  return parts.length > 1 ? parts[1].trim() : parts[0].trim();
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

// --- DATA FETCHING ---

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

// --- STUDENT MANAGEMENT ---

export const addStudent = async (student: Omit<Student, 'id' | 'attendance' | 'behaviorScore'>): Promise<Student> => {
  if (!db) throw new Error("Firestore not initialized");
  const level = extractClassLevel(student.className);
  const docRef = await addDoc(collection(db, 'siswa'), { 
    ...student, 
    classLevel: level, 
    attendance: 100, 
    behaviorScore: 10, 
    totalHafalan: { juz: 0, pages: 0, lines: 0 },
    currentProgress: 'Belum Ada',
    createdAt: serverTimestamp() 
  });
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
 * CORE LOGIC: SIMPAN LAPORAN SDQ (TRANSACTIONAL & CUMULATIVE)
 * Menangani update memorisasi otomatis tanpa input manual total oleh guru.
 */
export const saveSDQReport = async (reportData: Omit<Report, 'id' | 'createdAt'>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");

  await runTransaction(db, async (transaction) => {
    const studentRef = doc(db, 'siswa', reportData.studentId);
    const reportRef = doc(collection(db, 'laporan'));
    
    // 1. Ambil state terbaru siswa
    const studentSnap = await transaction.get(studentRef);
    if (!studentSnap.exists()) throw new Error("Siswa tidak ditemukan");
    const studentData = studentSnap.data() as Student;

    let updatedTotalHafalan = studentData.totalHafalan || { juz: 0, pages: 0, lines: 0 };
    let updatedProgress = studentData.currentProgress || 'Belum Ada';

    // 2. Tentukan Strategi Update Memorisasi
    
    // CASE A: LAPORAN SEMESTER (Baseline Reset)
    // Digunakan untuk set ulang total hafalan secara presisi di awal semester
    if (reportData.type === 'Laporan Semester' && reportData.totalHafalan) {
      updatedTotalHafalan = reportData.totalHafalan;
      const endOfTahfizh = getRangeEnd(reportData.tahfizh.individual);
      if (endOfTahfizh) updatedProgress = endOfTahfizh;
    } 
    
    // CASE B: LAPORAN BULANAN (Incremental / Delta Calculation)
    // Menggunakan Engine SDQ untuk menghitung selisih baris secara otomatis
    else {
      const tahfizhIndividual = reportData.tahfizh.individual;
      
      if (tahfizhIndividual && tahfizhIndividual !== '-') {
        const rangeParts = tahfizhIndividual.split(' - ');
        if (rangeParts.length === 2) {
          const reportStartStr = rangeParts[0].trim();
          const reportEndStr = rangeParts[1].trim();

          // KUNCI INTEGRITAS DATA:
          // Start calculation selalu dari PROGRES TERAKHIR siswa di database,
          // bukan dari start range yang diinput guru (mencegah double count/gap).
          const lastProgressPtr = parsePointer(studentData.currentProgress);
          const newProgressPtr = parsePointer(reportEndStr);

          // Jika siswa punya progres sebelumnya, hitung delta baris
          if (lastProgressPtr && newProgressPtr) {
            const calculation = TahfizhEngineSDQ.calculateCapaian(lastProgressPtr, newProgressPtr);
            const deltaLines = calculation.quran.totalBaris;
            
            // Konversi total lama ke baris, tambahkan delta, lalu normalisasi kembali
            // Catatan: Karena engine inclusive, jika start=end maka delta=1. 
            // Kita hanya menambahkan delta JIKA end baru lebih jauh dari progres lama.
            // (Abaikan jika input adalah progres yang sama/lebih rendah)
            if (deltaLines > 1) {
              const currentTotalLines = hafalanToTotalLines(studentData.totalHafalan);
              // Kita kurangi 1 karena lastProgressPtr sudah masuk dalam hitungan total lama
              const newTotalLines = currentTotalLines + (deltaLines - 1); 
              updatedTotalHafalan = normalizeLinesToHafalan(newTotalLines);
              updatedProgress = reportEndStr;
            } else if (deltaLines === 1 && studentData.currentProgress === 'Belum Ada') {
              // Kasus khusus setoran pertama kali (1 baris)
              updatedTotalHafalan = normalizeLinesToHafalan(1);
              updatedProgress = reportEndStr;
            } else if (deltaLines > 1 && studentData.currentProgress === 'Belum Ada') {
               // Kasus setoran pertama kali (> 1 baris)
               updatedTotalHafalan = normalizeLinesToHafalan(deltaLines);
               updatedProgress = reportEndStr;
            }
          } 
          // Jika siswa baru (progres masih 'Belum Ada'), gunakan start dari laporan
          else if (!lastProgressPtr && newProgressPtr) {
            const startRangePtr = parsePointer(reportStartStr);
            if (startRangePtr) {
              const calculation = TahfizhEngineSDQ.calculateCapaian(startRangePtr, newProgressPtr);
              updatedTotalHafalan = normalizeLinesToHafalan(calculation.quran.totalBaris);
              updatedProgress = reportEndStr;
            }
          }
        }
      }
    }

    // 3. Update Dokumen Siswa (State Terkini)
    transaction.update(studentRef, {
      totalHafalan: updatedTotalHafalan,
      currentProgress: updatedProgress,
      lastUpdated: serverTimestamp()
    });

    // 4. Simpan Log Laporan (Snapshot Sejarah)
    transaction.set(reportRef, {
      ...reportData,
      totalHafalan: updatedTotalHafalan, // Simpan state hafalan saat laporan dibuat
      createdAt: new Date().toISOString()
    });
  });
};

/**
 * Legacy support: Aliasing addReport to transactional SDQ engine
 */
export const addReport = async (report: Omit<Report, 'id' | 'createdAt'>): Promise<Report> => {
  await saveSDQReport(report);
  return { id: 'auto-gen', ...report, createdAt: new Date().toISOString() } as Report;
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
