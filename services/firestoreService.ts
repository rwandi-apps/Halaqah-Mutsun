import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { User, Student, Report, Role } from '../types';
import { extractClassLevel } from './sdqTargets';

/* =========================
   USERS / TEACHERS
========================= */

export const getAllTeachers = async (): Promise<User[]> => {
  if (!db) return [];

  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || 'Tanpa Nama',
        nickname: data.nickname || '',
        email: data.email || '',
        role: data.role || 'GURU',
        photoURL: data.photoURL || '',
        createdAt: data.createdAt || ''
      } as User;
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
};

export const getTeacherById = async (id: string): Promise<User | undefined> => {
  if (!db) return undefined;

  try {
    const ref = doc(db, 'users', id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return undefined;

    return {
      id: snap.id,
      ...snap.data()
    } as User;
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return undefined;
  }
};

export const addTeacher = async (
  name: string,
  email: string,
  nickname: string,
  role: Role
): Promise<User> => {
  if (!db) throw new Error('Firestore not initialized');

  const payload = {
    name,
    nickname,
    email,
    role,
    createdAt: serverTimestamp()
  };

  const ref = await addDoc(collection(db, 'users'), payload);

  return {
    id: ref.id,
    name,
    nickname,
    email,
    role,
    createdAt: new Date().toISOString()
  } as User;
};

/* =========================
   STUDENTS
========================= */

export const getAllStudents = async (): Promise<Student[]> => {
  if (!db) return [];

  try {
    const snapshot = await getDocs(collection(db, 'siswa'));
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Student));
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

export const getStudentsByTeacher = async (
  teacherId: string
): Promise<Student[]> => {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'siswa'),
      where('teacherId', '==', teacherId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Student));
  } catch (error) {
    console.error('Error fetching students by teacher:', error);
    return [];
  }
};

export const subscribeToStudentsByTeacher = (
  teacherId: string,
  onUpdate: (students: Student[]) => void
): Unsubscribe => {
  if (!db) return () => {};

  const q = query(
    collection(db, 'siswa'),
    where('teacherId', '==', teacherId)
  );

  return onSnapshot(
    q,
    snapshot => {
      const students = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Student));

      onUpdate(students);
    },
    error => {
      console.error('Student listener error:', error);
    }
  );
};

export const addStudent = async (
  student: Omit<Student, 'id' | 'attendance' | 'behaviorScore' | 'createdAt'>
): Promise<Student> => {
  if (!db) throw new Error('Firestore not initialized');

  const classLevel = extractClassLevel(student.className);

  const payload = {
    ...student,
    classLevel,
    attendance: 100,
    behaviorScore: 10,
    createdAt: serverTimestamp()
  };

  const ref = await addDoc(collection(db, 'siswa'), payload);

  return {
    id: ref.id,
    ...student,
    classLevel,
    attendance: 100,
    behaviorScore: 10,
    createdAt: new Date().toISOString()
  } as Student;
};

/* =========================
   REPORTS
========================= */

export const getReportsByTeacher = async (
  teacherId: string
): Promise<Report[]> => {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'laporan'),
      where('teacherId', '==', teacherId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Report));
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
};

export const subscribeToReportsByTeacher = (
  teacherId: string,
  onUpdate: (reports: Report[]) => void
): Unsubscribe => {
  if (!db) return () => {};

  const q = query(
    collection(db, 'laporan'),
    where('teacherId', '==', teacherId)
  );

  return onSnapshot(
    q,
    snapshot => {
      const reports = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Report));

      reports.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );

      onUpdate(reports);
    },
    error => {
      console.error('Report listener error:', error);
    }
  );
};

export const addReport = async (
  report: Omit<Report, 'id' | 'createdAt'>
): Promise<Report> => {
  if (!db) throw new Error('Firestore not initialized');

  const batch = writeBatch(db);

  const reportRef = doc(collection(db, 'laporan'));
  const reportData = {
    ...report,
    createdAt: new Date().toISOString()
  };

  batch.set(reportRef, reportData);

  const studentRef = doc(db, 'siswa', report.studentId);

  let latestProgress = '-';

  const pickProgress = (value?: string) => {
    if (!value || value === '-') return;
    const parts = value.split(' - ');
    latestProgress = parts.length > 1 ? parts[1].trim() : parts[0].trim();
  };

  pickProgress(report.tahfizh?.individual);
  pickProgress(report.tahfizh?.classical);
  pickProgress(report.tilawah?.individual);

  const studentUpdate: any = {
    currentProgress: latestProgress
  };

  if (
    report.totalHafalan &&
    (report.totalHafalan.juz > 0 || report.totalHafalan.pages > 0)
  ) {
    studentUpdate.totalHafalan = report.totalHafalan;
  }

  batch.update(studentRef, studentUpdate);
  await batch.commit();

  return {
    id: reportRef.id,
    ...reportData
  } as Report;
};
