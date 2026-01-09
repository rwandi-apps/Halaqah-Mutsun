
import { QuranAyahData } from './types';

/**
 * Dataset Koordinat Al-Quran (15 Baris per Halaman).
 * Key Format: "NamaSurah:NomorAyat"
 */
export const QURAN_FULL_MAP: Record<string, QuranAyahData> = {
  // Juz 1 - Al-Fatihah
  "Al-Fatihah:1": { juz: 1, page: 1, line: 8 },
  "Al-Fatihah:7": { juz: 1, page: 1, line: 15 },
  
  // Juz 1 - Al-Baqarah Page 2
  "Al-Baqarah:1": { juz: 1, page: 2, line: 10 },
  "Al-Baqarah:5": { juz: 1, page: 2, line: 15 },
  
  // Juz 1 - Al-Baqarah Page 3 (Permintaan User)
  "Al-Baqarah:6": { juz: 1, page: 3, line: 1 },
  "Al-Baqarah:7": { juz: 1, page: 3, line: 3 },
  "Al-Baqarah:8": { juz: 1, page: 3, line: 4 },
  "Al-Baqarah:9": { juz: 1, page: 3, line: 5 },
  "Al-Baqarah:10": { juz: 1, page: 3, line: 7 },
  "Al-Baqarah:11": { juz: 1, page: 3, line: 8 },
  "Al-Baqarah:12": { juz: 1, page: 3, line: 9 },
  "Al-Baqarah:13": { juz: 1, page: 3, line: 11 },
  "Al-Baqarah:14": { juz: 1, page: 3, line: 13 },
  "Al-Baqarah:15": { juz: 1, page: 3, line: 14 },
  "Al-Baqarah:16": { juz: 1, page: 3, line: 15 },
  
  "Al-Baqarah:141": { juz: 1, page: 21, line: 15 },

  // Juz 2
  "Al-Baqarah:142": { juz: 2, page: 22, line: 2 },
  "Al-Baqarah:252": { juz: 2, page: 41, line: 15 },

  // Juz 29
  "Al-Mulk:1": { juz: 29, page: 562, line: 3 },
  "Al-Mulk:30": { juz: 29, page: 564, line: 15 },

  // Juz 30
  "An-Naba':1": { juz: 30, page: 582, line: 3 },
  "An-Naba':40": { juz: 30, page: 583, line: 15 },
  "An-Nazi'at:1": { juz: 30, page: 583, line: 15 },
  "An-Nas:1": { juz: 30, page: 604, line: 12 },
  "An-Nas:6": { juz: 30, page: 604, line: 15 }
};

export const JUZ_BOUNDARIES: Record<number, { start: string, end: string }> = {
  30: { start: "An-Naba':1", end: "An-Nas:6" },
  29: { start: "Al-Mulk:1", end: "Al-Mursalat:50" },
  28: { start: "Al-Mujadilah:1", end: "At-Tahrim:12" },
  27: { start: "Adz-Dzariyat:1", end: "Al-Hadid:29" },
  26: { start: "Al-Ahqaf:1", end: "Qaf:45" },
  1: { start: "Al-Fatihah:1", end: "Al-Baqarah:141" },
  2: { start: "Al-Baqarah:142", end: "Al-Baqarah:252" }
};

export const IQRA_PAGES: Record<number, number> = {
  1: 31, 2: 30, 3: 30, 4: 30, 5: 30, 6: 31
};
