
import { QURAN_METADATA } from './quranData';
import { QURAN_FULL_MAP } from './quranFullData';
import { QuranAyahData } from './types';

export interface SDQCalculationResult {
  valid: boolean;
  pages: number;
  lines: number;
  totalLines: number;
  isIqra: boolean;
  reason: string;
}

export class SDQQuranEngine {
  private static readonly LINES_PER_PAGE = 15;

  private static normalizeSurahName(name: string): string {
    if (!name) return "";
    const clean = name.toLowerCase().trim()
      .replace(/['`’‘]/g, "'")
      .replace(/\s+/g, " ");

    if (clean.includes("iqra")) return "Iqra";

    const keys = Object.keys(QURAN_METADATA);
    const exact = keys.find(k => k.toLowerCase() === clean);
    if (exact) return exact;

    const fuzzyClean = clean.replace(/[^a-z0-9]/g, "");
    const fuzzy = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, "") === fuzzyClean);
    
    return fuzzy || "";
  }

  private static getAyahData(surahRaw: string, ayahNum: number): QuranAyahData | null {
    const surahName = this.normalizeSurahName(surahRaw);
    if (!surahName || surahName === "Iqra") return null;

    const key = `${surahName}:${ayahNum}`;
    const physicalData = QURAN_FULL_MAP[key];

    if (physicalData) return physicalData;

    // Fallback: Estimasi berdasarkan Metadata Surah jika data per ayat tidak ada
    const meta = QURAN_METADATA[surahName];
    if (meta) {
      const totalPages = meta.endPage - meta.startPage + 1;
      const progress = ayahNum / meta.totalAyah;
      const estimatedPage = meta.startPage + Math.floor(progress * (totalPages - 1));
      const estimatedLine = Math.floor((progress * (totalPages - 1) % 1) * this.LINES_PER_PAGE) + 1;
      
      return {
        juz: 0, // Not needed for distance
        page: estimatedPage,
        line: Math.min(15, Math.max(1, estimatedLine)),
        globalIndex: 0
      };
    }

    return null;
  }

  public static calculate(fs: string, fa: number, ts: string, ta: number): SDQCalculationResult {
    const isIqra = fs.toLowerCase().includes("iqra") || ts.toLowerCase().includes("iqra");

    if (isIqra) {
      // Logic Iqra: fa dan ta dianggap nomor halaman
      // Format input: "Iqra 5" di fs, "1" di fa
      const jStart = parseInt(fs.match(/\d+/)?.[0] || "1");
      const jEnd = parseInt(ts.match(/\d+/)?.[0] || jStart.toString());
      
      let totalHal = 0;
      if (jStart === jEnd) {
        totalHal = ta - fa + 1;
      } else {
        // Estimasi sederhana antar jilid (asumsi 30 hal per jilid)
        totalHal = ((jEnd - jStart) * 30) + ta - fa;
      }

      return {
        valid: true,
        pages: Math.max(0, totalHal),
        lines: 0,
        totalLines: 0,
        isIqra: true,
        reason: ""
      };
    }

    const start = this.getAyahData(fs, fa);
    const end = this.getAyahData(ts, ta);

    if (!start || !end) {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, isIqra: false, reason: "Surat tidak dikenali" };
    }

    const startAbsLine = ((start.page - 1) * this.LINES_PER_PAGE) + start.line;
    const endAbsLine = ((end.page - 1) * this.LINES_PER_PAGE) + end.line;
    const totalLines = endAbsLine - startAbsLine + 1;

    if (totalLines < 0) return { valid: false, pages: 0, lines: 0, totalLines: 0, isIqra: false, reason: "Range terbalik" };

    return {
      valid: true,
      totalLines,
      pages: Math.floor(totalLines / this.LINES_PER_PAGE),
      lines: totalLines % this.LINES_PER_PAGE,
      isIqra: false,
      reason: ""
    };
  }

  public static parseAndCalculate(rangeStr: string): SDQCalculationResult {
    const empty: SDQCalculationResult = { valid: false, pages: 0, lines: 0, totalLines: 0, isIqra: false, reason: "" };
    if (!rangeStr || rangeStr === "-" || rangeStr === "Belum Ada") return { ...empty, valid: true };

    try {
      const parts = rangeStr.split(/\s*[-–]\s*/);
      const parse = (s: string) => {
        const m = s.match(/^(.*?)\s*[:]\s*(\d+)$/);
        if (m) return { s: m[1].trim(), a: parseInt(m[2]) };
        return null;
      };

      const start = parse(parts[0]);
      if (!start) return empty;

      let endSurah = start.s;
      let endAyah = start.a;

      if (parts[1]) {
        if (/^\d+$/.test(parts[1].trim())) {
          endAyah = parseInt(parts[1].trim());
        } else {
          const end = parse(parts[1]);
          if (end) {
            endSurah = end.s;
            endAyah = end.a;
          }
        }
      }

      return this.calculate(start.s, start.a, endSurah, endAyah);
    } catch (e) {
      return empty;
    }
  }
}
