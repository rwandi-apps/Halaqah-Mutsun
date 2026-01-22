
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
 * Format Input: "Iqra' 1: 1 - Iqra' 3: 15" -> Ambil "Iqra' 3: 15"
 * Rumus: ((Jilid - 1) * 31) + Halaman
 */
const getIqraScore = (progressStr: string): number => {
  if (!progressStr || progressStr === 'Belum Ada' || progressStr === '-') return 0;
  
  // Normalisasi string
  const lower = progressStr.toLowerCase();

  // Jika formatnya Range ("Dari - Sampai"), ambil bagian kanan (Sampai)
  const parts = lower.split('-');
  const lastPart = parts[parts.length - 1].trim(); 

  // Regex untuk menangkap Jilid dan Halaman
  // Mendukung format: "Iqra 3 : 15", "Iqra' 3 hal 15", "Jilid 3 halaman 15"
  const regex = /(?:iqra|jilid)\W*(\d+)\W*[:\s,halamanhal]*\W*(\d+)/i;
  const match = lastPart.match(regex);

  if (match && match[1] && match[2]) {
    const volume = parseInt(match[1], 10);
    const page = parseInt(match[2], 10);

    // Validasi basic
    if (volume < 1) return 0;

    // Rumus Matematika: ((Jilid Saat Ini - 1) * 31) + Halaman Saat Ini
    return ((volume - 1) * PAGES_PER_IQRA) + page;
  }

  // Fallback: Jika format tidak standar, coba cari angka terakhir sebagai halaman (asumsi jilid 1 jika gagal deteksi)
  // Ini jarang terjadi jika input valid
  if (!lower.includes('iqra') && !lower.includes('jilid')) {
     // Jika user input "Al-Quran" atau surah, anggap lulus Iqra (Max Score)
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

  // Logic Khusus Kelas 1 (Iqra Score via Tilawah String)
  if (level === 1) {
    unit = "Poin Iqra";
    // student.currentProgress di sini diharapkan sudah berisi string Tilawah (Iqra)
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

  // Cap percentage max 100% untuk visualisasi, tapi biarkan calculation murni di atas
  const visualPercentage = Math.min(percentage, 100);

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
    // Reverse Engineering dari Score ke Jilid & Hal untuk display
    if (current >= TARGET_SCORE_KELAS_1) {
      label = "Tuntas Iqra 6";
    } else {
      const displayVol = Math.floor(current / PAGES_PER_IQRA) + 1;
      const displayPage = current % PAGES_PER_IQRA; 
      // Handle edge case modulo 0 (halaman terakhir jilid sebelumnya)
      // Tapi rumus kita ((Vol-1)*31) + Page, jadi jika Page 31, Vol tetap.
      // Jika Page 0, berarti belum mulai atau data error.
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
    percentage,
    colorClass,
    badgeBg,
    badgeText,
    statusText,
    label
  };
};
