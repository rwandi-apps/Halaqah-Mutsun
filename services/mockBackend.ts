
import { User, Student, Role, Report } from '../types';

export const CLASS_LIST = [
  "Kelas 1 Abdullah ibnu Mas'ud",
  "Kelas 1 Hafshah bintu Umar",
  "Kelas 2 Asma bintu Abu bakar",
  "Kelas 2 Zaid bin Tsabit",
  "Kelas 3 Khadijah bintu Khuwailid",
  "Kelas 3 Ubay bin Ka'ab",
  "Kelas 4 Abu Musa Al Asy'ari",
  "Kelas 4 Shafiyyah bintu Huyay",
  "Kelas 5 Muadz bin Jabal",
  "Kelas 5 Saudah bintu Zam'ah",
  "Kelas 6 'Aisyah bintu Abu Bakar",
  "Kelas 6 Ibnu Abbas"
];

export const SURAH_LIST = [
  "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", 
  "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Taubah", "Yunus",
  "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr",
  "An-Nahl", "Al-Isra'", "Al-Kahf", "Maryam", "Ta-Ha",
  "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan",
  "Asy-Syu'ara'", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum",
  "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir",
  "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
  "Fussilat", "Asy-Syura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jasiyah",
  "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adz-Dzariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman",
  "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hasyr", "Al-Mumtahanah",
  "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq",
  "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddassir", "Al-Qiyamah",
  "Al-Insan", "Al-Mursalat", "An-Naba'", "An-Nazi'at", "'Abasa",
  "At-Takwir", "Al-Infitar", "Al-Muthaffifin", "Al-Insyiqaq", "Al-Buruj",
  "Ath-Thariq", "Al-A'la", "Al-Ghasyiyah", "Al-Fajr", "Al-Balad",
  "Asy-Syams", "Al-Lail", "Ad-Duha", "Al-Insyirah", "At-Tin",
  "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat",
  "Al-Qari'ah", "At-Takatsur", "Al-'Asr", "Al-Humazah", "Al-Fil",
  "Quraisy", "Al-Ma'un", "Al-Kautsar", "Al-Kafirun", "An-Nasr",
  "Al-Lahab", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

// Mock Data
let MOCK_USERS: User[] = [
  { id: 'u1', name: 'Ust. Abdullah', email: 'coord@sdq.com', role: 'KOORDINATOR' },
  { id: 'u2', name: 'Ust. Hasan', email: 'guru@sdq.com', role: 'GURU' },
  { id: 'u3', name: 'Ust. Arif', email: 'arif@sdq.com', role: 'GURU' },
  { id: 'u4', name: 'Uzh. Fatimah', email: 'fatimah@sdq.com', role: 'GURU' },
  { id: 'u5', name: 'Ust. Zulkifli', email: 'zul@sdq.com', role: 'GURU' },
];

let MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Ahmad Fulan', classId: 'c1', nis: '2023001', nisn: '0012345678', className: "Kelas 3 Khadijah bintu Khuwailid", teacherId: 'u2', memorizationTarget: 'Juz 30', currentProgress: 'An-Naba', attendance: 95, behaviorScore: 9, progress: 0 },
  { id: 's2', name: 'Siti Aminah', classId: 'c1', nis: '2023002', nisn: '0012345679', className: "Kelas 3 Khadijah bintu Khuwailid", teacherId: 'u2', memorizationTarget: 'Juz 29', currentProgress: 'Al-Mulk', attendance: 88, behaviorScore: 8, progress: 0 },
  { id: 's3', name: 'Budi Santoso', classId: 'c1', nis: '2023003', nisn: '0012345680', className: "Kelas 3 Khadijah bintu Khuwailid", teacherId: 'u3', memorizationTarget: 'Juz 30', currentProgress: 'Al-Infitar', attendance: 92, behaviorScore: 7, progress: 0 },
  { id: 's4', name: 'Dewi Lestari', classId: 'c2', nis: '2023004', nisn: '0012345681', className: "Kelas 3 Ubay bin Ka'ab", teacherId: 'u4', memorizationTarget: 'Juz 30', currentProgress: 'At-Takwir', attendance: 100, behaviorScore: 10, progress: 0 },
  { id: 's5', name: 'Rizky Ramadhan', classId: 'c3', nis: '2023005', nisn: '0012345682', className: "Kelas 1 Abdullah ibnu Mas'ud", teacherId: 'u5', memorizationTarget: 'Juz 30', currentProgress: 'Al-Fatihah', attendance: 98, behaviorScore: 9, progress: 0 },
];

