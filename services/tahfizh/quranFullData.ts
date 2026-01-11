
import { QuranAyahData } from './types';

/**
 * Dataset Koordinat Al-Quran (15 Baris per Halaman).
 * Key Format: "NamaSurah:NomorAyat"
 * globalIndex mengikuti urutan kurikulum SDQ (Juz 30 -> 29 -> ... -> 1)
 */
export const QURAN_FULL_MAP: Record<string, QuranAyahData> = {
  // --- JUZ 30 (Start of Curriculum) ---
  // An-Naba' (Page 582)
  "An-Naba':1": { juz: 30, page: 582, line: 3, globalIndex: 1 },
  "An-Naba':40": { juz: 30, page: 583, line: 15, globalIndex: 40 },
  
  // An-Nazi'at
  "An-Nazi'at:1": { juz: 30, page: 583, line: 15, globalIndex: 41 },
  
  // An-Nas (End of Juz 30)
  "An-Nas:1": { juz: 30, page: 604, line: 12, globalIndex: 500 }, // Mock index
  "An-Nas:6": { juz: 30, page: 604, line: 15, globalIndex: 506 },

  // --- JUZ 29 (After Juz 30) ---
  // Al-Mulk (Start of Juz 29)
  "Al-Mulk:1": { juz: 29, page: 562, line: 3, globalIndex: 507 },
  "Al-Mulk:30": { juz: 29, page: 564, line: 15, globalIndex: 537 },

  // --- JUZ 2 (After Juz 3) ---
  "Al-Baqarah:142": { juz: 2, page: 22, line: 2, globalIndex: 8500 },
  "Al-Baqarah:252": { juz: 2, page: 41, line: 15, globalIndex: 8800 },

  // --- JUZ 1 (End of Curriculum for SDQ Logic usually, or just next in reverse) ---
  // Al-Fatihah
  "Al-Fatihah:1": { juz: 1, page: 1, line: 8, globalIndex: 9000 },
  "Al-Fatihah:7": { juz: 1, page: 1, line: 15, globalIndex: 9007 },
  
  // Al-Baqarah Start
  "Al-Baqarah:1": { juz: 1, page: 2, line: 10, globalIndex: 9008 },
  "Al-Baqarah:5": { juz: 1, page: 2, line: 15, globalIndex: 9013 },
  "Al-Baqarah:6": { juz: 1, page: 3, line: 1, globalIndex: 9014 },
  "Al-Baqarah:141": { juz: 1, page: 21, line: 15, globalIndex: 9150 }
};

export const JUZ_BOUNDARIES: Record<number, { start: string, end: string }> = {
  30: { start: "An-Naba':1", end: "An-Nas:6" },
  29: { start: "Al-Mulk:1", end: "Al-Mursalat:50" },
  1: { start: "Al-Fatihah:1", end: "Al-Baqarah:141" }
};

export const IQRA_PAGES: Record<number, number> = {
  1: 31, 2: 30, 3: 30, 4: 30, 5: 30, 6: 31
};
