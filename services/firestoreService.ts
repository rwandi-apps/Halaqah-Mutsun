
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
 * Contoh: 
 * - Juli 2025 (2025/2026) -> 202507
 * - Januari 2026 (2025/2026) -> 202601
 * - Semester Ganjil (2025/2026) -> 202512 (Dianggap checkpoint Desember)
 * - Semester Genap (2025/2026) -> 202606 (Dianggap checkpoint Juni)
 */
const generatePeriodCode = (academicYear: string, period: string, type: string): number => {
  try {
    // Normalisasi Tahun Ajaran "2025/2026" atau "2025 / 2026"
    const years = academicYear.replace(/\s/g, '').split('/');
    const startYear = parseInt(years[0]);
    const endYear = parseInt(years[1]);

    if (!startYear || !endYear) return 0;

    const normalizePeriod = period.trim().toLowerCase();
    
    // Mapping Semester ke Bulan Akhir (Desember / Juni)
    if (type === 'Laporan Semester') {
      if (normalizePeriod === 'ganjil') return (startYear * 100) + 12;
      if (normalizePeriod === 'genap') return (endYear * 100) + 6;
    }

    // Mapping Bulan Indonesia
    const monthMap: Record<string, number> = {
      'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12,
      'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6
    };

    const monthIndex = monthMap[normalizePeriod];
    if (!monthIndex) return 0; // Fallback safety

    // Tentukan Tahun Kalender berdasarkan bulan
    // Juli-Desember ikut StartYear, Januari-Juni ikut EndYear
    const year = (monthIndex >= 7) ? startYear : endYear;
    
    return (year * 100) + monthIndex;
  } catch (e) {
    console.error("Error generating period code", e);
    return 0;
  }
};

/**
 * Wrapper aman untuk perhitungan halaman.
 * Mencegah crash jika string input korup atau null.
 */
const safeCalculatePages = (rangeStr: string | undefined): number => {
  if (!rangeStr || rangeStr === '-' || rangeStr.trim() === '') return 0;
  try {
    const result = calculateFromRangeString(rangeStr);
    return Number(result.pages || 0);
  } catch (error) {
    console.warn("Calculation skipped for invalid range:", rangeStr);
    return 0;
  }
};

// --- CORE BUSINESS LOGIC ---

/**
 * ENGINE KALKULASI HAFALAN (Single Source of Truth)
 * 1. Ambil semua laporan siswa.
 * 2. Sortir berdasarkan PeriodCode (YYYYMM) descending.
 * 3. Cari Laporan Semester (Baseline) terbaru.
 * 4. Tambahkan delta Laporan Bulanan HANYA jika PeriodCode > Baseline.
 * 5. Update field siswa.totalHafalan.
 */
