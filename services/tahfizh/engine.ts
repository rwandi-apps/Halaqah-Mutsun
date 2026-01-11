
import { QuranAyahData } from './types';
import { QURAN_FULL_MAP } from './quranFullData';
import { QURAN_METADATA } from './quranData';

// ==========================================
// 1. TYPE DEFINITIONS & CONSTANTS
// ==========================================

export interface SafeCalculationResult {
  valid: boolean;
  pages: number;
  lines: number;
  totalLines: number;
  reason?: string;
}

// URUTAN KURIKULUM SDQ RESMI
// Engine menggunakan ini untuk menentukan "Maju" atau "Mundur"
const SDQ_JUZ_ORDER = [
  30, 29, 28, 27, 26,
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25
];

// Map Juz -> Index SDQ (0 = Juz 30, 5 = Juz 1)
const SDQ_INDEX_MAP: Record<number, number> = {};
SDQ_JUZ_ORDER.forEach((juz, idx) => { SDQ_INDEX_MAP[juz] = idx; });

// KONFIGURASI FISIK MUSHAF MADINAH (15 Baris)
const LINES_PER_PAGE = 15;

// BATAS HALAMAN FISIK PER JUZ (DATA STATIS AKURAT)
// Format: { startPage, endPage } inklusif
const JUZ_PAGE_LIMITS: Record<number, { start: number, end: number }> = {
  1: { start: 1, end: 21 },
  2: { start: 22, end: 41 },
  3: { start: 42, end: 61 },
  4: { start: 62, end: 81 },
  5: { start: 82, end: 101 },
  6: { start: 102, end: 121 },
  7: { start: 122, end: 141 },
  8: { start: 142, end: 161 },
  9: { start: 162, end: 181 },
  10: { start: 182, end: 201 },
  11: { start: 202, end: 221 },
  12: { start: 222, end: 241 },
  13: { start: 242, end: 261 },
  14: { start: 262, end: 281 },
  15: { start: 282, end: 301 },
  16: { start: 302, end: 321 },
  17: { start: 322, end: 341 },
  18: { start: 342, end: 361 },
  19: { start: 362, end: 381 },
  20: { start: 382, end: 401 },
  21: { start: 402, end: 421 },
  22: { start: 422, end: 441 },
  23: { start: 442, end: 461 },
  24: { start: 462, end: 481 },
  25: { start: 482, end: 501 },
  26: { start: 502, end: 521 },
  27: { start: 522, end: 541 },
  28: { start: 542, end: 561 },
  29: { start: 562, end: 581 },
  30: { start: 582, end: 604 }
};

export class TahfizhEngineSDQ {

  // ==========================================
  // 2. HELPER FUNCTIONS (PRIVATE)
  // ==========================================

