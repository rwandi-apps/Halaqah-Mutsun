// =======================================================
// SDQ CURRICULUM CONFIGURATION
// =======================================================

/**
 * =========================
 * 1. IQRA (PRA-QURAN)
 * =========================
 * Diselesaikan SEBELUM masuk Juz 30
 * Tidak memiliki baris, hanya halaman
 */
export const SDQ_IQRA = [
  { jilid: 1, halaman: 31 },
  { jilid: 2, halaman: 30 },
  { jilid: 3, halaman: 30 },
  { jilid: 4, halaman: 30 },
  { jilid: 5, halaman: 30 },
  { jilid: 6, halaman: 31 }
];

export const SDQ_IQRA_TOTAL_HALAMAN =
  SDQ_IQRA.reduce((total, j) => total + j.halaman, 0);

/**
 * =========================
 * 2. URUTAN SURAH SDQ
 * =========================
 * Digunakan untuk:
 * - Validasi input guru
 * - Tampilan progres
 * - BUKAN untuk hitung baris
 */
export const SDQ_SURAH_ORDER = [
  // JUZ 30 (SDQ – input dibalik, perhitungan tetap maju)
  "An-Nas", "Al-Falaq", "An-Nasr", "Al-Lahab", "Al-Ikhlas",
  "Al-Kafirun", "Al-Kautsar", "Al-Ma'un", "Quraisy", "Al-Fil",
  "Al-Humazah", "Al-'Asr", "At-Takatsur", "Al-Qari'ah",
  "Al-'Adiyat", "Az-Zalzalah", "Al-Bayyinah",
  "Al-Qadr", "Al-'Alaq", "At-Tin", "Al-Insyirah",
  "Ad-Duha", "Al-Lail", "Asy-Syams", "Al-Balad",
  "Al-Fajr", "Al-Ghasyiyah", "Al-A'la",
  "Ath-Thariq", "Al-Buruj", "Al-Insyiqaq",
  "Al-Muthaffifin", "Al-Infitar",
  "At-Takwir", "'Abasa", "An-Nazi'at", "An-Naba'",

  // JUZ 29
  "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddassir",
  "Al-Qiyamah", "Al-Insan", "Al-Mursalat",

  // JUZ 28
  "Al-Mujadilah", "Al-Hasyr", "Al-Mumtahanah",
  "As-Saff", "Al-Jumu'ah", "Al-Munafiqun",
  "At-Taghabun", "At-Talaq", "At-Tahrim",

  // JUZ 27
  "Adz-Dzariyat", "At-Tur", "An-Najm", "Al-Qamar",
  "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid",

  // JUZ 26
  "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf"
];

/**
 * =========================
 * 3. URUTAN JUZ SDQ
 * =========================
 * Digunakan oleh engine untuk lintas juz
 */
export const SDQ_JUZ_ORDER = [
  30, 29, 28, 27, 26,
  1, 2, 3, 4, 5,
  6, 7, 8, 9, 10,
  11, 12, 13, 14, 15,
  16, 17, 18, 19, 20,
  21, 22, 23, 24, 25
];

/**
 * =========================
 * 4. HELPER
 * =========================
 */
export const SDQ_TOTAL_IQRA_DAN_QURAN_HALAMAN = (
  quranHalaman: number
): number => {
  return SDQ_IQRA_TOTAL_HALAMAN + quranHalaman;
};
