
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  doc, 
  getDoc,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Student, Report, Role } from '../types';
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

export const addTeacher = async (name: string, email: string, nickname: string, role: Role): Promise<User> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, 'users'), { name, nickname, email, role, createdAt: serverTimestamp() });
  return { id: docRef.id, name, nickname, email, role, createdAt: new Date().toISOString() } as User;
};

// --- FETCH FUNCTIONS ---

// Added missing getStudentsByTeacher function
export const getStudentsByTeacher = async (teacherId: string): Promise<Student[]> => {
  if (!db) return [];
  const q = query(collection(db, 'siswa'), where('teacherId', '==', teacherId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};

// Added missing getReportsByTeacher function
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
  // onSnapshot akan terpanggil saat ada data yang dihapus dari console
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

export const addStudent = async (student: Omit<Student, 'id' | 'attendance' | 'behaviorScore'>): Promise<Student> => {
  if (!db) throw new Error("Firestore not initialized");
  const level = extractClassLevel(student.className);
  const docRef = await addDoc(collection(db, 'siswa'), { ...student, classLevel: level, attendance: 100, behaviorScore: 10, createdAt: serverTimestamp() });
  return { id: docRef.id, ...student, classLevel: level, attendance: 100, behaviorScore: 10, createdAt: new Date().toISOString() } as Student;
};

export const addReport = async (report: Omit<Report, 'id' | 'createdAt'>): Promise<Report> => {
  if (!db) throw new Error("Firestore not initialized");
  const batch = writeBatch(db);
  const newReportRef = doc(collection(db, 'laporan'));
  const createdAt = new Date().toISOString();
  batch.set(newReportRef, { ...report, createdAt });
  
  // Update denormalisasi progres di doc siswa
  const studentRef = doc(db, 'siswa', report.studentId);
  const latestProgress = report.tahfizh.individual.split(' - ')[1] || report.tahfizh.individual;
  batch.update(studentRef, { 
    currentProgress: latestProgress,
    ...(report.totalHafalan ? { totalHafalan: report.totalHafalan } : {})
  });
  
  await batch.commit();
  return { id: newReportRef.id, ...report, createdAt } as Report;
};

export const getAllStudents = async (): Promise<Student[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'siswa'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};
