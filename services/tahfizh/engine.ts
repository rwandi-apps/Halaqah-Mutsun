/**
 * SDQ QURAN CALCULATION ENGINE - FINAL PRODUCTION VERSION
 * Architecture: Senior System Architect Standard
 * 
 * Logic:
 * 1. Single Source of Truth: Uses QURAN_FULL_MAP for exact physical coordinates (Page, Line).
 * 2. Precision Calculation: Distance is derived STRICTLY from physical Mushaf location.
 * 3. Rules: 
 *    - 1 Page = 15 Lines.
 *    - AbsLine = ((Page - 1) * 15) + Line.
 *    - Distance = EndAbsLine - StartAbsLine + 1.
 * 4. Zero-Estimation: Proportional logic removed; missing data results in explicit failure.
 */

import { QURAN_METADATA } from './quranData';
import { QURAN_FULL_MAP } from './quranFullData';
import { QuranAyahData } from './types';

// ==========================================
// 1. INTERFACES
// ==========================================

export interface SDQCalculationResult {
  valid: boolean;
  pages: number;
  lines: number;
  totalLines: number;
  reason: string;
}

// ==========================================
// 2. ENGINE CLASS
// ==========================================

export class SDQQuranEngine {
  private static readonly LINES_PER_PAGE = 15;

  /**
   * Normalizes Surah names to match keys in QURAN_METADATA and QURAN_FULL_MAP
   * Removes extra spaces, handles case sensitivity, and standardizes apostrophes.
   */
  private static normalizeSurahName(name: string): string {
    if (!name) return "";
    const clean = name.toLowerCase().trim()
      .replace(/['`’‘]/g, "'")
      .replace(/\s+/g, " ")
      .replace(/[\-]/g, "-");

    const keys = Object.keys(QURAN_METADATA);
    
    // 1. Exact Match (Case Insensitive)
    const exact = keys.find(k => k.toLowerCase() === clean);
    if (exact) return exact;

    // 2. Fuzzy Match (stripping symbols)
    const fuzzyClean = clean.replace(/[^a-z0-9]/g, "");
    const fuzzy = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, "") === fuzzyClean);
    
    return fuzzy || "";
  }

  /**
   * Retrieve exact coordinates from the single source of truth (QURAN_FULL_MAP)
   * Returns null if not found.
   */
  private static getAyahData(surahRaw: string, ayahNum: number): QuranAyahData | null {
    const surahName = this.normalizeSurahName(surahRaw);
    if (!surahName) return null;

    // Construct key strictly as "SurahName:AyahNumber" to match QURAN_FULL_MAP keys
    const key = `${surahName}:${ayahNum}`;
    const data = QURAN_FULL_MAP[key];

    if (!data) {
      // Jika data fisik ayat tidak ditemukan, return null agar UI tahu data tidak valid
      return null; 
    }

    return data;
  }

  /**
   * CORE CALCULATION LOGIC
   * Uses physical page and line coordinates.
   * 1 Page = 15 Lines.
   */
  public static calculate(fs: string, fa: number, ts: string, ta: number): SDQCalculationResult {
    const start = this.getAyahData(fs, fa);
    const end = this.getAyahData(ts, ta);

    // VALIDATION: Coordinates Existence in Source of Truth
    if (!start) {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: `Ayat awal tidak ditemukan di database: ${fs}:${fa}` };
    }
    if (!end) {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, reason: `Ayat akhir tidak ditemukan di database: ${ts}:${ta}` };
    }

    // CALCULATION: Absolute Line Index (Mushaf Madinah)
    // Rumus: ((Halaman - 1) * 15) + Baris
    const startAbsLine = ((start.page - 1) * this.LINES_PER_PAGE) + start.line;
    const endAbsLine = ((end.page - 1) * this.LINES_PER_PAGE) + end.line;

    // Selisih inklusif
    const totalLines = endAbsLine - startAbsLine + 1;

    // VALIDATION: Order (Anti-Reverse)
    if (totalLines <= 0) {
      return { 
        valid: false, 
        pages: 0, 
        lines: 0, 
        totalLines: 0, 
        reason: `Range terbalik: ${fs}:${fa} (Hal ${start.page}) mendahului ${ts}:${ta} (Hal ${end.page})` 
      };
    }

    // Convert total lines back to Pages & Remainder Lines
    const pages = Math.floor(totalLines / this.LINES_PER_PAGE);
    const lines = totalLines % this.LINES_PER_PAGE;

    return {
      valid: true,
      totalLines,
      pages,
      lines,
      reason: ""
    };
  }

  /**
   * PUBLIC ENTRY POINT: PARSER
   * Handles formats: "Surah:Ayat - Surah:Ayat" or "Surah:Ayat - Ayat"
   */
  public static parseAndCalculate(rangeStr: string): SDQCalculationResult {
    const emptyResult: SDQCalculationResult = { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "" };

    if (!rangeStr || typeof rangeStr !== 'string' || rangeStr.trim() === "" || rangeStr === "-") {
      return { ...emptyResult, valid: true, reason: "Data kosong" }; // Valid true agar UI menampilkan 0 daripada error
    }

    try {
      const clean = rangeStr.trim();
      // Split separator " - " or " – "
      const parts = clean.split(/\s*[-–]\s*/);
      
      const parseRef = (s: string) => {
        const match = s.match(/^(.*?)\s*[:]\s*(\d+)$/);
        if (match) return { s: match[1].trim(), a: parseInt(match[2]) };
        return null;
      };

      const startObj = parseRef(parts[0]);
      if (!startObj) return { ...emptyResult, reason: "Format awal salah (Contoh: An-Naba:1)" };

      let endSurah = startObj.s;
      let endAyah = 0;

      if (!parts[1]) {
         // Jika format single "An-Naba:1", anggap start=end (1 baris capaian minimal jika valid)
         return this.calculate(startObj.s, startObj.a, startObj.s, startObj.a);
      }

      // Check for shorthand "Surah:Ayat - Ayat" (e.g. "An-Naba:1 - 40")
      if (/^\d+$/.test(parts[1].trim())) {
        endAyah = parseInt(parts[1].trim());
      } else {
        const endObj = parseRef(parts[1]);
        if (endObj) {
          endSurah = endObj.s;
          endAyah = endObj.a;
        } else {
          return { ...emptyResult, reason: "Format akhir salah" };
        }
      }

      return this.calculate(startObj.s, startObj.a, endSurah, endAyah);

    } catch (e) {
      return { ...emptyResult, reason: "Gagal memproses teks range" };
    }
  }
}

/**
 * BACKWARD COMPATIBILITY WRAPPERS
 * Used by UI components expecting simple objects.
 */
export const calculateHafalan = (fs: string, fa: number, ts: string, ta: number) => {
  const r = SDQQuranEngine.calculate(fs, fa, ts, ta);
  return { 
    pages: r.pages, 
    lines: r.lines, 
    valid: r.valid, 
    totalLines: r.totalLines 
  };
};

export const calculateFromRangeString = (range: string) => {
  const r = SDQQuranEngine.parseAndCalculate(range);
  return { 
    pages: r.pages, 
    lines: r.lines, 
    valid: r.valid, 
    totalLines: r.totalLines 
  };
};