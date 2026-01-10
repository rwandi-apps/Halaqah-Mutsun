
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
  teacherId?: string;
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

// Single Source of Truth untuk data Klasikal
// Collection: halaqah_monthly_reports
export interface HalaqahMonthlyReport {
  id?: string;
  halaqahId: string; 
  teacherId: string;
  period: string; 
  academicYear: string;
  klasikal: {
    tahfizh: {
      from: { surah: string; ayah: number };
      to: { surah: string; ayah: number };
    };
    tilawah: {
      type: 'quran' | 'iqra';
      from: { 
        surah?: string; ayah?: number; 
        jilid?: number; halaman?: number; 
      };
      to: { 
        surah?: string; ayah?: number; 
        jilid?: number; halaman?: number; 
      };
    };
  };
  createdAt?: string;
  updatedAt?: any;
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
  periodCode?: number; // Integer YYYYMM untuk sorting absolut
  migrated?: boolean;  // Flag penanda data legacy yang sudah dinormalisasi
  
  tilawah: {
    method: string;
    individual: string;
    classical?: string; 
  };
  tahfizh: {
    individual: string;
    classical?: string; 
  };
  totalHafalan?: {
    juz: number;
    pages: number;
    lines: number;
  };
  attendance?: number;
  behaviorScore?: number;
  notes: string;
  createdAt: string;
  date: string;
  evaluation: string;
  
  // Legacy fields support (optional)
  hafalanRange?: string; 
}

export interface HalaqahEvaluation {
  id: string;
  teacherId: string;
  period: string; 
  academicYear: string;
  insightUtama: string;
  kendalaTerindikasi: string;
  tindakLanjut: string;
  targetBulanDepan: string;
  catatanKoordinator: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SemesterReport {
  id?: string;
  studentId: string;
  teacherId: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  targetHafalan: string;
  dateStr: string;
  dateHijri: string;
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
  narrativeTahfizh?: string;
  narrativeTilawah?: string;
  notes: string;
  createdAt?: string;
}
