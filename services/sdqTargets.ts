
import { Student } from '../types';

export interface SDQProgressResult {
  current: number;
  target: number;
  percentage: number;
  unit: string; 
  colorClass: string; // Untuk Bar
  badgeBg: string;    // Untuk Background Badge Status
  badgeText: string;  // Untuk Warna Teks Badge Status
  label: string; 
  statusText: string;
  classLevel: number;
}

const PAGES_PER_JUZ = 20;
const LINES_PER_PAGE = 15;
const LINES_PER_JUZ = PAGES_PER_JUZ * LINES_PER_PAGE; 

// Konfigurasi Target Halaman per Jilid Iqra (Asumsi rata-rata)
const PAGES_PER_IQRA = 30; 

// Target Kelas 1: Iqra 6 Halaman 31
// Perhitungan: (5 jilid full * 30) + 31 halaman = 150 + 31 = 181 poin
const TARGET_SCORE_KELAS_1 = 181;

const SDQ_TARGETS: Record<number, number> = {
  1: TARGET_SCORE_KELAS_1, 
  2: 1, 
  3: 3, 
  4: 4, 
  5: 5, 
  6: 5  
};

export const extractClassLevel = (input: any): number => {
  if (!input) return 0;
  if (typeof input === 'number') {
    return (input >= 1 && input <= 6) ? input : 0;
  }
  const str = String(input).trim();
  const matchStandard = str.match(/Kelas\s*(\d+)/i);
  if (matchStandard && matchStandard[1]) {
    const level = parseInt(matchStandard[1], 10);
    return (level >= 1 && level <= 6) ? level : 0;
  }
  const matchStart = str.match(/^(\d+)/);
  if (matchStart && matchStart[1]) {
    const level = parseInt(matchStart[1], 10);
    return (level >= 1 && level <= 6) ? level : 0;
  }
  return 0;
};

/**
 * Menghitung skor absolut untuk Iqra.
 * Format Input: "Iqra 3", "Iqra 3 Halaman 15", "Jilid 4 : 10"
 */
const getIqraScore = (progressStr: string): number => {
  if (!progressStr || progressStr === 'Belum Ada' || progressStr === '-') return 0;
  const lower = progressStr.toLowerCase();
  
  // Jika sudah Al-Quran (bukan iqra/jilid), anggap sudah lulus target Iqra (Max Score)
  if (!lower.includes('iqra') && !lower.includes('jilid')) {
    return TARGET_SCORE_KELAS_1; 
  }

  // Ambil Jilid
  const volMatch = lower.match(/(?:iqra|jilid)\s*'?\s*(\d+)/i);
  const volume = volMatch ? parseInt(volMatch[1]) : 0;
  if (volume === 0) return 0;

  // Ambil Halaman (Opsional, default 1)
  // Pola: "hal", "halaman", ":", atau spasi angka di akhir
  const pageMatch = lower.match(/(?:hal|halaman|:)\s*(\d+)/i) || lower.match(/\s(\d+)$/);
  const page = pageMatch ? parseInt(pageMatch[1]) : 1;

  // Rumus: (Jilid sebelumnya * 30) + Halaman saat ini
  return ((volume - 1) * PAGES_PER_IQRA) + page;
};

const convertToDecimalJuz = (total: { juz?: number, pages?: number, lines?: number } | undefined): number => {
  if (!total) return 0;
  const juz = Number(total.juz || 0);
  const pages = Number(total.pages || 0);
  const lines = Number(total.lines || 0);
  const decimalValue = juz + (pages / PAGES_PER_JUZ) + (lines / LINES_PER_JUZ);
  return Math.round(decimalValue * 100) / 100;
};

export const calculateSDQProgress = (student: Student): SDQProgressResult => {
  let level = extractClassLevel(student.className);

  if (level === 0) {
    return {
      classLevel: 0,
      target: 0,
      current: 0,
      percentage: 0,
      unit: '-',
      colorClass: "bg-gray-400", 
      badgeBg: "bg-gray-100",
      badgeText: "text-gray-500",
      statusText: "Kelas Tidak Valid",
      label: "Data Kelas Error"
    };
  }

  const target = SDQ_TARGETS[level] || 1;
  let current = 0;
  let unit = "Juz";

  // Logic Khusus Kelas 1 (Iqra Score)
  if (level === 1) {
    unit = "Poin Iqra";
    current = getIqraScore(student.currentProgress || "");
  } else {
    // Logic Kelas 2-6 (Juz Quran)
    unit = "Juz";
    current = convertToDecimalJuz(student.totalHafalan);
  }

  let percentage = 0;
  if (target > 0) {
    percentage = Math.round((current / target) * 100);
  }

  // Tentukan Status & Warna
  let colorClass = "";
  let badgeBg = "";
  let badgeText = "";
  let statusText = "";

  if (percentage >= 100) {
    colorClass = "bg-emerald-500"; 
    badgeBg = "bg-emerald-100";
    badgeText = "text-emerald-700";
    statusText = "Target Tercapai";
  } else if (percentage >= 80) {
    colorClass = "bg-blue-500"; 
    badgeBg = "bg-blue-100";
    badgeText = "text-blue-700";
    statusText = "Hampir Tercapai";
  } else if (percentage >= 50) {
    colorClass = "bg-amber-500"; 
    badgeBg = "bg-amber-100";
    badgeText = "text-amber-700";
    statusText = "Perlu Dorongan";
  } else {
    colorClass = "bg-rose-500"; 
    badgeBg = "bg-rose-100";
    badgeText = "text-rose-700";
    statusText = "Perlu Perhatian";
  }

  // Label Display
  let label = "";
  if (level === 1) {
    // Kembalikan ke format Jilid & Hal untuk display user friendly (approx)
    const displayVol = Math.floor(current / 30) + 1;
    const displayPage = current % 30 || 30; // handle exact division
    if (percentage >= 100) label = "Tuntas Iqra 6";
    else label = `Iqra ${displayVol} Hal ${displayPage}`;
  } else {
    label = `${current} dari ${target} Juz`;
  }

  return {
    classLevel: level,
    target,
    current, 
    unit,
    percentage,
    colorClass,
    badgeBg,
    badgeText,
    statusText,
    label
  };
};
