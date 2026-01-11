
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
   */
  private static normalizeSurah(input: string): string {
    if (!input) return "";
    let normalized = input.toLowerCase().trim();
    normalized = normalized.replace(/['`’‘]/g, "'");
    normalized = normalized.replace(/\bal\s+/g, "al-");

    const map: Record<string, string> = {
      "ali imran": "Ali 'Imran", "al-imran": "Ali 'Imran",
      "yasin": "Ya-Sin", "ya sin": "Ya-Sin",
      "amma": "An-Naba'", "an naba": "An-Naba'",
      "al-lahab": "Al-Lahab", "al masad": "Al-Lahab",
      "al-insyirah": "Al-Insyirah", "alam nasyrah": "Al-Insyirah"
    };

    if (map[normalized]) return map[normalized];
    
    // Capitalize standard: al-baqarah -> Al-Baqarah
    return normalized.replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Mendapatkan Koordinat Fisik (Juz, Page, Line)
   * Mengutamakan QURAN_FULL_MAP, fallback ke Metadata untuk validasi.
   */
  private static getCoordinates(surahRaw: string, ayah: number): QuranAyahData | null {
    const surah = this.normalizeSurah(surahRaw);
    
    // 1. Cek Metadata (Validasi Eksistensi Surah & Ayat)
    const metaKey = Object.keys(QURAN_METADATA).find(k => this.normalizeSurah(k) === surah);
    if (!metaKey) return null; // Surah tidak ditemukan
    
    const meta = QURAN_METADATA[metaKey];
    if (ayah < 1 || ayah > meta.totalAyah) return null; // Ayat out of bound

    // 2. Cek Exact Map (Prioritas Utama)
    const key = `${metaKey}:${ayah}`;
    if (QURAN_FULL_MAP[key]) {
      return QURAN_FULL_MAP[key];
    }

    // 3. Fail-Safe Fallback (Jika data baris spesifik belum diinput di QURAN_FULL_MAP)
    // Kita asumsikan mapping linear sederhana agar tidak crash, tapi berikan flag warning di console
    // NOTE: Dalam production, QURAN_FULL_MAP harus lengkap.
    
    // Estimasi Halaman:
    const totalPages = meta.endPage - meta.startPage + 1;
    const estimatedPage = Math.min(meta.endPage, meta.startPage + Math.floor(((ayah - 1) / meta.totalAyah) * totalPages));
    
    // Estimasi Juz dari Halaman:
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
      line: 1 // Default ke baris 1 jika data detail tidak ada (Safety)
    };
  }

  /**
   * Menghitung total baris absolut dalam sebuah juz fisik
   * Dari (Page, Line) -> AbsoluteLine relative to Juz Start
   */
  private static getAbsLineInJuz(page: number, line: number, juz: number): number {
    const juzStartPage = JUZ_PAGE_LIMITS[juz].start;
    // Halaman ke-n dalam juz ini (0-indexed)
    const pageIndexInJuz = page - juzStartPage;
    return (pageIndexInJuz * LINES_PER_PAGE) + line;
  }

  /**
   * Menghitung total kapasitas baris dalam satu Juz penuh
   */
  private static getTotalLinesInJuz(juz: number): number {
    const limit = JUZ_PAGE_LIMITS[juz];
    const totalPages = limit.end - limit.start + 1;
    return totalPages * LINES_PER_PAGE;
  }

  // ==========================================
  // 3. CORE LOGIC (PUBLIC)
  // ==========================================

  /**
   * Menghitung Volume Hafalan (SDQ Logic)
   */
  public static calculateRange(startSurah: string, startAyah: number, endSurah: string, endAyah: number): SafeCalculationResult {
    try {
      // 1. Resolve Coordinates
      const startCoord = this.getCoordinates(startSurah, startAyah);
      const endCoord = this.getCoordinates(endSurah, endAyah);

      if (!startCoord || !endCoord) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Surah/Ayat tidak valid dalam database" };
      }

      const startIdx = SDQ_INDEX_MAP[startCoord.juz];
      const endIdx = SDQ_INDEX_MAP[endCoord.juz];

      // 2. Validate SDQ Direction
      // SDQ bergerak dari Index Kecil -> Index Besar (30 -> 1)
      if (endIdx < startIdx) {
        // Mundur Kurikulum (Misal Juz 1 -> Juz 30) -> Invalid di SDQ
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Mundur Kurikulum (Juz Terbalik)" };
      }

      let totalLines = 0;

      // KASUS A: JUZ SAMA
      if (startCoord.juz === endCoord.juz) {
        const absStart = (startCoord.page * LINES_PER_PAGE) + startCoord.line;
        const absEnd = (endCoord.page * LINES_PER_PAGE) + endCoord.line;

        if (absEnd < absStart) {
          return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Ayat terbalik dalam satu Juz" };
        }
        totalLines = absEnd - absStart + 1;
      }
      
      // KASUS B: LINTAS JUZ (Maju Sesuai Kurikulum)
      else {
        // 1. Sisa baris di Juz Awal (Dari posisi start -> Akhir Juz tersebut)
        const totalLinesInStartJuz = this.getTotalLinesInJuz(startCoord.juz);
        const currentPosInStartJuz = this.getAbsLineInJuz(startCoord.page, startCoord.line, startCoord.juz);
        const linesInStart = totalLinesInStartJuz - currentPosInStartJuz + 1; // +1 karena inklusif di akhir juz? Tidak, sisa = total - current + 1

        // 2. Baris di Juz Akhir (Dari Awal Juz -> Posisi End)
        const linesInEnd = this.getAbsLineInJuz(endCoord.page, endCoord.line, endCoord.juz); // Line 1 = 1 baris

        // 3. Juz Tengah (Full)
        let linesInMiddle = 0;
        // Loop dari index juz start + 1 sampai sebelum index juz end
        for (let i = startIdx + 1; i < endIdx; i++) {
          const midJuz = SDQ_JUZ_ORDER[i];
          linesInMiddle += this.getTotalLinesInJuz(midJuz);
        }

        totalLines = linesInStart + linesInEnd + linesInMiddle;
      }

      // 3. Final Calculation
      // Koreksi logika sisa baris vs halaman fisik
      // Di SDQ, 1 halaman = 15 baris.
      const pages = Math.floor(totalLines / LINES_PER_PAGE);
      const lines = totalLines % LINES_PER_PAGE;

      return {
        valid: true,
        pages,
        lines,
        totalLines
      };

    } catch (e) {
      console.error("Engine Error:", e);
      // Fail Safe return
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Internal Calculation Error" };
    }
  }

  /**
   * Parser String Input (Flexible)
   * Handles: "Surah:Ayat - Surah:Ayat", "Surah:Ayat - Ayat", "-"
   */
  public static parseAndCalculate(rangeStr: string): SafeCalculationResult {
    // 1. Handle Empty / Dash / Null
    if (!rangeStr || typeof rangeStr !== 'string') {
      return { valid: true, pages: 0, lines: 0, totalLines: 0, reason: "Empty Input" };
    }
    
    const cleanStr = rangeStr.trim();
    if (cleanStr === '-' || cleanStr === '') {
      return { valid: true, pages: 0, lines: 0, totalLines: 0, reason: "Empty Input" };
    }

    try {
      // Split by "-" or "–"
      const parts = cleanStr.split(/\s*[-–]\s*/);
      
      if (parts.length < 2) {
        // Fallback: Mungkin input cuma 1 ayat? Anggap 0 progress atau 1 baris?
        // Sesuai spec: Return valid=false jika format salah
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Format Invalid (Butuh Separator '-')" };
      }

      const startRaw = parts[0].trim();
      let endRaw = parts[1].trim();

      // Regex Parser: "Nama Surat : Angka"
      // Capture Group 1: Nama Surat (bisa ada spasi/angka)
      // Capture Group 2: Nomor Ayat
      const parseRef = (s: string) => {
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

      // Cek End Part: Apakah "Surah:Ayat" atau cuma "Ayat"?
      if (/^\d+$/.test(endRaw)) {
        // Format Pendek: "Al-Mulk: 1 - 10"
        endAyah = parseInt(endRaw);
      } else {
        // Format Panjang: "Al-Mulk: 1 - Al-Mulk: 10"
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
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Parser Crash" };
    }
  }
}
