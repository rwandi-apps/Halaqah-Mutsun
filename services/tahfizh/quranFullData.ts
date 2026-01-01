
import { QuranAyahData } from './types';

/**
 * Dataset Koordinat Al-Quran (15 Baris per Halaman).
 * Key Format: "SurahID:NomorAyat"
 */
export const QURAN_FULL_MAP: Record<string, QuranAyahData> = {
  // Juz 1
  "1:1": { juz: 1, page: 1, line: 8 },
  "1:7": { juz: 1, page: 1, line: 15 },
  "2:1": { juz: 1, page: 2, line: 10 },
  "2:141": { juz: 1, page: 21, line: 15 },
  // Juz 2
  "2:142": { juz: 2, page: 22, line: 2 },
  "2:252": { juz: 2, page: 41, line: 15 },
  // Juz 26
  "46:1": { juz: 26, page: 499, line: 3 },
  "50:45": { juz: 26, page: 520, line: 10 },
  // Juz 27
  "51:1": { juz: 27, page: 520, line: 12 },
  "57:29": { juz: 27, page: 541, line: 15 },
  // Juz 28
  "58:1": { juz: 28, page: 542, line: 3 },
  "66:12": { juz: 28, page: 561, line: 15 },
  // Juz 29
  "67:1": { juz: 29, page: 562, line: 3 },
  "77:50": { juz: 29, page: 581, line: 15 },
  // Juz 30
  "78:1": { juz: 30, page: 582, line: 3 },
  "78:24": { juz: 30, page: 582, line: 14 },
  "78:25": { juz: 30, page: 582, line: 15 },
  "78:36": { juz: 30, page: 583, line: 4 },
  "114:1": { juz: 30, page: 604, line: 12 },
  "114:6": { juz: 30, page: 604, line: 15 }
  // ... data koordinat lainnya tetap dipetakan ke ID surah
};

/**
 * Batas Ayat Pertama dan Terakhir per Juz untuk perhitungan lintas juz
 */
export const JUZ_BOUNDARIES: Record<number, { start: string, end: string }> = {
  30: { start: "78:1", end: "114:6" },
  29: { start: "67:1", end: "77:50" },
  28: { start: "58:1", end: "66:12" },
  27: { start: "51:1", end: "57:29" },
  26: { start: "46:1", end: "50:45" },
  1: { start: "1:1", end: "2:141" },
  2: { start: "2:142", end: "2:252" }
  // ... juz lainnya
};

export const IQRA_PAGES: Record<number, number> = {
  1: 31, 2: 30, 3: 30, 4: 30, 5: 30, 6: 31
};
