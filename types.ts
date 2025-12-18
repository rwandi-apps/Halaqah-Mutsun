export type Role = 'KOORDINATOR' | 'GURU';

// Collection: users
export interface User {
  id: string; // uid
  name: string;
  nickname?: string; // Nama Panggilan for Header
  email: string;
  role: Role;
  photoURL?: string;
  createdAt?: string;
}

// Collection: kelas
export interface Class {
  id: string;
  name: string;
  level: number;
  academicYear: string;
  totalStudents: number;
}

// Collection: halaqah
export interface Halaqah {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  studentCount: number;
}

// Collection: siswa
export interface Student {
  id: string;
  name: string;
  nis?: string;
  nisn?: string;
  gender?: 'L' | 'P';
  
  // Relationships
  classId?: string; // Optional during creation
  className: string; // Tampilan: "Kelas 3 Ubay bin Ka'ab"
  classLevel?: number; // LOGIKA SISTEM: 3 (Extracted from className)
  halaqahId?: string;
  teacherId: string; // Denormalized for easier querying
  
  // Progress
  memorizationTarget: string; // e.g., "Juz 30" (Legacy string, logic uses classLevel)
  currentProgress: string; // e.g., "An-Naba: 1-10"
  totalHafalan?: {
    juz: number;
    pages: number;
    lines: number;
  };
  
  // Stats
  attendance: number; // percentage
  behaviorScore: number; // 1-10
  progress: number; // added to match usage in some services
}

// Collection: laporan
export interface Report {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  halaqahId?: string;
  className?: string;
  
  type: string; // 'Laporan Bulanan' | 'Laporan Semester'
  month: string;
  academicYear?: string;
  
  tilawah: {
    method: string;
    individual: string; // e.g., "Al-Fatihah: 1 - Al-Baqarah: 10"
    classical: string;
  };
  tahfizh: {
    individual: string;
    classical: string;
  };
  totalHafalan?: {
    juz: number;
    pages: number;
    lines: number;
  };
  notes: string;
  createdAt: string; // ISO String
  date: string; // added to match Report usage
  evaluation: string; // added to match Report usage
}

// Collection: evaluasi
export interface Evaluation {
  id: string;
  studentId: string;
  teacherId: string;
  date: string;
  content: string;
  aiGenerated: boolean;
  createdAt?: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeTeachers: number;
  averageAttendance: number;
  completedJuz: number;
}