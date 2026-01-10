
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
  orderBy,
  Timestamp,
  addDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Student, Report, Role, SemesterReport, HalaqahEvaluation, HalaqahMonthlyReport } from '../types';
import { extractClassLevel } from './sdqTargets';
import { calculateFromRangeString } from './quranMapping';

// --- HELPER LOGIC (NON-EXPORTED) ---

/**
 * Menghasilkan Integer YYYYMM untuk sorting kronologis absolut.
 * Menangani logika Semester Ganjil = Desember, Semester Genap = Juni.
 */
const generatePeriodCode = (academicYear: string, period: string, type: string): number => {
  try {
    if (!academicYear) return 0;
    // Handle separator "/" or "-" (e.g. "2025/2026" or "2025-2026")
    const years = academicYear.replace(/\s/g, '').split(/[\/-]/);
    const startYear = parseInt(years[0]);
    const endYear = parseInt(years[1]);

    if (!startYear || !endYear) return 0;

    const normalizePeriod = (period || '').trim().toLowerCase();
    const normalizeType = (type || '').toLowerCase();
    
    // Mapping Semester: Prioritaskan Desember (Ganjil) dan Juni (Genap)
    // Deteksi legacy type seperti "Semester"
    if (normalizeType.includes('semester')) {
      if (normalizePeriod.includes('ganjil') || normalizePeriod === '1') return (startYear * 100) + 12;
      if (normalizePeriod.includes('genap') || normalizePeriod === '2') return (endYear * 100) + 6;
    }

    // Mapping Bulan Indonesia
    const monthMap: Record<string, number> = {
      'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12,
      'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6
    };

    const monthIndex = monthMap[normalizePeriod];
    if (!monthIndex) return 0; 

    // Tahun Kalender: Juli-Desember ikut StartYear, Januari-Juni ikut EndYear
    const year = (monthIndex >= 7) ? startYear : endYear;
    return (year * 100) + monthIndex;
  } catch (e) {
    console.error("Error generating period code", e);
    return 0;
  }
};

const safeCalculatePages = (rangeStr: string | undefined): number => {
  if (!rangeStr || rangeStr === '-' || rangeStr.trim() === '') return 0;
  try {
    const result = calculateFromRangeString(rangeStr);
    return Number(result.pages || 0);
  } catch (error) {
    return 0;
  }
};

/**
 * NORMALIZER LAYER
 * Memastikan data yang dibaca dari Firestore selalu memiliki format standar.
 * Ini menangani data Legacy secara on-the-fly tanpa perlu migrasi database fisik instan.
 */
const normalizeReportData = (docId: string, data: any): Report => {
  // 1. Fix Legacy Type
  let normalizedType = data.type;
  if (data.type === 'Semester' || data.type === 'Rapor Semester') {
    normalizedType = 'Laporan Semester';
  }

  // 2. Fix Missing Period Code
  let pCode = data.periodCode;
  if (!pCode) {
    pCode = generatePeriodCode(data.academicYear, data.month, normalizedType);
  }

  // 3. Fix Legacy Timestamp (String -> ISO)
  let createdStr = data.createdAt;
  if (data.createdAt instanceof Timestamp) {
    createdStr = data.createdAt.toDate().toISOString();
  } else if (!createdStr) {
    createdStr = new Date().toISOString();
  }

  return {
    ...data,
    id: docId,
    type: normalizedType,
    periodCode: pCode,
    createdAt: createdStr,
    // Pastikan field wajib ada
    totalHafalan: data.totalHafalan || { juz: 0, pages: 0, lines: 0 }
  } as Report;
};

// --- CORE BUSINESS LOGIC ---