export const recalculateTotalHafalan = async (studentId: string): Promise<void> => {
  if (!db) return;

  try {
    const studentRef = doc(db, 'siswa', studentId);
    
    // Ambil SEMUA laporan (Bulanan & Semester)
    const reportsQuery = query(collection(db, 'laporan'), where('studentId', '==', studentId));
    const reportsSnap = await getDocs(reportsQuery);
    
    const allReports = reportsSnap.docs.map(d => {
      const data = d.data() as Report;
      // Generate periodCode on the fly untuk akurasi sorting data lama
      const pCode = generatePeriodCode(data.academicYear || '', data.month, data.type);
      return { ...data, _periodCode: pCode };
    });

    // Sort Descending (Terbaru ke Terlama)
    allReports.sort((a, b) => b._periodCode - a._periodCode);

    let baselineFound = false;
    let totalPagesAccumulated = 0;

    // Logic: Cari Baseline Semester Teratas
    for (const report of allReports) {
      if (!baselineFound && report.type === 'Laporan Semester') {
        // FOUND BASELINE: Ambil total snapshot dari semester ini
        const baseJuz = Number(report.totalHafalan?.juz || 0);
        const basePages = Number(report.totalHafalan?.pages || 0);
        totalPagesAccumulated += (baseJuz * 20) + basePages;
        baselineFound = true;
        // Stop loop, laporan di bawah ini (lebih lama) sudah ter-cover oleh semester ini
        break; 
      }
    }

    // Jika Baseline ditemukan, kita hanya perlu menambahkan Delta dari Laporan Bulanan
    // yang periodCode-nya LEBIH BESAR dari Baseline.
    // Jika TIDAK ada Baseline, kita jumlahkan semua Laporan Bulanan.
    
    // Reset loop untuk summing delta
    if (baselineFound) {
      const baselineReport = allReports.find(r => r.type === 'Laporan Semester');
      const baselineCode = baselineReport?._periodCode || 0;

      // Sum delta hanya untuk bulan di ATAS semester
      allReports.forEach(report => {
        if (report.type === 'Laporan Bulanan' && report._periodCode > baselineCode) {
          totalPagesAccumulated += safeCalculatePages(report.tahfizh?.individual);
        }
      });
    } else {
      // Tidak ada rapor semester sama sekali -> Sum semua bulanan
      allReports.forEach(report => {
        if (report.type === 'Laporan Bulanan') {
          totalPagesAccumulated += safeCalculatePages(report.tahfizh?.individual);
        }
      });
    }

    // Konversi ke format {juz, pages}
    const finalHafalan = {
      juz: Math.floor(totalPagesAccumulated / 20),
      pages: totalPagesAccumulated % 20,
      lines: 0
    };

    // Atomic Update ke Siswa
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
  
  // ID Format: studentId_20252026_Januari_bln
  const deterministicId = `${reportData.studentId}_${safeYear}_${safePeriod}_${safeType}`;
  const reportRef = doc(db, 'laporan', deterministicId);
  
  // 2. Hitung Period Code untuk sorting logic
  const pCode = generatePeriodCode(reportData.academicYear || '', reportData.month, reportData.type);

  // 3. Simpan dengan setDoc (Overwrite jika ID sama)
  await setDoc(reportRef, {
    ...reportData,
    id: deterministicId,
    periodCode: pCode, // Simpan code ini untuk query masa depan
    createdAt: serverTimestamp(), // Selalu gunakan server timestamp
    updatedAt: serverTimestamp()
  });

  // 4. Trigger Recalculate Total
  await recalculateTotalHafalan(reportData.studentId);
};

export const updateReport = async (reportId: string, data: Partial<Report>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  
  const reportRef = doc(db, 'laporan', reportId);
  const snap = await getDoc(reportRef);
  
  if (snap.exists()) {
    const studentId = snap.data().studentId;
    
    // Update data
    await updateDoc(reportRef, { 
      ...data, 
      updatedAt: serverTimestamp() 
    });
    
    // Recalculate wajib dipanggil setelah update apapun pada laporan
    await recalculateTotalHafalan(studentId);
  }
};

export const deleteReport = async (reportId: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  
  const reportRef = doc(db, 'laporan', reportId);
  const snap = await getDoc(reportRef);
  
  if (snap.exists()) {
    const studentId = snap.data().studentId;
    
    // Hapus dokumen
    await deleteDoc(reportRef);
    
    // Recalculate: Total hafalan akan turun otomatis karena dokumen hilang dari query
    await recalculateTotalHafalan(studentId);
  }
};

// --- SEMESTER REPORT SPECIAL HANDLING ---

export const saveSemesterReport = async (report: SemesterReport): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  
  // Format ID: studentId_20252026_Ganjil_rapor
  const safeYear = report.academicYear.replace(/[\/\s]/g, '');
  const reportId = `${report.studentId}_${safeYear}_${report.semester}_rapor`;
  const docRef = doc(db, 'rapor_semester', reportId);
  
  await setDoc(docRef, { 
    ...report, 
    id: reportId,
    updatedAt: serverTimestamp() 
  });

  // PENTING: Simpan juga sebagai 'Laporan Semester' di collection 'laporan'
  // agar engine recalculate bisa membacanya sebagai baseline hafalan.
  // Kita konversi data SemesterReport menjadi format Report umum.
  
  // Parsing jumlah hafalan dari string "1 Juz 5 Halaman" (Contoh) ke Object
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
    studentName: "Student", // Nama akan diambil di UI, atau fetch ulang jika perlu (minor)
    teacherId: report.teacherId,
    type: 'Laporan Semester',
    month: report.semester, // Ganjil / Genap
    academicYear: report.academicYear,
    tilawah: { method: 'Al-Quran', individual: '-', classical: '-' },
    tahfizh: { individual: '-', classical: '-' },
    totalHafalan: { juz: baseJuz, pages: basePages, lines: 0 }, // Baseline Point
    notes: "Baseline Rapor Semester",
    date: new Date().toISOString().split('T')[0]
  };

  // Simpan ke collection laporan untuk trigger baseline
  // Gunakan fungsi saveSDQReport agar logic ID dan Recalculate berjalan otomatis
  await saveSDQReport(reportPayload);
};

export const deleteSemesterReport = async (studentId: string, academicYear: string, semester: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  
  const safeYear = academicYear.replace(/[\/\s]/g, '');
  
  // 1. Hapus Dokumen Rapor Fisik
  const raporId = `${studentId}_${safeYear}_${semester}_rapor`;
  await deleteDoc(doc(db, 'rapor_semester', raporId));

  // 2. Hapus Entry Baseline di Collection Laporan
  // ID harus match dengan logic di saveSDQReport: studentId_20252026_Ganjil_smt
  const baselineId = `${studentId}_${safeYear}_${semester}_smt`;
  const baselineRef = doc(db, 'laporan', baselineId);
  
  // Cek eksistensi dulu untuk keamanan
  const snap = await getDoc(baselineRef);
  if (snap.exists()) {
    await deleteDoc(baselineRef);
    // 3. Recalculate: Hafalan akan turun/kembali ke baseline sebelumnya
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

// --- SUPPORTING SERVICES ---

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

export const getReportsByTeacher = async (teacherId: string): Promise<Report[]> => {
  if (!db) return [];
  const q = query(
    collection(db, 'laporan'), 
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    // Handle Timestamp conversion for UI
    const createdAt = data.createdAt instanceof Timestamp 
      ? data.createdAt.toDate().toISOString() 
      : (data.createdAt || new Date().toISOString());
    return { ...data, id: doc.id, createdAt } as Report;
  });
};

export const subscribeToReportsByTeacher = (teacherId: string, onUpdate: (reports: Report[]) => void): Unsubscribe => {
  if (!db) return () => {};
  const q = query(
    collection(db, 'laporan'), 
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate().toISOString() 
        : (data.createdAt || new Date().toISOString());
      return { ...data, id: doc.id, createdAt } as Report;
    });
    onUpdate(reports);
  });
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
    createdAt: new Date().toISOString(), // Fallback string for UI that needs immediate display
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
