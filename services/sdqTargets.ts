
import { Student } from '../types';
import { SURAH_LIST } from './mockBackend';

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

// Konfigurasi Target Halaman per Jilid Iqra (Revisi: 31 Halaman)
const PAGES_PER_IQRA = 31; 

// Target Kelas 1: Iqra 6 Halaman 31 (Full Tuntas)
// Perhitungan: 6 jilid * 31 halaman = 186 poin
const TARGET_SCORE_KELAS_1 = 186;

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
 * Jika siswa Kelas 1 sudah masuk Surah Al-Quran, otomatis dianggap tuntas target Iqra (100%).
 */
const getIqraScore = (progressStr: string): number => {
  if (!progressStr || progressStr === 'Belum Ada' || progressStr === '-') return 0;
  
  const lower = progressStr.toLowerCase();
  const parts = lower.split('-');
  const lastPart = parts[parts.length - 1].trim(); 

  // 1. Cek apakah ini level Al-Qur'an (Surah)
  // Jika progres mengandung nama Surah, berarti sudah lulus Iqra
  const isQuranLevel = SURAH_LIST.some(surah => 
    lower.includes(surah.toLowerCase())
  );

  if (isQuranLevel) {
    return TARGET_SCORE_KELAS_1;
  }

  // 2. Regex untuk menangkap Jilid dan Halaman Iqra
  const regex = /(?:iqra|jilid)\W*(\d+)\W*[:\s,halamanhal]*\W*(\d+)/i;
  const match = lastPart.match(regex);

  if (match && match[1] && match[2]) {
    const volume = parseInt(match[1], 10);
    const page = parseInt(match[2], 10);
    if (volume < 1) return 0;
    
    // Jika volume > 6, berarti sudah Al-Quran
    if (volume > 6) return TARGET_SCORE_KELAS_1;

    return ((volume - 1) * PAGES_PER_IQRA) + page;
  }

  // Fallback: Jika tidak terdeteksi Iqra tapi ada teks progres lain
  if (!lower.includes('iqra') && !lower.includes('jilid')) {
     if (lower.includes('quran') || lower.includes('al-fatihah')) return TARGET_SCORE_KELAS_1;
  }

  return 0;
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

  // Logic Khusus Kelas 1
  if (level === 1) {
    unit = "Poin Iqra";
    current = getIqraScore(student.currentProgress || "");
  } else {
    // Logic Kelas 2-6 (Juz Quran via Total Hafalan)
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
    if (current >= TARGET_SCORE_KELAS_1) {
      // Cek apakah progres aslinya mengandung nama Surah
      const lowerProgress = (student.currentProgress || "").toLowerCase();
      const isActuallyQuran = SURAH_LIST.some(s => lowerProgress.includes(s.toLowerCase()));
      label = isActuallyQuran ? `Al-Qur'an (${student.currentProgress})` : "Tuntas Iqra 6";
    } else {
      const displayVol = Math.floor(current / PAGES_PER_IQRA) + 1;
      const displayPage = current % PAGES_PER_IQRA; 
      label = `Iqra ${displayVol} Hal ${displayPage === 0 ? 1 : displayPage}`;
    }
  } else {
    label = `${current} dari ${target} Juz`;
  }

  return {
    classLevel: level,
    target,
    current, 
    unit,
    percentage: Math.min(percentage, 100),
    colorClass,
    badgeBg,
    badgeText,
    statusText,
    label
  };
};
