
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
import { User, Student, Report, Role, SemesterReport, HalaqahEvaluation } from '../types';
import { extractClassLevel } from './sdqTargets';
import { TahfizhEngineSDQ } from './tahfizh/engine';

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
  const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
  return reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

// --- DASHBOARD WIDGET HELPERS ---

export const getPerformancePerClass = async (): Promise<{label: string, value: number}[]> => {
  if (!db) return [];
  const reports = await getAllSemesterReports();
  const students = await getAllStudents();
  
  const studentClassMap: Record<string, string> = {};
  students.forEach(s => studentClassMap[s.id] = s.className);

  const classMap: Record<string, { total: number, count: number }> = {};
  
  reports.forEach(r => {
    const studentInfo = studentClassMap[r.studentId];
    if (!studentInfo) return;
    
    // Extract short class name (e.g. "Kelas 1")
    const match = studentInfo.match(/Kelas\s*\d+/i);
    const className = match ? match[0] : studentInfo;
    
    const score = r.assessments?.pencapaianTarget || 0;
    if (!classMap[className]) classMap[className] = { total: 0, count: 0 };
    classMap[className].total += score;
    classMap[className].count += 1;
  });

  return Object.entries(classMap).map(([label, data]) => ({
    label,
    value: Math.round(data.total / data.count)
  })).sort((a, b) => a.label.localeCompare(b.label));
};

export const getLatestTeacherActivities = async (limitCount: number = 5): Promise<any[]> => {
  if (!db) return [];
  const teachers = await getAllTeachers();
  const teacherMap: Record<string, string> = {};
  teachers.forEach(t => teacherMap[t.id] = t.nickname || t.name);

  // Combine activities from 'laporan'
  const q = query(collection(db, 'laporan'), orderBy('createdAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  
  return snap.docs.map(doc => {
    const data = doc.data();
    const name = teacherMap[data.teacherId] || 'Guru';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    // Format relative time (very basic)
    const date = new Date(data.createdAt);
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    return {
      id: doc.id,
      teacherName: name,
      initials,
      actionDescription: `Menginput ${data.type} - ${data.studentName}`,
      time: timeStr
    };
  });
};

// --- HALAQAH EVALUATIONS (KOORDINATOR -> GURU) ---

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

export const getLatestEvaluationForTeacher = async (teacherId: string): Promise<HalaqahEvaluation | null> => {
  if (!db) return null;
  const q = query(
    collection(db, 'evaluasi_halaqah'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as HalaqahEvaluation;
};

// --- REALTIME LISTENERS ---

export const subscribeToEvaluationsByTeacher = (
  teacherId: string,
  onUpdate: (evaluations: HalaqahEvaluation[]) => void
): Unsubscribe => {
  if (!db) return () => {};
  // Menggunakan query sederhana agar tidak butuh composite index
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
  const docRef = doc(db, 'rapor_semester', reportId);
  await deleteDoc(docRef);
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
    transaction.update(studentRef, { totalHafalan: updatedTotalHafalan, currentProgress: updatedProgress, lastUpdated: serverTimestamp() });
    transaction.set(reportRef, { ...reportData, totalHafalan: updatedTotalHafalan, createdAt: new Date().toISOString() });
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