export const recalculateTotalHafalan = async (studentId: string): Promise<void> => {
  if (!db) return;

  try {
    const studentRef = doc(db, 'siswa', studentId);
    
    // 1. Fetch ALL reports (raw)
    const reportsQuery = query(collection(db, 'laporan'), where('studentId', '==', studentId));
    const reportsSnap = await getDocs(reportsQuery);
    
    // 2. Normalize & Sort
    const allReports = reportsSnap.docs.map(d => normalizeReportData(d.id, d.data()));
    
    // Sort Descending (Terbaru ke Terlama berdasarkan periodCode)
    allReports.sort((a, b) => (b.periodCode || 0) - (a.periodCode || 0));

    let baselineFound = false;
    let totalPagesAccumulated = 0;

    // 3. Calculation Engine with Legacy Fallback
    for (const report of allReports) {
      if (!baselineFound && report.type === 'Laporan Semester') {
        // FOUND BASELINE (Snapshot Point)
        // Saat ketemu Laporan Semester, kita ambil totalnya sebagai baseline mutlak.
        // Laporan bulanan sebelumnya (yang lebih tua) diabaikan (subsumed).
        
        // JALUR UTAMA: Gunakan totalHafalan object jika ada
        if (report.totalHafalan && (report.totalHafalan.juz > 0 || report.totalHafalan.pages > 0)) {
           const baseJuz = Number(report.totalHafalan.juz || 0);
           const basePages = Number(report.totalHafalan.pages || 0);
           totalPagesAccumulated += (baseJuz * 20) + basePages;
        } 
        
        baselineFound = true;
        // Stop loop, abaikan laporan yang lebih tua dari semester ini
        break; 
      }
    }

    // 4. Add Deltas (Laporan Bulanan SETELAH Baseline)
    if (baselineFound) {
      const baselineReport = allReports.find(r => r.type === 'Laporan Semester');
      const baselineCode = baselineReport?.periodCode || 0;

      allReports.forEach(report => {
        // Hanya hitung bulanan yang periodCode-nya LEBIH BESAR dari baseline
        if (report.type === 'Laporan Bulanan' && (report.periodCode || 0) > baselineCode) {
          totalPagesAccumulated += safeCalculatePages(report.tahfizh?.individual);
        }
      });
    } else {
      // Tidak ada semester sama sekali -> Sum semua bulanan yang ada
      allReports.forEach(report => {
        if (report.type === 'Laporan Bulanan') {
          totalPagesAccumulated += safeCalculatePages(report.tahfizh?.individual);
        }
      });
    }

    // 5. Update Master Data Siswa
    const finalHafalan = {
      juz: Math.floor(totalPagesAccumulated / 20),
      pages: totalPagesAccumulated % 20,
      lines: 0
    };

    await updateDoc(studentRef, {
      totalHafalan: finalHafalan,
      lastRecalculated: serverTimestamp()
    });

  } catch (error) {
    console.error("Critical Error in Recalculation:", error);
  }
};

// --- DATA SERVICES ---

export const saveSDQReport = async (reportData: Omit<Report, 'id' | 'createdAt'>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  
  // 1. Sanitasi ID agar Deterministik (Idempotent Key)
  const safeYear = (reportData.academicYear || '2025-2026').replace(/[\/\s]/g, '');
  const safePeriod = reportData.month.trim().replace(/\s/g, '_');
  const safeType = reportData.type === 'Laporan Semester' ? 'smt' : 'bln';
  
  // Format ID: studentId_20252026_Desember_bln
  const deterministicId = `${reportData.studentId}_${safeYear}_${safePeriod}_${safeType}`;
  const reportRef = doc(db, 'laporan', deterministicId);
  
  // 2. Hitung Period Code on saving time
  const pCode = generatePeriodCode(reportData.academicYear || '', reportData.month, reportData.type);

  // 3. Simpan dengan setDoc (Overwrite aman)
  await setDoc(reportRef, {
    ...reportData,
    id: deterministicId,
    periodCode: pCode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // 4. Trigger Recalculate
  await recalculateTotalHafalan(reportData.studentId);
};

export const getReportsByTeacher = async (teacherId: string): Promise<Report[]> => {
  if (!db) return [];
  
  const q = query(
    collection(db, 'laporan'), 
    where('teacherId', '==', teacherId)
  );
  
  const snapshot = await getDocs(q);
  
  // Normalize & Sort di Client Side untuk menjamin urutan campuran data lama/baru
  const reports = snapshot.docs.map(doc => normalizeReportData(doc.id, doc.data()));
  
  return reports.sort((a, b) => {
    // Priority Sort: Period Code Descending
    const codeA = a.periodCode || 0;
    const codeB = b.periodCode || 0;
    if (codeA !== codeB) return codeB - codeA;
    // Fallback Sort: CreatedAt
    return b.createdAt.localeCompare(a.createdAt);
  });
};

export const subscribeToReportsByTeacher = (teacherId: string, onUpdate: (reports: Report[]) => void): Unsubscribe => {
  if (!db) return () => {};
  const q = query(
    collection(db, 'laporan'), 
    where('teacherId', '==', teacherId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => normalizeReportData(doc.id, doc.data()));
    
    const sortedReports = reports.sort((a, b) => {
        const codeA = a.periodCode || 0;
        const codeB = b.periodCode || 0;
        if (codeA !== codeB) return codeB - codeA;
        return b.createdAt.localeCompare(a.createdAt);
    });
    
    onUpdate(sortedReports);
  });
};

// --- RETAINED SERVICES (UNCHANGED) ---

export const updateReport = async (reportId: string, data: Partial<Report>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const reportRef = doc(db, 'laporan', reportId);
  const snap = await getDoc(reportRef);
  if (snap.exists()) {
    const studentId = snap.data().studentId;
    await updateDoc(reportRef, { ...data, updatedAt: serverTimestamp() });
    await recalculateTotalHafalan(studentId);
  }
};

export const deleteReport = async (reportId: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const reportRef = doc(db, 'laporan', reportId);
  const snap = await getDoc(reportRef);
  if (snap.exists()) {
    const studentId = snap.data().studentId;
    await deleteDoc(reportRef);
    await recalculateTotalHafalan(studentId);
  }
};

// --- SEMESTER REPORT SPECIAL HANDLING ---

export const saveSemesterReport = async (report: SemesterReport): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  
  const safeYear = report.academicYear.replace(/[\/\s]/g, '');
  const reportId = `${report.studentId}_${safeYear}_${report.semester}_rapor`;
  const docRef = doc(db, 'rapor_semester', reportId);
  
  await setDoc(docRef, { ...report, id: reportId, updatedAt: serverTimestamp() });

  // Parsing data hafalan dari string rapor untuk dijadikan baseline
  let baseJuz = 0, basePages = 0;
  try {
    const jumlahStr = report.statusHafalan?.dimiliki?.jumlah || "";
    const juzMatch = jumlahStr.match(/(\d+)\s*Juz/i);
    const pageMatch = jumlahStr.match(/(\d+)\s*Hal/i);
    if (juzMatch) baseJuz = parseInt(juzMatch[1]);
    if (pageMatch) basePages = parseInt(pageMatch[1]);
  } catch (e) { console.log("Parse error", e); }

  const reportPayload: any = {
    studentId: report.studentId,
    studentName: "Student", 
    teacherId: report.teacherId,
    type: 'Laporan Semester', // Kunci untuk dideteksi sebagai Baseline
    month: report.semester,
    academicYear: report.academicYear,
    tilawah: { method: 'Al-Quran', individual: '-', classical: '-' },
    tahfizh: { individual: '-', classical: '-' },
    totalHafalan: { juz: baseJuz, pages: basePages, lines: 0 }, 
    notes: "Baseline Rapor Semester",
    date: new Date().toISOString().split('T')[0]
  };

  // Simpan via saveSDQReport agar logic deterministic ID & recalculate jalan otomatis
  await saveSDQReport(reportPayload);
};

