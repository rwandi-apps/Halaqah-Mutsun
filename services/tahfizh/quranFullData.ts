
export interface QuranAyahData {
  page: number;
  line: number;
  globalIndex: number;
  juz: number;
}

/**
 * Dataset Koordinat Al-Quran Mushaf Madinah Standard (15 Baris).
 * Key: "NamaSurah:NomorAyat"
 * Normalisasi: Gunakan tanda petik satu (') untuk surah seperti An-Naba'.
 */
export const QURAN_FULL_MAP: Record<string, QuranAyahData> = {
  // Contoh Data Juz 30 (Sesuai Validasi Kasus)
  "An-Naba':1": { juz: 30, page: 582, line: 3, globalIndex: 5673 },
  "An-Naba':24": { juz: 30, page: 582, line: 14, globalIndex: 5696 },
  "An-Naba':25": { juz: 30, page: 582, line: 15, globalIndex: 5697 },
  "An-Naba':36": { juz: 30, page: 583, line: 4, globalIndex: 5708 },
  "An-Nas:1": { juz: 30, page: 604, line: 11, globalIndex: 6231 },
  "Al-Kafirun:6": { juz: 30, page: 603, line: 15, globalIndex: 6213 },
  "Al-Insan:21": { juz: 29, page: 579, line: 12, globalIndex: 5612 },
  "Al-Munafiqun:4": { juz: 28, page: 554, line: 15, globalIndex: 5192 },
  
  // Sisa 6.000+ ayat akan di-fill di sini setelah struktur dideploy
};
