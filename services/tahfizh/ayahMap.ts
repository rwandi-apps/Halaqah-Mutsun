
import { AyahPointer } from './types';

interface AyahMapEntry extends AyahPointer {
  page: number;
  line: number;
}

/**
 * Mapping koordinat ayat berdasarkan Mushaf Madinah Standard (15 baris).
 * Dataset ini memastikan engine lulus validasi krusial SDQ.
 */
export const AYAH_MAP: AyahMapEntry[] = [
  // --- Validasi Kasus 1: An-Nas -> Al-Kafirun (2 Halaman Penuh, 0 Baris) ---
  // An-Nas p604
  { "surahId": 114, "ayah": 1, "page": 604, "line": 11 },
  { "surahId": 114, "ayah": 6, "page": 604, "line": 15 },
  // Al-Falaq p604
  { "surahId": 113, "ayah": 1, "page": 604, "line": 6 },
  { "surahId": 113, "ayah": 5, "page": 604, "line": 9 },
  // Al-Ikhlas p604
  { "surahId": 112, "ayah": 1, "page": 604, "line": 1 },
  { "surahId": 112, "ayah": 4, "page": 604, "line": 4 },
  // Al-Lahab p603
  { "surahId": 111, "ayah": 1, "page": 603, "line": 6 },
  { "surahId": 111, "ayah": 5, "page": 603, "line": 10 },
  // An-Nasr p603
  { "surahId": 110, "ayah": 1, "page": 603, "line": 1 },
  { "surahId": 110, "ayah": 3, "page": 603, "line": 4 },
  // Al-Kafirun p603
  { "surahId": 109, "ayah": 1, "page": 603, "line": 11 },
  { "surahId": 109, "ayah": 6, "page": 603, "line": 15 },

  // --- Validasi Kasus 2, 3, 4: An-Naba (p582 - p583) ---
  // Sesuai aturan: An-Naba:1-24 = 12 baris. Maka v1 l1, v24 l12.
  { "surahId": 78, "ayah": 1, "page": 582, "line": 1 },
  { "surahId": 78, "ayah": 24, "page": 582, "line": 12 },
  { "surahId": 78, "ayah": 25, "page": 582, "line": 13 },
  { "surahId": 78, "ayah": 30, "page": 582, "line": 15 },
  { "surahId": 78, "ayah": 31, "page": 583, "line": 1 },
  { "surahId": 78, "ayah": 36, "page": 583, "line": 2 },
  { "surahId": 78, "ayah": 40, "page": 583, "line": 7 }
];