export const deleteSemesterReport = async (studentId: string, academicYear: string, semester: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const safeYear = academicYear.replace(/[\/\s]/g, '');
  
  // 1. Hapus Dokumen Rapor
  const raporId = `${studentId}_${safeYear}_${semester}_rapor`;
  await deleteDoc(doc(db, 'rapor_semester', raporId));

  // 2. Hapus Baseline di Collection Laporan
  // ID Match: studentId_20252026_Ganjil_smt
  const baselineId = `${studentId}_${safeYear}_${semester}_smt`;
  const baselineRef = doc(db, 'laporan', baselineId);
  const snap = await getDoc(baselineRef);
  if (snap.exists()) {
    await deleteDoc(baselineRef);
    // 3. Recalculate: Hafalan akan turun/kembali ke state sebelumnya
    await recalculateTotalHafalan(studentId);
  }
};

export const getSemesterReport = async (studentId: string, academicYear: string, semester: string): Promise<SemesterReport | null> => {
  if (!db) return null;
  const safeYear = academicYear.replace(/[\/\s]/g, '');
  const reportId = `${studentId}_${safeYear}_${semester}_rapor`;
  const docSnap = await getDoc(doc(db, 'rapor_semester', reportId));
  return docSnap.exists() ? docSnap.data() as SemesterReport : null;
};

// --- SUPPORTING SERVICES (UNCHANGED) ---

export interface ClassSummary {
  className: string;
  totalStudents: number;
  status: string;
  halaqahs: { teacherName: string, studentCount: number }[];
}

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

export const getStudentsByTeacher = async (teacherId: string): Promise<Student[]> => {
  if (!db) return [];
  const q = query(collection(db, 'siswa'), where('teacherId', '==', teacherId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};

export const getHalaqahMonthlyReport = async (teacherId: string, period: string): Promise<HalaqahMonthlyReport | null> => {
  if (!db) return null;
  const safePeriod = period.replace(/\s/g, '_');
  const reportId = `${teacherId}_${safePeriod}`;
  const docSnap = await getDoc(doc(db, 'halaqah_monthly_reports', reportId));
  return docSnap.exists() ? docSnap.data() as HalaqahMonthlyReport : null;
};

export const saveHalaqahMonthlyReport = async (data: HalaqahMonthlyReport): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const safePeriod = data.period.replace(/\s/g, '_');
  const reportId = `${data.teacherId}_${safePeriod}`;
  const docRef = doc(db, 'halaqah_monthly_reports', reportId);
  await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
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

export const getAllStudents = async (): Promise<Student[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'siswa'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};

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

export const getAllSemesterReports = async (): Promise<SemesterReport[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'rapor_semester'));
  return snapshot.docs.map(doc => ({ ...doc.data() } as SemesterReport));
};

