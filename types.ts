
export type Role = 'KOORDINATOR' | 'GURU';

// Collection: users
export interface User {
  id: string; 
  name: string;
  nickname?: string; 
  email: string;
  role: Role;
  photoURL?: string;
  createdAt?: string;
}

export interface Student {
  id: string;
  name: string;
  nis?: string;
  nisn?: string;
  gender?: 'L' | 'P';
  classId?: string;
  className: string;
  classLevel?: number;
  halaqahId?: string;
  teacherId: string;
  memorizationTarget: string;
  currentProgress: string;
  totalHafalan?: {
    juz: number;
    pages: number;
    lines: number;
  };
  attendance: number;
  behaviorScore: number;
  progress: number;
}

export interface Report {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  halaqahId?: string;
  className?: string;
  type: string;
  month: string;
  academicYear?: string;
  tilawah: {
    method: string;
    individual: string;
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
  createdAt: string;
  date: string;
  evaluation: string;
}

// Collection: rapor_semester
export interface SemesterReport {
  id?: string;
  studentId: string;
  teacherId: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  targetHafalan: string;
  dateStr: string;
  dateHijri: string;
  
  // Format Tabel (Kelas 4-6)
  assessments: {
    adab: string;
    murojaah: string;
    tajwid: string;
    makharij: string;
    pencapaianTarget: number;
  };
  exams: {
    uts: number;
    uas: number;
  };
  statusHafalan: {
    dimiliki: { jumlah: string; rincian: string; status: string };
    mutqin: { jumlah: string; rincian: string; status: string };
    semesterIni: { jumlah: string; rincian: string; status: string };
  };

  // Format Deskripsi (Kelas 1-3)
  narrativeTahfizh?: string;
  narrativeTilawah?: string;
  
  notes: string;
  createdAt?: string;
}

export interface Evaluation {
  id: string;
  studentId: string;
  teacherId: string;
  date: string;
  content: string;
  aiGenerated: boolean;
  createdAt?: string;
}