  /**
   * Normalisasi Nama Surah (Case Insensitive & Typo Handling)
   * Mengubah variasi input menjadi key standar di QURAN_METADATA
   */
  private static normalizeSurah(input: string): string {
    if (!input) return "";
    let normalized = input.toLowerCase().trim();
    
    // Bersihkan karakter khusus
    normalized = normalized.replace(/['`’‘]/g, "'"); // Standardize apostrophe
    normalized = normalized.replace(/\s*-\s*/g, "-"); // Remove spaces around hyphen
    normalized = normalized.replace(/\bal\s+/g, "al-"); // Standardize prefix

    // Mapping Typo/Alias Umum
    const map: Record<string, string> = {
      "ali imran": "Ali 'Imran", 
      "al-imran": "Ali 'Imran",
      "ali-imran": "Ali 'Imran",
      "al imran": "Ali 'Imran",
      "yasin": "Ya-Sin", 
      "ya sin": "Ya-Sin",
      "ya-sin": "Ya-Sin",
      "amma": "An-Naba'", 
      "an naba": "An-Naba'",
      "an-naba": "An-Naba'",
      "al-lahab": "Al-Lahab", 
      "al masad": "Al-Lahab",
      "al-insyirah": "Al-Insyirah", 
      "alam nasyrah": "Al-Insyirah",
      "al-waqi'ah": "Al-Waqi'ah",
      "al waqiah": "Al-Waqi'ah",
      "al-waqiah": "Al-Waqi'ah"
    };

    if (map[normalized]) return map[normalized];
    
    // Capitalize standard: al-baqarah -> Al-Baqarah
    // Menangani Al-Baqarah, An-Nas, dll.
    return normalized.replace(/(^|-)(\w)/g, (match) => match.toUpperCase());
  }

  /**
   * Mendapatkan Koordinat Fisik (Juz, Page, Line)
   * Mengutamakan QURAN_FULL_MAP, fallback ke Metadata untuk validasi.
   */
  private static getCoordinates(surahRaw: string, ayah: number): QuranAyahData | null {
    const surah = this.normalizeSurah(surahRaw);
    
    // 1. Cek Metadata (Validasi Eksistensi Surah & Ayat)
    // Cari key di metadata yang cocok (case insensitive match)
    const metaKey = Object.keys(QURAN_METADATA).find(k => k === surah || this.normalizeSurah(k) === surah);
    
    if (!metaKey) return null; // Surah tidak ditemukan sama sekali
    
    const meta = QURAN_METADATA[metaKey];
    if (ayah < 1 || ayah > meta.totalAyah) return null; // Ayat out of bound

    // 2. Cek Exact Map (Prioritas Utama - Data Presisi)
    const key = `${metaKey}:${ayah}`;
    if (QURAN_FULL_MAP[key]) {
      return QURAN_FULL_MAP[key];
    }

    // 3. Fallback: Estimasi Linear (Hanya jika data baris tidak ada di MAP)
    // Digunakan agar sistem tidak crash jika data FULL_MAP belum 100% lengkap
    const totalPages = meta.endPage - meta.startPage + 1;
    const progress = (ayah - 1) / meta.totalAyah;
    const estimatedPage = Math.min(meta.endPage, meta.startPage + Math.floor(progress * totalPages));
    const estimatedLine = Math.floor(((progress * totalPages) % 1) * LINES_PER_PAGE) + 1;
    
    // Estimasi Juz dari Halaman Fisik
    let estimatedJuz = 30;
    for (const [juzStr, limit] of Object.entries(JUZ_PAGE_LIMITS)) {
      const j = parseInt(juzStr);
      if (estimatedPage >= limit.start && estimatedPage <= limit.end) {
        estimatedJuz = j;
        break;
      }
    }

    return {
      juz: estimatedJuz,
      page: estimatedPage,
      line: Math.max(1, Math.min(15, estimatedLine))
    };
  }

  /**
   * Menghitung total baris absolut dalam sebuah juz fisik (0-based)
   * Relatif terhadap awal juz tersebut.
   */
  private static getAbsLineInJuz(page: number, line: number, juz: number): number {
    const limits = JUZ_PAGE_LIMITS[juz];
    if (!limits) return 0;
    
    const juzStartPage = limits.start;
    // Halaman ke-n dalam juz ini (0-indexed)
    const pageIndexInJuz = page - juzStartPage;
    // (Jumlah halaman penuh * 15) + baris saat ini
    return (pageIndexInJuz * LINES_PER_PAGE) + line;
  }

  /**
   * Menghitung total kapasitas baris dalam satu Juz penuh
   */
  private static getTotalLinesInJuz(juz: number): number {
    const limit = JUZ_PAGE_LIMITS[juz];
    if (!limit) return 0;
    const totalPages = limit.end - limit.start + 1;
    return totalPages * LINES_PER_PAGE;
  }

  // ==========================================
  // 3. CORE LOGIC (PUBLIC)
  // ==========================================

  /**
   * Menghitung Volume Hafalan (SDQ Logic)
   * 
   * @param fromRaw Nama surat awal
   * @param fromAyah Ayat awal
   * @param toRaw Nama surat akhir
   * @param toAyah Ayat akhir
   */
  public static calculateRange(fromRaw: string, fromAyah: number, toRaw: string, toAyah: number): SafeCalculationResult {
    try {
      const startCoord = this.getCoordinates(fromRaw, fromAyah);
      const endCoord = this.getCoordinates(toRaw, toAyah);

      // Fail-safe: Jika koordinat tidak ditemukan (typo atau out of range)
      if (!startCoord || !endCoord) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Surah/Ayat tidak valid atau tidak ditemukan" };
      }

      const startIdx = SDQ_INDEX_MAP[startCoord.juz];
      const endIdx = SDQ_INDEX_MAP[endCoord.juz];
      if (startIdx === undefined || endIdx === undefined) {
  return {
    valid: false,
    pages: 0,
    lines: 0,
    totalLines: 0,
    reason: "Juz tidak valid dalam urutan SDQ"
  };
}

      // --- VALIDASI RANGE (SDQ LOGIC) ---
      
      // Case: Mundur Juz secara kurikulum (Misal Juz 1 -> Juz 30) -> INVALID di SDQ
      // (Index Juz 1 = 5, Index Juz 30 = 0. Jadi 0 < 5. End < Start)
      if (endIdx < startIdx) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: `Mundur Kurikulum (Juz ${startCoord.juz} -> ${endCoord.juz})` };
      }

      let totalLinesDiff = 0;

      // KASUS A: JUZ SAMA
      if (startCoord.juz === endCoord.juz) {
        // Hitung posisi absolut baris dari awal mushaf (Halaman 1, Baris 1)
        // Karena dalam 1 juz, urutan fisik halaman selalu naik
        const absStart = (startCoord.page * LINES_PER_PAGE) + startCoord.line;
        const absEnd = (endCoord.page * LINES_PER_PAGE) + endCoord.line;

        if (absEnd < absStart) {
          return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Ayat terbalik (Mundur dalam satu Juz)" };
        }
        
        totalLinesDiff = absEnd - absStart + 1; // Inklusif
      } 
      // KASUS B: LINTAS JUZ (Maju Sesuai Kurikulum SDQ)
      else {
        // 1. Hitung sisa baris di Juz Awal
        // (Total kapasitas juz - posisi saat ini + 1)
        // Misal: Total 300 baris. Kita di baris 290. Sisa = 300 - 290 + 1 = 11 baris (termasuk baris 290)
        // Perbaiki logika: Sisa adalah (Total Baris Juz) - (Posisi Absolut di Juz) + 1 ?
        // Mari cek: Posisi 1 (awal). Total 10. Sisa = 10 - 1 + 1 = 10. Benar.
        // Posisi 10 (akhir). Total 10. Sisa = 10 - 10 + 1 = 1. Benar.
        const totalLinesInStartJuz = this.getTotalLinesInJuz(startCoord.juz);
        const currentPosInStartJuz = this.getAbsLineInJuz(startCoord.page, startCoord.line, startCoord.juz);
        const linesInStartJuz = Math.max(0, totalLinesInStartJuz - currentPosInStartJuz + 1);

        // 2. Hitung baris di Juz Akhir
        // (Posisi saat ini di Juz Akhir)
        // Misal kita sampai di baris ke-5 Juz Akhir. Berarti kita hafal 5 baris di juz itu.
        const linesInEndJuz = this.getAbsLineInJuz(endCoord.page, endCoord.line, endCoord.juz);

        // 3. Hitung Juz di antaranya (Full Juz)
        // Loop dari (Index Awal + 1) sampai (Index Akhir - 1)
        let intermediateLines = 0;
        for (let i = startIdx + 1; i < endIdx; i++) {
          const midJuz = SDQ_JUZ_ORDER[i];
          intermediateLines += this.getTotalLinesInJuz(midJuz);
        }

        totalLinesDiff = linesInStartJuz + linesInEndJuz + intermediateLines;
      }

      // Konversi ke Pages & Lines
      const pages = Math.floor(totalLinesDiff / LINES_PER_PAGE);
      const lines = totalLinesDiff % LINES_PER_PAGE;

      return {
        valid: true,
        pages,
        lines,
        totalLines: totalLinesDiff
      };

    } catch (e) {
      console.error("SDQ Engine Error:", e);
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Internal Error" };
    }
  }

  /**
   * PARSING STRING INPUT (e.g. "Al-Mursalat:1 - Al-Mujadilah:21")
   * Juga menangani format: "Al-Mulk: 1 - 10" (Short)
   */
  public static parseAndCalculate(rangeStr: string): SafeCalculationResult {
    // 1. Handle Empty / Dash / Null Safety
    if (!rangeStr || typeof rangeStr !== 'string') {
      return { valid: true, pages: 0, lines: 0, totalLines: 0, reason: "Empty Input" };
    }
    
    const cleanStr = rangeStr.trim();
    if (cleanStr === '-' || cleanStr === '' || cleanStr === 'Belum Ada') {
      return { valid: true, pages: 0, lines: 0, totalLines: 0, reason: "Empty Input" };
    }
// BACKWARD COMPATIBILITY: jika string TIDAK mengandung ":"
if (!cleanStr.includes(':')) {
  return {
    valid: true,
    pages: 0,
    lines: 0,
    totalLines: 0,
    reason: "Legacy / Non-range data"
  };
}
    try {
      // Split " - " atau " – " (em dash)
      const parts = cleanStr.split(/\s*[-–]\s*/); 
      
      if (parts.length < 2) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Format Invalid (Butuh Separator '-')" };
      }

      const startRaw = parts[0].trim();
      let endRaw = parts[1].trim();

      // Regex Parser: "Nama Surat : Angka"
      // Capture 1: Nama (bisa ada spasi, angka, kutip)
      // Capture 2: Nomor Ayat
      const parseRef = (s: string) => {
        // Regex yang lebih toleran terhadap spasi di sekitar titik dua
        const match = s.match(/^(.*?)\s*[:]\s*(\d+)$/);
        if (match) return { surah: match[1].trim(), ayah: parseInt(match[2]) };
        return null;
      };

      const startObj = parseRef(startRaw);
      if (!startObj) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Format Awal Salah" };
      }

      let endSurah = startObj.surah;
      let endAyah = 0;

      // Cek End Part
      // Jika End Part hanya angka -> Format Pendek (Surah sama)
      if (/^\d+$/.test(endRaw)) {
        endAyah = parseInt(endRaw);
      } else {
        // Format Panjang
        const endObj = parseRef(endRaw);
        if (endObj) {
          endSurah = endObj.surah;
          endAyah = endObj.ayah;
        } else {
          return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Format Akhir Salah" };
        }
      }

      return this.calculateRange(startObj.surah, startObj.ayah, endSurah, endAyah);

    } catch (e) {
      // Catch-all agar tidak throw error ke UI
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Parser Crash" };
    }
  }
}
