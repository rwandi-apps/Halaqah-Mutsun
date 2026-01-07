
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
  setDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Student, Report, Role, SemesterReport, HalaqahEvaluation, HalaqahMonthlyReport } from '../types';
import { extractClassLevel } from './sdqTargets';

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

// --- DATA KLASIKAL SERVICE ---

export const saveHalaqahMonthlyReport = async (data: HalaqahMonthlyReport): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const reportId = `${data.teacherId}_${data.period.replace(/\s/g, '_')}`;
  const docRef = doc(db, 'halaqah_monthly_reports', reportId);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const getHalaqahMonthlyReport = async (teacherId: string, period: string): Promise<HalaqahMonthlyReport | null> => {
  if (!db) return null;
  const reportId = `${teacherId}_${period.replace(/\s/g, '_')}`;
  const docSnap = await getDoc(doc(db, 'halaqah_monthly_reports', reportId));
  return docSnap.exists() ? docSnap.data() as HalaqahMonthlyReport : null;
};

// --- AGGREGATION SERVICE ---

export interface ClassSummary {
  className: string;
  totalStudents: number;
  status: 'Aktif' | 'Kosong';
  halaqahs: {
    teacherName: string;
    studentCount: number;
  }[];
}

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
      classGroups[name] = {
        className: name,
        totalStudents: 0,
        halaqahMap: {} 
      };
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
    status: (group.totalStudents > 0 ? 'Aktif' : 'Kosong') as 'Aktif' | 'Kosong',
    halaqahs: Object.values(group.halaqahMap)
  })).sort((a, b) => a.className.localeCompare(b.className));
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
  const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
  return reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getAllStudents = async (): Promise<Student[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'siswa'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};

export const getAllSemesterReports = async (): Promise<SemesterReport[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'rapor_semester'));
  return snapshot.docs.map(doc => ({ ...doc.data() } as SemesterReport));
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
  const mockActions = [
    'Menginput Laporan Bulanan',
    'Menambahkan catatan evaluasi',
    'Menyelesaikan target setoran hafalan',
    'Mengupdate profil siswa',
    'Input Nilai Rapor'
  ];

  return teachers.slice(0, limitCount).map((t, i) => ({
    id: `act-${t.id}-${i}`,
    teacherName: t.nickname || t.name,
    initials: (t.nickname || t.name).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    actionDescription: mockActions[i % mockActions.length],
    time: `${String(8 + i).padStart(2, '0')}:30`
  }));
};

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
  const docRef = doc(db, 'rapor_semester', reportId);
  await deleteDoc(docRef);
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

// ALUR DATA: UI (Guru Laporan) -> Firestore (Laporan & Update Siswa)
export const saveSDQReport = async (reportData: Omit<Report, 'id' | 'createdAt'>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  await runTransaction(db, async (transaction) => {
    const studentRef = doc(db, 'siswa', reportData.studentId);
    const reportRef = doc(collection(db, 'laporan'));
    const studentSnap = await transaction.get(studentRef);
    
    if (!studentSnap.exists()) throw new Error("Siswa tidak ditemukan");
    const studentData = studentSnap.data() as Student;
    
    let updatedTotalHafalan = studentData.totalHafalan || { juz: 0, pages: 0, lines: 0 };
    let updatedProgress = studentData.currentProgress || 'Belum Ada';
    
    if (reportData.type === 'Laporan Semester' && reportData.totalHafalan) {
      updatedTotalHafalan = reportData.totalHafalan;
      const parts = reportData.tahfizh.individual.split(' - ');
      updatedProgress = parts.length > 1 ? parts[1].trim() : parts[0].trim();
    } 

    transaction.update(studentRef, { 
      totalHafalan: updatedTotalHafalan, 
      currentProgress: updatedProgress, 
      attendance: reportData.attendance !== undefined ? reportData.attendance : studentData.attendance,
      behaviorScore: reportData.behaviorScore !== undefined ? reportData.behaviorScore : studentData.behaviorScore,
      lastUpdated: serverTimestamp() 
    });

    transaction.set(reportRef, { 
      ...reportData, 
      totalHafalan: updatedTotalHafalan, 
      createdAt: new Date().toISOString() 
    });
  });
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

export const subscribeToEvaluationsByTeacher = (
  teacherId: string,
  onUpdate: (evaluations: HalaqahEvaluation[]) => void
): Unsubscribe => {
  if (!db) return () => {};
  const q = query(collection(db, 'evaluasi_halaqah'), where('teacherId', '==', teacherId));
  return onSnapshot(q, (snapshot) => {
    const evals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HalaqahEvaluation));
    onUpdate(evals);
  });
};

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
