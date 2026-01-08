
import { QuranAyahData } from './types';

/**
 * Dataset Koordinat Al-Quran (15 Baris per Halaman).
 * Key Format: "NamaSurah:NomorAyat"
 */
export const QURAN_FULL_MAP: Record<string, QuranAyahData> = {
  // Juz 1
  "Al-Fatihah:1": { juz: 1, page: 1, line: 8 },
  "Al-Fatihah:7": { juz: 1, page: 1, line: 15 },
  "Al-Baqarah:1": { juz: 1, page: 2, line: 10 },
  "Al-Baqarah:141": { juz: 1, page: 21, line: 15 },
  // Juz 2
  "Al-Baqarah:142": { juz: 2, page: 22, line: 2 },
  "Al-Baqarah:252": { juz: 2, page: 41, line: 15 },
  // Juz 26
  "Al-Ahqaf:1": { juz: 26, page: 499, line: 3 },
  "Qaf:45": { juz: 26, page: 520, line: 10 },
  // Juz 27
  "Adz-Dzariyat:1": { juz: 27, page: 520, line: 12 },
  "Al-Hadid:29": { juz: 27, page: 541, line: 15 },
  // Juz 28
  "Al-Mujadilah:1": { juz: 28, page: 542, line: 3 },
  "At-Tahrim:12": { juz: 28, page: 561, line: 15 },
  // Juz 29
  "Al-Mulk:1": { juz: 29, page: 562, line: 3 },
  "Al-Haqqah:1": { juz: 29, page: 567, line: 3 },
  "Al-Haqqah:30": { juz: 29, page: 567, line: 15 },
  "Al-Haqqah:31": { juz: 29, page: 568, line: 1 },
  "Al-Haqqah:52": { juz: 29, page: 568, line: 15 },
  "Al-Mursalat:50": { juz: 29, page: 581, line: 15 },
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
