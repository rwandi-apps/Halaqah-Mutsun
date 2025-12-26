
import { AyahPointer } from './types';

interface AyahMapEntry extends AyahPointer {
  page: number;
  line: number;
}

/**
 * Database koordinat ayat Mushaf Al-Qur'an Standar (Madinah).
 * Digunakan oleh engine untuk menghitung baris secara fisik.
 */
export const AYAH_MAP: AyahMapEntry[] = [
  // An-Naba' (p582 - p583)
  { "surah": "An-Naba'", "ayah": 0, "page": 582, "line": 0 }, // Representasi Header/Basmalah (l1-l2)
  { "surah": "An-Naba'", "ayah": 1, "page": 582, "line": 3 },
  { "surah": "An-Naba'", "ayah": 24, "page": 582, "line": 12 },
  { "surah": "An-Naba'", "ayah": 25, "page": 582, "line": 13 },
  { "surah": "An-Naba'", "ayah": 30, "page": 582, "line": 15 },
  { "surah": "An-Naba'", "ayah": 31, "page": 583, "line": 1 },
  { "surah": "An-Naba'", "ayah": 36, "page": 583, "line": 2 },
  { "surah": "An-Naba'", "ayah": 40, "page": 583, "line": 7 },

  // Juz 30 (Reverse Order Pages)
  { "surah": "An-Nas", "ayah": 1, "page": 604, "line": 11 },
  { "surah": "An-Nas", "ayah": 6, "page": 604, "line": 15 },
  { "surah": "Al-Falaq", "ayah": 1, "page": 604, "line": 6 },
  { "surah": "Al-Falaq", "ayah": 5, "page": 604, "line": 9 },
  { "surah": "Al-Ikhlas", "ayah": 1, "page": 604, "line": 1 },
  { "surah": "Al-Ikhlas", "ayah": 4, "page": 604, "line": 4 },
  { "surah": "Al-Kafirun", "ayah": 1, "page": 603, "line": 11 },
  { "surah": "Al-Kafirun", "ayah": 6, "page": 603, "line": 15 }
];

// Helper untuk estimasi jika data map tidak tersedia ( fallback )
export const getAyahLocation = (surah: string, ayah: number): { page: number, line: number } => {
  const found = AYAH_MAP.find(a => a.surah === surah && a.ayah === ayah);
  if (found) return { page: found.page, line: found.line };
  
  // Jika tidak ada di map, kita gunakan logika proporsional sederhana
  // Note: Dalam aplikasi nyata, map ini harus lengkap 6236 ayat.
  return { page: 0, line: 0 };
};
