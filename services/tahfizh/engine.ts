import { QuranAyahData } from './types';
import { QURAN_FULL_MAP } from './quranFullData';
import { QURAN_METADATA } from './quranData';

// ==========================================
// 1. TYPE DEFINITIONS (UPDATED)
// ==========================================

export interface SafeCalculationResult {
  valid: boolean;
  pages: number;
  lines: number;
  totalLines: number;
  // UPDATE: Menggunakan string | null agar Firestore tidak error (jangan undefined)
  reason: string | null; 
}

// ==========================================
// 2. CONSTANTS & CONFIGURATION
// ==========================================

const LINES_PER_PAGE = 15;

const SDQ_JUZ_ORDER = [
  30, 29, 28, 27, 26,
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25
];

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
// 3. PRE-CALCULATION
// ==========================================

const SDQ_INDEX_MAP: Record<number, number> = {};
const SDQ_JUZ_START_OFFSET: Record<number, number> = {};

(() => {
  let cumulativeLines = 0;
  SDQ_JUZ_ORDER.forEach((juz, index) => {
    SDQ_INDEX_MAP[juz] = index;
    SDQ_JUZ_START_OFFSET[juz] = cumulativeLines;
    const limits = JUZ_PAGE_LIMITS[juz];
    const totalPages = limits.end - limits.start + 1;
    cumulativeLines += totalPages * LINES_PER_PAGE;
  });
})();

// ==========================================
// 4. THE ENGINE CLASS
// ==========================================

export class TahfizhEngineSDQ {

  private static normalizeSurah(input: string): string {
    if (!input) return "";
    let normalized = input.toLowerCase().trim();
    normalized = normalized.replace(/['`’‘]/g, "'").replace(/-/g, " "); 
    normalized = normalized.replace(/\bal\s+/g, "al-");

    const map: Record<string, string> = {
      "ali imran": "Ali 'Imran", "al imran": "Ali 'Imran",
      "yasin": "Ya-Sin", "ya sin": "Ya-Sin",
      "amma": "An-Naba'", "an naba": "An-Naba'",
      "al lahab": "Al-Lahab", "al masad": "Al-Lahab",
      "al insyirah": "Al-Insyirah", "alam nasyrah": "Al-Insyirah",
      "at taubah": "At-Taubah", "bara'ah": "At-Taubah"
    };

    if (map[normalized]) return map[normalized];
    if (map[normalized.replace("al-", "al ")]) return map[normalized.replace("al-", "al ")];
    return normalized.replace(/\b\w/g, c => c.toUpperCase());
  }

  private static getCoordinates(surahRaw: string, ayah: number): QuranAyahData | null {
    const surah = this.normalizeSurah(surahRaw);
    const metaKey = Object.keys(QURAN_METADATA).find(k => this.normalizeSurah(k) === this.normalizeSurah(surah));
    
    if (!metaKey) return null;
    const meta = QURAN_METADATA[metaKey];
    if (ayah < 1 || ayah > meta.totalAyah) return null;

    const key = `${metaKey}:${ayah}`;
    if (QURAN_FULL_MAP[key]) {
      return QURAN_FULL_MAP[key];
    }

    const totalPages = meta.endPage - meta.startPage + 1;
    const relativePage = Math.floor(((ayah - 1) / meta.totalAyah) * totalPages);
    const estimatedPage = Math.min(meta.endPage, meta.startPage + relativePage);

    let estimatedJuz = 30;
    for (const [juzStr, limit] of Object.entries(JUZ_PAGE_LIMITS)) {
      const j = parseInt(juzStr);
      if (estimatedPage >= limit.start && estimatedPage <= limit.end) {
        estimatedJuz = j;
        break;
      }
    }

    return { juz: estimatedJuz, page: estimatedPage, line: 1 };
  }

  private static getGlobalSDQLine(coord: QuranAyahData): number {
    const juzOffset = SDQ_JUZ_START_OFFSET[coord.juz];
    if (juzOffset === undefined) throw new Error(`Juz ${coord.juz} not found`);

    const juzStartPage = JUZ_PAGE_LIMITS[coord.juz].start;
    const pageIndexInJuz = coord.page - juzStartPage;
    if (pageIndexInJuz < 0) return juzOffset; 

    const pageOffsetLines = pageIndexInJuz * LINES_PER_PAGE;
    return juzOffset + pageOffsetLines + coord.line;
  }

  // =========================================================
  // UPDATE: Return 'null' instead of 'undefined' for reason
  // =========================================================

  public static calculateRange(startSurah: string, startAyah: number, endSurah: string, endAyah: number): SafeCalculationResult {
    try {
      const startCoord = this.getCoordinates(startSurah, startAyah);
      const endCoord = this.getCoordinates(endSurah, endAyah);

      if (!startCoord || !endCoord) {
        return { 
          valid: false, pages: 0, lines: 0, totalLines: 0, 
          reason: `Surah/Ayat tidak ditemukan: ${!startCoord ? startSurah : endSurah}` 
        };
      }

      const startIdx = SDQ_INDEX_MAP[startCoord.juz];
      const endIdx = SDQ_INDEX_MAP[endCoord.juz];

      if (endIdx < startIdx) {
        return { 
          valid: false, pages: 0, lines: 0, totalLines: 0, 
          reason: "Mundur Kurikulum (Urutan Juz Terbalik)" 
        };
      }

      const absStart = this.getGlobalSDQLine(startCoord);
      const absEnd = this.getGlobalSDQLine(endCoord);

      if (absEnd < absStart) {
        return { 
          valid: false, pages: 0, lines: 0, totalLines: 0, 
          reason: "Ayat terbalik (Akhir < Awal)" 
        };
      }

      const totalLines = absEnd - absStart + 1;
      const pages = Math.floor(totalLines / LINES_PER_PAGE);
      const lines = totalLines % LINES_PER_PAGE;

      return {
        valid: true,
        pages,
        lines,
        totalLines,
        reason: null // SUCCESS: Kirim null (bukan undefined) agar aman di Firestore
      };

    } catch (e: any) {
      console.error("SDQ Engine Error:", e);
      return { 
        valid: false, pages: 0, lines: 0, totalLines: 0, 
        reason: "Internal Calculation Error" 
      };
    }
  }

  public static parseAndCalculate(rangeStr: string): SafeCalculationResult {
    // 1. Validasi Input Awal
    if (!rangeStr || typeof rangeStr !== 'string') {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Input Kosong" };
    }
    const cleanStr = rangeStr.trim();
    if (cleanStr === '-' || cleanStr === '') {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Input Kosong" };
    }

    try {
      const parts = cleanStr.split(/\s*[-–]\s*/);
      
      if (parts.length < 2) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Format harus 'Awal - Akhir'" };
      }

      const startRaw = parts[0].trim();
      let endRaw = parts[1].trim();

      const parseRef = (s: string) => {
        const match = s.match(/^(.*?)[\s:]+(\d+)$/);
        if (match) return { surah: match[1].trim(), ayah: parseInt(match[2]) };
        return null;
      };

      const startObj = parseRef(startRaw);
      if (!startObj) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "Format Awal Salah" };
      }

      let endSurah = startObj.surah;
      let endAyah = 0;

      if (/^\d+$/.test(endRaw)) {
        endAyah = parseInt(endRaw);
      } else {
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
