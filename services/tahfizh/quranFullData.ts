import { QuranAyahData } from './types';

/**
 * Dataset Koordinat Al-Quran (15 Baris per Halaman).
 * Data Juz 1 disesuaikan dengan input user (Al-Fatihah:1 index 1).
 */
export const QURAN_FULL_MAP: Record<string, QuranAyahData> = {
  // Juz 1
  "Al-Fatihah:1": { juz: 1, page: 1, line: 1, globalIndex: 1 },
  "Al-Fatihah:2": { juz: 1, page: 1, line: 9, globalIndex: 2 },
  "Al-Fatihah:3": { juz: 1, page: 1, line: 10, globalIndex: 3 },
  "Al-Fatihah:4": { juz: 1, page: 1, line: 10, globalIndex: 4 },
  "Al-Fatihah:5": { juz: 1, page: 1, line: 11, globalIndex: 5 },
  "Al-Fatihah:6": { juz: 1, page: 1, line: 12, globalIndex: 6 },
  "Al-Fatihah:7": { juz: 1, page: 1, line: 15, globalIndex: 7 },
  "Al-Baqarah:1": { juz: 1, page: 2, line: 1, globalIndex: 8 },
  "Al-Baqarah:2": { juz: 1, page: 2, line: 11, globalIndex: 9 },
  "Al-Baqarah:3": { juz: 1, page: 2, line: 12, globalIndex: 10 },
  "Al-Baqarah:4": { juz: 1, page: 2, line: 13, globalIndex: 11 },
  "Al-Baqarah:5": { juz: 1, page: 2, line: 15, globalIndex: 12 },
  "Al-Baqarah:6": { juz: 1, page: 3, line: 1, globalIndex: 13 },
  "Al-Baqarah:141": { juz: 1, page: 21, line: 15, globalIndex: 148 }
  // ... data lainnya bisa ditambahkan di sini
};
