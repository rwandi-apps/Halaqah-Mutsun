import { QuranAyahData } from './types';
import { QURAN_FULL_MAP } from './quranFullData';
import { QURAN_METADATA } from './quranData';

// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================

export interface SafeCalculationResult {
  valid: boolean;
  pages: number;
  lines: number;
  totalLines: number; // Total baris absolut (untuk debugging/sorting)
  reason?: string;    // Pesan error atau info jika valid: false
}

// ==========================================
// 2. CONSTANTS & CONFIGURATION
// ==========================================

const LINES_PER_PAGE = 15;

// Urutan Kurikulum SDQ (Juz 30 -> 29 ... -> 1 ... -> 25)
const SDQ_JUZ_ORDER = [
  30, 29, 28, 27, 26,
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25
];

// Mapping Halaman Fisik per Juz (Start & End Inclusive)
const JUZ_PAGE_LIMITS: Record<number, { start: number; end: number }> = {
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

// ==========================================
// 3. PRE-CALCULATION (STATIC CACHE)
// ==========================================

// Map: Juz ID -> Index Urutan SDQ (0..29)
const SDQ_INDEX_MAP: Record<number, number> = {};

// Map: Juz ID -> Jumlah Total Baris sebelum Juz ini dimulai (Cumulative Offset)
// Ini memungkinkan kita mengubah posisi (Juz, Page, Line) menjadi satu angka linear.
const SDQ_JUZ_START_OFFSET: Record<number, number> = {};

// Initializer Block
(() => {
  let cumulativeLines = 0;
  
  SDQ_JUZ_ORDER.forEach((juz, index) => {
    // 1. Simpan Index Urutan
    SDQ_INDEX_MAP[juz] = index;

    // 2. Simpan Offset Baris Awal Juz ini
    SDQ_JUZ_START_OFFSET[juz] = cumulativeLines;

    // 3. Hitung baris dalam juz ini untuk iterasi berikutnya
    const limits = JUZ_PAGE_LIMITS[juz];
    const totalPages = limits.end - limits.start + 1;
    const linesInThisJuz = totalPages * LINES_PER_PAGE;
    
    cumulativeLines += linesInThisJuz;
  });
})();

// ==========================================
// 4. THE ENGINE CLASS
// ==========================================

export class TahfizhEngineSDQ {

  /**
   * Normalisasi Nama Surah agar seragam
   */
  private static normalizeSurah(input: string): string {
    if (!input) return "";
    let normalized = input.toLowerCase().trim();
    // Hapus karakter spesial umum
    normalized = normalized.replace(/['`’‘]/g, "'").replace(/-/g, " "); 
    normalized = normalized.replace(/\bal\s+/g, "al-"); // Standardize "al fatihah" -> "al-fatihah"

    // Mapping nama umum/typo ke Key Metadata yang valid
    const map: Record<string, string> = {
      "ali imran": "Ali 'Imran", "al imran": "Ali 'Imran",
      "yasin": "Ya-Sin", "ya sin": "Ya-Sin",
      "amma": "An-Naba'", "an naba": "An-Naba'",
      "al lahab": "Al-Lahab", "al masad": "Al-Lahab",
      "al insyirah": "Al-Insyirah", "alam nasyrah": "Al-Insyirah",
      "at taubah": "At-Taubah", "bara'ah": "At-Taubah"
    };

    // Cek mapping manual
    if (map[normalized]) return map[normalized];
    if (map[normalized.replace("al-", "al ")]) return map[normalized.replace("al-", "al ")];

    // Auto Capitalize (al-baqarah -> Al-Baqarah)
    return normalized.replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Mendapatkan Koordinat Fisik (Juz, Page, Line)
   */
  private static getCoordinates(surahRaw: string, ayah: number): QuranAyahData | null {
    const surah = this.normalizeSurah(surahRaw);
    
    // 1. Cek Metadata untuk validasi dasar
    // Mencari key asli di QURAN_METADATA yang cocok dengan surah yg sudah dinormalisasi
    const metaKey = Object.keys(QURAN_METADATA).find(k => this.normalizeSurah(k) === this.normalizeSurah(surah));
    
    if (!metaKey) return null; // Surah tidak ditemukan
    const meta = QURAN_METADATA[metaKey];
    
    if (ayah < 1 || ayah > meta.totalAyah) return null; // Ayat out of bound

    // 2. Cek Exact Map (Prioritas Utama - Data 100% Akurat)
    const key = `${metaKey}:${ayah}`;
    if (QURAN_FULL_MAP[key]) {
      return QURAN_FULL_MAP[key];
    }

    // 3. Fail-Safe / Fallback (Hanya jika data belum diinput)
    // Warning: Ini estimasi kasar. Sebaiknya QURAN_FULL_MAP dilengkapi.
    
    // Estimasi Halaman
    const totalPages = meta.endPage - meta.startPage + 1;
    // (Ayat-1)/TotalAyah * JmlHalaman
    const relativePage = Math.floor(((ayah - 1) / meta.totalAyah) * totalPages);
    const estimatedPage = Math.min(meta.endPage, meta.startPage + relativePage);

    // Cari Juz dari Halaman Estimasi
    let estimatedJuz = 30; // Default safe
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
      line: 1 // Default ke baris 1 agar aman
    };
  }

  /**
   * Mengubah Koordinat (Juz, Page, Line) menjadi SATU angka Absolut (Global Line Index)
   * Berdasarkan urutan Kurikulum SDQ.
   */
  private static getGlobalSDQLine(coord: QuranAyahData): number {
    // 1. Ambil Offset Awal Juz (Berapa banyak baris dari juz-juz sebelumnya sesuai urutan SDQ)
    const juzOffset = SDQ_JUZ_START_OFFSET[coord.juz];
    
    if (juzOffset === undefined) {
      throw new Error(`Juz ${coord.juz} tidak terdaftar dalam kurikulum SDQ`);
    }

    // 2. Hitung Offset Halaman dalam Juz tersebut
    // Halaman pertama juz bernilai 0, kedua bernilai 1, dst.
    const juzStartPage = JUZ_PAGE_LIMITS[coord.juz].start;
    const pageIndexInJuz = coord.page - juzStartPage;
    
    // Validasi safety (jika map salah dan page keluar dari range juz)
    if (pageIndexInJuz < 0) return juzOffset; // Fallback ke awal juz

    const pageOffsetLines = pageIndexInJuz * LINES_PER_PAGE;

    // 3. Offset Baris (1-based to 0-based calculation, but we keep logic consistent later)
    // Kita anggap Line 1 adalah index 1 untuk perhitungan quantity
    const lineOffset = coord.line;

    return juzOffset + pageOffsetLines + lineOffset;
  }

  /**
   * CORE FUNCTION: Menghitung Volume Hafalan
   */
  public static calculateRange(startSurah: string, startAyah: number, endSurah: string, endAyah: number): SafeCalculationResult {
    try {
      // 1. Resolve Coordinates
      const startCoord = this.getCoordinates(startSurah, startAyah);
      const endCoord = this.getCoordinates(endSurah, endAyah);

      if (!startCoord || !endCoord) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: `Surah/Ayat tidak ditemukan: ${!startCoord ? startSurah : endSurah}` };
      }

      // 2. Validasi Arah Kurikulum (Backwards Check)
      const startIdx = SDQ_INDEX_MAP[startCoord.juz];
      const endIdx = SDQ_INDEX_MAP[endCoord.juz];

      // Jika Index Akhir LEBIH KECIL dari Index Awal, berarti mundur (Misal: Juz 1 -> Juz 30)
      if (endIdx < startIdx) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Mundur Kurikulum (Urutan Juz Terbalik)" };
      }

      // 3. Konversi ke Global Absolute Lines
      const absStart = this.getGlobalSDQLine(startCoord);
      const absEnd = this.getGlobalSDQLine(endCoord);

      // Validasi Mundur dalam Satu Juz (Misal: Ayat 10 -> Ayat 1)
      if (absEnd < absStart) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Ayat terbalik (Akhir < Awal)" };
      }

      // 4. Hitung Selisih
      // Rumus: (Akhir - Awal) + 1 (Inklusif)
      const totalLines = absEnd - absStart + 1;

      // 5. Konversi ke Halaman & Baris (Format 15 baris)
      const pages = Math.floor(totalLines / LINES_PER_PAGE);
      const lines = totalLines % LINES_PER_PAGE;

      return {
        valid: true,
        pages,
        lines,
        totalLines
      };

    } catch (e: any) {
      console.error("SDQ Engine Error:", e);
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Internal Calculation Error" };
    }
  }

  /**
   * Helper: Parser String Flexible
   * Menerima: "Surah:Ayat - Surah:Ayat" atau "Surah:Ayat - Ayat"
   */
  public static parseAndCalculate(rangeStr: string): SafeCalculationResult {
    if (!rangeStr || typeof rangeStr !== 'string') {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Input Kosong" };
    }
    
    const cleanStr = rangeStr.trim();
    if (cleanStr === '-' || cleanStr === '') {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Input Kosong" };
    }

    try {
      // Split by "-" or "–"
      const parts = cleanStr.split(/\s*[-–]\s*/);
      
      if (parts.length < 2) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Format harus 'Awal - Akhir'" };
      }

      const startRaw = parts[0].trim();
      let endRaw = parts[1].trim();

      // Regex Parser: Menangkap "Nama Surat" dan "Ayat"
      // Mendukung: "Al-Baqarah:1", "Al Baqarah 1", "Al-Baqarah : 1"
      const parseRef = (s: string) => {
        // Regex logic:
        // ^(.*?): Group 1 (Nama Surat) - ambil apa saja di depan
        // [\s:]+: Separator (spasi atau titik dua)
        // (\d+)$: Group 2 (Angka Ayat) - di paling belakang
        const match = s.match(/^(.*?)[\s:]+(\d+)$/);
        if (match) return { surah: match[1].trim(), ayah: parseInt(match[2]) };
        return null;
      };

      const startObj = parseRef(startRaw);
      if (!startObj) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Format Awal Salah (Cth: Al-Fatihah:1)" };
      }

      let endSurah = startObj.surah;
      let endAyah = 0;

      // Cek apakah End Part cuma angka? "Al-Mulk: 1 - 10"
      if (/^\d+$/.test(endRaw)) {
        endAyah = parseInt(endRaw);
      } else {
        // Full format: "Al-Mulk: 1 - Al-Mulk: 10"
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
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Gagal memproses teks input" };
    }
  }
}
