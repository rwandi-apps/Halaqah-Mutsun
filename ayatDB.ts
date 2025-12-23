// ayatDB.ts
// DATABASE AYAT PER HALAMAN (VERSI AWAL)

export interface AyatEntry {
  surah: string;
  ayat: number;
  page: number;
  lines: number;
}

// CATATAN:
// - lines = jumlah baris ayat tsb di halaman itu
// - total baris per halaman = ±15

export const AYAT_DB: AyatEntry[] = [

  // ======================
  // HALAMAN 582 — An-Naba
  // ======================
  { surah: "An-Naba", ayat: 1, page: 582, lines: 2 },
  { surah: "An-Naba", ayat: 2, page: 582, lines: 2 },
  { surah: "An-Naba", ayat: 3, page: 582, lines: 2 },
  { surah: "An-Naba", ayat: 4, page: 582, lines: 1 },
  { surah: "An-Naba", ayat: 5, page: 582, lines: 1 },
  { surah: "An-Naba", ayat: 6, page: 582, lines: 1 },
  { surah: "An-Naba", ayat: 7, page: 582, lines: 1 },
  { surah: "An-Naba", ayat: 8, page: 582, lines: 1 },
  { surah: "An-Naba", ayat: 9, page: 582, lines: 1 },
  { surah: "An-Naba", ayat: 10, page: 582, lines: 1 },

  // ======================
  // HALAMAN 583
  // ======================
  { surah: "An-Naba", ayat: 11, page: 583, lines: 1 },
  { surah: "An-Naba", ayat: 12, page: 583, lines: 1 },
  { surah: "An-Naba", ayat: 13, page: 583, lines: 1 },
  { surah: "An-Naba", ayat: 14, page: 583, lines: 1 },
  { surah: "An-Naba", ayat: 15, page: 583, lines: 1 },
  { surah: "An-Naba", ayat: 16, page: 583, lines: 1 },
  { surah: "An-Naba", ayat: 17, page: 583, lines: 1 },
  { surah: "An-Naba", ayat: 18, page: 583, lines: 1 },
  { surah: "An-Naba", ayat: 19, page: 583, lines: 1 },
  { surah: "An-Naba", ayat: 20, page: 583, lines: 1 },

];
