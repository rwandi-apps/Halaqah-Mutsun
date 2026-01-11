import { QuranAyahData } from './types';
import { QURAN_FULL_MAP } from './quranFullData';
import { QURAN_METADATA } from './quranData';

// =====================================================
// 1. TYPE & KONSTANTA
// =====================================================

export interface SafeCalculationResult {
  valid: boolean;
  pages: number;
  lines: number;
  totalLines: number;
  reason?: string;
}

// Urutan resmi kurikulum SDQ
// Index kecil → lebih dulu dipelajari
const SDQ_JUZ_ORDER = [
  30, 29, 28, 27, 26,
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25
];

// Map juz → index SDQ
const SDQ_INDEX_MAP: Record<number, number> = {};
SDQ_JUZ_ORDER.forEach((juz, i) => {
  SDQ_INDEX_MAP[juz] = i;
});

// Mushaf Madinah
const LINES_PER_PAGE = 15;

// Batas halaman fisik per juz (AKURAT – STATIC)
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

// =====================================================
// 2. ENGINE
// =====================================================

export class TahfizhEngineSDQ {

  // -------------------------------
  // NORMALISASI NAMA SURAT
  // -------------------------------
  private static normalizeSurah(input: string): string {
    if (!input) return '';
    let s = input.toLowerCase().trim();
    s = s.replace(/['`’‘]/g, "'");
    s = s.replace(/\bal\s+/g, 'al-');

    const map: Record<string, string> = {
      "ali imran": "Ali 'Imran",
      "al-imran": "Ali 'Imran",
      "yasin": "Ya-Sin",
      "ya sin": "Ya-Sin",
      "amma": "An-Naba'",
      "an naba": "An-Naba'",
      "al masad": "Al-Lahab",
      "al-lahab": "Al-Lahab",
      "alam nasyrah": "Al-Insyirah",
      "al-insyirah": "Al-Insyirah"
    };

    if (map[s]) return map[s];
    return s.replace(/\b\w/g, c => c.toUpperCase());
  }

  // -------------------------------
  // ABSOLUTE LINE (GLOBAL)
  // -------------------------------
  private static absLine(page: number, line: number): number {
    return ((page - 1) * LINES_PER_PAGE) + line;
  }

  // -------------------------------
  // ABS LINE DALAM SATU JUZ
  // -------------------------------
  private static absLineInJuz(page: number, line: number, juz: number): number {
    const startPage = JUZ_PAGE_LIMITS[juz].start;
    return ((page - startPage) * LINES_PER_PAGE) + line;
  }

  private static totalLinesInJuz(juz: number): number {
    const { start, end } = JUZ_PAGE_LIMITS[juz];
    return (end - start + 1) * LINES_PER_PAGE;
  }

  // -------------------------------
  // RESOLVE KOORDINAT AYAT (WAJIB EXACT)
  // -------------------------------
  private static getCoordinates(surahRaw: string, ayah: number): QuranAyahData | null {
    const surah = this.normalizeSurah(surahRaw);

    const metaKey = Object.keys(QURAN_METADATA)
      .find(k => this.normalizeSurah(k) === surah);

    if (!metaKey) return null;

    const meta = QURAN_METADATA[metaKey];
    if (ayah < 1 || ayah > meta.totalAyah) return null;

    const key = `${metaKey}:${ayah}`;
    if (!QURAN_FULL_MAP[key]) return null;

    return QURAN_FULL_MAP[key];
  }

  // =====================================================
  // CORE CALCULATION
  // =====================================================
  public static calculateRange(
    startSurah: string,
    startAyah: number,
    endSurah: string,
    endAyah: number
  ): SafeCalculationResult {

    const start = this.getCoordinates(startSurah, startAyah);
    const end = this.getCoordinates(endSurah, endAyah);

    if (!start || !end) {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: 'Ayat tidak ditemukan' };
    }

    const startIdx = SDQ_INDEX_MAP[start.juz];
    const endIdx = SDQ_INDEX_MAP[end.juz];

    // Validasi arah SDQ
    if (endIdx < startIdx) {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: 'Mundur kurikulum SDQ' };
    }

    let totalLines = 0;

    // ===== JUZ SAMA =====
    if (start.juz === end.juz) {
      const a = this.absLine(start.page, start.line);
      const b = this.absLine(end.page, end.line);

      if (b < a) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: 'Ayat terbalik' };
      }

      totalLines = b - a + 1;
    }
    // ===== LINTAS JUZ =====
    else {
      const startJuzTotal = this.totalLinesInJuz(start.juz);
      const startPos = this.absLineInJuz(start.page, start.line, start.juz);
      const linesStart = startJuzTotal - startPos + 1;

      const linesEnd = this.absLineInJuz(end.page, end.line, end.juz);

      let middle = 0;
      for (let i = startIdx + 1; i < endIdx; i++) {
        middle += this.totalLinesInJuz(SDQ_JUZ_ORDER[i]);
      }

      totalLines = linesStart + middle + linesEnd;
    }

    // ===== KONVERSI BARIS → HALAMAN =====
    const pages = Math.floor((totalLines - 1) / LINES_PER_PAGE);
    const lines = ((totalLines - 1) % LINES_PER_PAGE) + 1;

    return {
      valid: true,
      pages,
      lines,
      totalLines
    };
  }

  // =====================================================
  // PARSER STRING INPUT
  // =====================================================
  public static parseAndCalculate(rangeStr: string): SafeCalculationResult {
    if (!rangeStr || rangeStr.trim() === '' || rangeStr.trim() === '-') {
      return { valid: true, pages: 0, lines: 0, totalLines: 0 };
    }

    const parts = rangeStr.split(/\s*[-–]\s*/);
    if (parts.length !== 2) {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: 'Format salah' };
    }

    const parse = (s: string) => {
      const m = s.match(/^(.*?)\s*:\s*(\d+)$/);
      return m ? { surah: m[1], ayah: parseInt(m[2]) } : null;
    };

    const start = parse(parts[0]);
    if (!start) return { valid: false, pages: 0, lines: 0, totalLines: 0 };

    let endSurah = start.surah;
    let endAyah = 0;

    if (/^\d+$/.test(parts[1])) {
      endAyah = parseInt(parts[1]);
    } else {
      const end = parse(parts[1]);
      if (!end) return { valid: false, pages: 0, lines: 0, totalLines: 0 };
      endSurah = end.surah;
      endAyah = end.ayah;
    }

    return this.calculateRange(start.surah, start.ayah, endSurah, endAyah);
  }
}