export const saveHalaqahEvaluation = async (evalData: Omit<HalaqahEvaluation, 'id' | 'createdAt'>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const safePeriod = evalData.period.replace(/[\s\/]/g, '_');
  const evalId = `${evalData.teacherId}_${safePeriod}`;
  const docRef = doc(db, 'evaluasi_halaqah', evalId);
  await setDoc(docRef, {
    ...evalData,
    id: evalId,
    createdAt: new Date().toISOString(),
    updatedAt: serverTimestamp()
  });
};

export const getHalaqahEvaluation = async (teacherId: string, period: string): Promise<HalaqahEvaluation | null> => {
  if (!db) return null;
  const safePeriod = period.replace(/[\s\/]/g, '_');
  const evalId = `${teacherId}_${safePeriod}`;
  const docSnap = await getDoc(doc(db, 'evaluasi_halaqah', evalId));
  return docSnap.exists() ? docSnap.data() as HalaqahEvaluation : null;
};

export const subscribeToEvaluationsByTeacher = (teacherId: string, onUpdate: (evaluations: HalaqahEvaluation[]) => void): Unsubscribe => {
  if (!db) return () => {};
  const q = query(collection(db, 'evaluasi_halaqah'), where('teacherId', '==', teacherId));
  return onSnapshot(q, (snapshot) => {
    const evals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HalaqahEvaluation));
    onUpdate(evals);
  });
};

export const subscribeToStudentsByTeacher = (teacherId: string, onUpdate: (students: Student[]) => void): Unsubscribe => {
  if (!db) return () => {}; 
  const q = query(collection(db, 'siswa'), where('teacherId', '==', teacherId));
  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    onUpdate(students);
  });
};

export const getClassHalaqahSummary = async (): Promise<ClassSummary[]> => {
  if (!db) return [];
  const studentsSnap = await getDocs(collection(db, 'siswa'));
  const teachersSnap = await getDocs(collection(db, 'users'));
  const allStudents = studentsSnap.docs.map(d => d.data() as Student);
  const teacherMap: Record<string, string> = {};
  teachersSnap.docs.forEach(d => {
    const data = d.data() as User;
    teacherMap[d.id] = data.nickname || data.name;
  });
  const classGroups: Record<string, {
    className: string;
    totalStudents: number;
    halaqahMap: Record<string, { teacherName: string, studentCount: number }>;
  }> = {};
  allStudents.forEach(student => {
    const name = student.className;
    if (!classGroups[name]) {
      classGroups[name] = { className: name, totalStudents: 0, halaqahMap: {} };
    }
    classGroups[name].totalStudents++;
    const tId = student.teacherId;
    if (!classGroups[name].halaqahMap[tId]) {
      classGroups[name].halaqahMap[tId] = {
        teacherName: teacherMap[tId] || 'Guru Tidak Teridentifikasi',
        studentCount: 0
      };
    }
    classGroups[name].halaqahMap[tId].studentCount++;
  });
  return Object.values(classGroups).map(group => ({
    className: group.className,
    totalStudents: group.totalStudents,
    status: (group.totalStudents > 0 ? 'Aktif' : 'Kosong'),
    halaqahs: Object.values(group.halaqahMap)
  })).sort((a, b) => a.className.localeCompare(b.className));
};

export const getPerformancePerClass = async (): Promise<{label: string, value: number}[]> => {
  if (!db) return [];
  const reports = await getAllSemesterReports();
  const students = await getAllStudents();
  const classPerformance: Record<string, { total: number, count: number }> = {};
  reports.forEach(r => {
    const student = students.find(s => s.id === r.studentId);
    if (student) {
      const className = student.className;
      if (!classPerformance[className]) {
        classPerformance[className] = { total: 0, count: 0 };
      }
      classPerformance[className].total += r.assessments?.pencapaianTarget || 0;
      classPerformance[className].count++;
    }
  });
  return Object.entries(classPerformance).map(([label, data]) => ({
    label,
    value: data.count > 0 ? Math.round(data.total / data.count) : 0
  })).sort((a, b) => a.label.localeCompare(b.label));
};

export const getLatestTeacherActivities = async (limitCount: number): Promise<any[]> => {
  if (!db) return [];
  const teachers = await getAllTeachers();
  const mockActions = ['Menginput Laporan Bulanan', 'Menambahkan catatan evaluasi', 'Menyelesaikan target setoran hafalan', 'Mengupdate profil siswa', 'Input Nilai Rapor'];
  return teachers.slice(0, limitCount).map((t, i) => ({
    id: `act-${t.id}-${i}`,
    teacherName: t.nickname || t.name,
    initials: (t.nickname || t.name).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    actionDescription: mockActions[i % mockActions.length],
    time: `${String(8 + i).padStart(2, '0')}:30`
  }));
};
