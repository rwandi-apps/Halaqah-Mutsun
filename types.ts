
export type Role = 'GURU' | 'KOORDINATOR' | 'ADMIN';

export enum UserRole {
  COORDINATOR = 'COORDINATOR',
  GURU = 'GURU',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  role: Role;
  photoUrl?: string;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  teacherId: string;
  progress: number;
  className?: string;
  memorizationTarget?: string;
  currentProgress?: string;
  attendance?: number;
  behaviorScore?: number;
  nis?: string;
  nisn?: string;
  totalHafalan?: {
    juz: number;
    pages: number;
    lines: number;
  };
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
}

export interface Report {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  className?: string;
  date: string;
  createdAt: string;
  evaluation: string;
  aiFeedback?: string;
  month?: string;
  type?: string;
  academicYear?: string;
  totalHafalan?: {
    juz: number;
    pages: number;
    lines: number;
  };
  tahfizh: {
    individual?: string;
    classical?: string;
  };
  tilawah: {
    individual?: string;
    classical?: string;
  };
  notes?: string;
}
