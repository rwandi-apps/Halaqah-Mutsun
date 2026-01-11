import { QuranAyahData } from './types';
import { QURAN_FULL_MAP } from './quranFullData';
import { QURAN_METADATA } from './quranData';

/* =====================================================
 *  ENGINE FINAL SDQ – PRODUCTION READY
 * ===================================================== */

export interface CalculationResult {
  valid: boolean;
  pages: number;
  lines: number;
  totalLines: number;
  reason?: string;
}

/* ===============================
 *  KONFIGURASI SDQ
 * =============================== */

// Urutan resmi kurikulum SDQ
const SDQ_JUZ_ORDER = [
  30, 29, 28, 27, 26,
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25
];

// Map Juz → Index SDQ
const SDQ_INDEX: Record<number, number> = {};
SDQ_JUZ_ORDER.forEach((j, i) => SDQ_INDEX[j] = i);

// Mushaf Madinah
const LINES_PER_PAGE = 15;

// Batas halaman fisik per juz (WAJIB BENAR)
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

export class TahfizhEngineSDQ {

  /* ===============================
   *  NORMALISASI SURAH
   * =============================== */
  private static normalizeSurah(name: string): string {
    if (!name) return '';
    let n = name.toLowerCase().trim();
    n = n.replace(/['’`]/g, "'");
    n = n.replace(/\bal\s+/g, 'al-');

    const map: Record<string, string> = {
      'ali imran': "Ali 'Imran",
      'al-imran': "Ali 'Imran",
      'yasin': 'Ya-Sin',
      'ya sin': 'Ya-Sin',
      'an naba': "An-Naba'",
      'amma': "An-Naba'",
    };

    if (map[n]) return map[n];
    return n.replace(/\b\w/g, c => c.toUpperCase());
  }

  /* ===============================
   *  AMBIL KOORDINAT AYAT
   * =============================== */
  private static getCoord(surahRaw: string, ayah: number): QuranAyahData | null {
    const surah = this.normalizeSurah(surahRaw);
    const metaKey = Object.keys(QURAN_METADATA)
      .find(k => this.normalizeSurah(k) === surah);

    if (!metaKey) return null;

    const meta = QURAN_METADATA[metaKey];
    if (ayah < 1 || ayah > meta.totalAyah) return null;

    const exactKey = `${metaKey}:${ayah}`;
    if (QURAN_FULL_MAP[exactKey]) {
      return QURAN_FULL_MAP[exactKey];
    }

    // fallback AMAN (tidak undefined)
    return {
      juz: meta.juz,
      page: meta.startPage,
      line: 1
    };
  }

  /* ===============================
   *  ABSOLUTE LINE DALAM JUZ
   * =============================== */
  private static absLineInJuz(juz: number, page: number, line: number): number {
    const startPage = JUZ_PAGE_LIMITS[juz].start;
    return ((page - startPage) * LINES_PER_PAGE) + line;
  }

  private static totalLinesInJuz(juz: number): number {
    const l = JUZ_PAGE_LIMITS[juz];
    return (l.end - l.start + 1) * LINES_PER_PAGE;
  }

  /* ===============================
   *  CORE ENGINE
   * =============================== */
  public static calculate(
    startSurah: string,
    startAyah: number,
    endSurah: string,
    endAyah: number
  ): CalculationResult {

    const start = this.getCoord(startSurah, startAyah);
    const end = this.getCoord(endSurah, endAyah);

    if (!start || !end) {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: 'Ayat tidak ditemukan' };
    }

    const sIdx = SDQ_INDEX[start.juz];
    const eIdx = SDQ_INDEX[end.juz];

    if (eIdx < sIdx) {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: 'Mundur kurikulum SDQ' };
    }

    let totalLines = 0;

    // === JUZ SAMA ===
    if (start.juz === end.juz) {
      const a = this.absLineInJuz(start.juz, start.page, start.line);
      const b = this.absLineInJuz(end.juz, end.page, end.line);
      if (b < a) {
        return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: 'Ayat terbalik' };
      }
      totalLines = b - a + 1;
    }

    // === LINTAS JUZ ===
    else {
      const startUsed =
        this.totalLinesInJuz(start.juz) -
        this.absLineInJuz(start.juz, start.page, start.line) + 1;

      const endUsed =
        this.absLineInJuz(end.juz, end.page, end.line);

      let middle = 0;
      for (let i = sIdx + 1; i < eIdx; i++) {
        middle += this.totalLinesInJuz(SDQ_JUZ_ORDER[i]);
      }

      totalLines = startUsed + middle + endUsed;
    }

    if (totalLines <= 0) {
      return { valid: true, pages: 0, lines: 0, totalLines: 0 };
    }

    return {
      valid: true,
      pages: Math.floor(totalLines / LINES_PER_PAGE),
      lines: totalLines % LINES_PER_PAGE,
      totalLines
    };
  }

  /* ===============================
   *  PARSER INPUT UI
   * =============================== */
  public static parse(input: string): CalculationResult {
    if (!input || input.trim() === '-' || input.trim() === '') {
      return { valid: true, pages: 0, lines: 0, totalLines: 0 };
    }

    const parts = input.split(/\s*-\s*/);
    if (parts.length !== 2) {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: 'Format salah' };
    }

    const parse = (s: string) => {
      const m = s.match(/^(.*?)\s*:\s*(\d+)$/);
      return m ? { surah: m[1], ayah: Number(m[2]) } : null;
    };

    const a = parse(parts[0]);
    if (!a) return { valid: false, pages: 0, lines: 0, totalLines: 0 };

    let b = parse(parts[1]);
    if (!b && /^\d+$/.test(parts[1])) {
      b = { surah: a.surah, ayah: Number(parts[1]) };
    }

    if (!b) return { valid: false, pages: 0, lines: 0, totalLines: 0 };

    return this.calculate(a.surah, a.ayah, b.surah, b.ayah);
  }
  // Alias untuk backward compatibility
public static parseAndCalculate(input: string): CalculationResult {
  return this.parse(input);
}

}