let MOCK_REPORTS: Report[] = [
  {
    id: 'r1',
    studentId: 's1',
    studentName: 'Ahmad Fulan',
    className: 'Kelas 3 Khadijah bintu Khuwailid',
    teacherId: 'u2',
    type: 'Laporan Bulanan',
    month: 'Desember',
    tilawah: {
      // Fix: Restored missing 'method' property to satisfy type requirement
      method: 'Al-Quran',
      individual: 'Al-Baqarah: 1 - Al-Baqarah: 25',
      classical: 'Al-Fatihah: 1 - Al-Fatihah: 7'
    },
    tahfizh: {
      individual: 'An-Naba: 1 - An-Naba: 20',
      classical: 'An-Naziat: 1 - An-Naziat: 10'
    },
    totalHafalan: { juz: 1, pages: 10, lines: 5 },
    notes: 'Alhamdulillah bacaan lancar, namun perlu diperbaiki makhraj huruf ain.',
    createdAt: '2023-12-28',
    date: '2023-12-28',
    evaluation: 'Good'
  },
  {
    id: 'r2',
    studentId: 's2',
    studentName: 'Siti Aminah',
    className: 'Kelas 3 Khadijah bintu Khuwailid',
    teacherId: 'u2',
    type: 'Laporan Bulanan',
    month: 'Desember',
    tilawah: {
      // Fix: Restored missing 'method' property to satisfy type requirement
      method: 'Al-Quran',
      individual: 'Iqra 5: 10 - Iqra 5: 15',
      classical: 'Al-Fatihah: 1 - Al-Fatihah: 7'
    },
    tahfizh: {
      individual: 'Al-Mulk: 1 - Al-Mulk: 5',
      classical: 'An-Naziat: 1 - An-Naziat: 10'
    },
    totalHafalan: { juz: 2, pages: 0, lines: 0 },
    notes: 'Semangat belajar sangat tinggi.',
    createdAt: '2023-12-29',
    date: '2023-12-29',
    evaluation: 'Excellent'
  }
];

// Auth Service
export const login = async (email: string, role: Role): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const user = MOCK_USERS.find(u => u.email === email && u.role === role);
  return user || { id: 'test-id', name: role === 'KOORDINATOR' ? 'Demo Koordinator' : 'Demo Guru', email, role };
};

// Data Service
export const getStudentsByTeacher = async (teacherId: string): Promise<Student[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_STUDENTS.filter(s => s.teacherId === teacherId);
};

export const getAllStudents = async (): Promise<Student[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_STUDENTS;
};

export const getAllTeachers = async (): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_USERS.filter(u => u.role === 'GURU');
};

export const getTeacherById = async (id: string): Promise<User | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_USERS.find(u => u.id === id && u.role === 'GURU');
};

export const addTeacher = async (name: string, email: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newUser: User = {
    id: `u${MOCK_USERS.length + 1 + Math.floor(Math.random() * 1000)}`,
    name,
    email,
    role: 'GURU'
  };
  MOCK_USERS = [...MOCK_USERS, newUser];
  return newUser;
};

export const addStudent = async (student: Omit<Student, 'id' | 'attendance' | 'behaviorScore'>): Promise<Student> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newStudent: Student = {
    id: `s${MOCK_STUDENTS.length + 1 + Math.floor(Math.random() * 1000)}`,
    ...student,
    attendance: 100,
    behaviorScore: 10,
    progress: 0
  };
  MOCK_STUDENTS = [...MOCK_STUDENTS, newStudent];
  return newStudent;
};

export const updateStudentProgress = async (studentId: string, progress: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const idx = MOCK_STUDENTS.findIndex(s => s.id === studentId);
  if (idx !== -1) {
    MOCK_STUDENTS[idx].currentProgress = progress;
  }
};

export const getReportsByTeacher = async (teacherId: string): Promise<Report[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_REPORTS.filter(r => r.teacherId === teacherId);
};
