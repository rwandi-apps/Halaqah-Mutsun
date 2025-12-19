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
Unsubscribe,
orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Student, Report, Role } from '../types';
import { extractClassLevel } from './sdqTargets';

export const getAllTeachers = async (): Promise<User[]> => {
if (!db) return [];
try {
const snapshot = await getDocs(collection(db, 'users'));
return snapshot.docs.map(doc => {
const data = doc.data();
return {
id: doc.id,
name: data.name || "Tanpa Nama",
nickname: data.nickname || "",
email: data.email || "",
role: data.role || "GURU",
photoURL: data.photoURL || "",
} as User;
});
} catch (error) {
console.error("Error fetching teachers:", error);
return [];
}
};

export const getTeacherById = async (id: string): Promise<User | undefined> => {
if (!db) return undefined;
try {
const docRef = doc(db, 'users', id);
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
return { id: docSnap.id, ...docSnap.data() } as User;
}
return undefined;
} catch (error) {
console.error("Error fetching teacher:", error);
return undefined;
}
};

export const addTeacher = async (name: string, email: string, nickname: string, role: Role): Promise<User> => {
if (!db) throw new Error("Firestore not initialized");

const newUser = {
name,
nickname,
email,
role,
createdAt: serverTimestamp()
};

const docRef = await addDoc(collection(db, 'users'), newUser);

  // // Fix: Use a string timestamp for the return object to satisfy the User interface requirements
return {
id: docRef.id,
    ...newUser,
    role 
    name,
    nickname,
    email,
    role,
    createdAt: new Date().toISOString()
} as User;
};

// --- STUDENTS ---

export const getAllStudents = async (): Promise<Student[]> => {
if (!db) return [];
try {
const snapshot = await getDocs(collection(db, 'siswa'));
return snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
} as Student));
} catch (error) {
console.error("Error fetching students:", error);
return [];
}
};

export const getStudentsByTeacher = async (teacherId: string): Promise<Student[]> => {
if (!db) return [];
try {
const q = query(collection(db, 'siswa'), where('teacherId', '==', teacherId));
const snapshot = await getDocs(q);
return snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
} as Student));
} catch (error) {
console.error("Error fetching students by teacher:", error);
return [];
}
};

export const subscribeToStudentsByTeacher = (
teacherId: string, 
onUpdate: (students: Student[]) => void
): Unsubscribe => {
if (!db) return () => {}; 

const q = query(collection(db, 'siswa'), where('teacherId', '==', teacherId));

const unsubscribe = onSnapshot(q, (snapshot) => {
const students = snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
} as Student));
onUpdate(students);
}, (error) => {
console.error("Error listening to student updates:", error);
});

return unsubscribe;
};

export const addStudent = async (student: Omit<Student, 'id' | 'attendance' | 'behaviorScore'>): Promise<Student> => {
if (!db) throw new Error("Firestore not initialized");

const level = extractClassLevel(student.className);

const newStudentData = {
...student,
classLevel: level,
attendance: 100, 
behaviorScore: 10,
createdAt: serverTimestamp()
};

const docRef = await addDoc(collection(db, 'siswa'), newStudentData);

  // // Fix: Return object with string createdAt instead of FieldValue to match Student interface
return {
id: docRef.id,
    ...newStudentData
    ...student,
    classLevel: level,
    attendance: 100,
    behaviorScore: 10,
    createdAt: new Date().toISOString()
} as Student;
};

// --- REPORTS ---

export const getReportsByTeacher = async (teacherId: string): Promise<Report[]> => {
if (!db) return [];
try {
const q = query(collection(db, 'laporan'), where('teacherId', '==', teacherId));
const snapshot = await getDocs(q);
return snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
} as Report));
} catch (error) {
console.error("Error fetching reports:", error);
return [];
}
};

/**
* REALTIME REPORTS LISTENER
* Wajib digunakan agar UI tahu jika ada laporan yang dihapus/ditambah.
*/
export const subscribeToReportsByTeacher = (
teacherId: string,
onUpdate: (reports: Report[]) => void
): Unsubscribe => {
if (!db) return () => {};

// Query reports by teacher
const q = query(
collection(db, 'laporan'), 
where('teacherId', '==', teacherId)
);

const unsubscribe = onSnapshot(q, (snapshot) => {
const reports = snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
} as Report));

// Sort client-side is safer for simple queries
reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

onUpdate(reports);
}, (error) => {
console.error("Error listening to report updates:", error);
});

return unsubscribe;
};

export const addReport = async (report: Omit<Report, 'id' | 'createdAt'>): Promise<Report> => {
if (!db) throw new Error("Firestore not initialized");

const batch = writeBatch(db);

const newReportRef = doc(collection(db, 'laporan'));
const newReportData = {
...report,
createdAt: new Date().toISOString()
};

batch.set(newReportRef, newReportData);

const studentRef = doc(db, 'siswa', report.studentId);

let latestProgress = "-";
const isValid = (s: string) => s && s !== '-' && s.trim() !== '';

if (isValid(report.tahfizh.individual)) {
const parts = report.tahfizh.individual.split(' - ');
latestProgress = parts.length > 1 ? parts[1].trim() : parts[0].trim();
} else if (isValid(report.tahfizh.classical)) {
const parts = report.tahfizh.classical.split(' - ');
latestProgress = parts.length > 1 ? parts[1].trim() : parts[0].trim();
} else if (isValid(report.tilawah.individual)) {
const parts = report.tilawah.individual.split(' - ');
latestProgress = parts.length > 1 ? parts[1].trim() : parts[0].trim();
}

const studentUpdate: any = {
currentProgress: latestProgress
};

if (report.totalHafalan && (report.totalHafalan.juz > 0 || report.totalHafalan.pages > 0)) {
studentUpdate.totalHafalan = report.totalHafalan;
}

batch.update(studentRef, studentUpdate);
await batch.commit();

return {
id: newReportRef.id,
...newReportData
} as Report;
