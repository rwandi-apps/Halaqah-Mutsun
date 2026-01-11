import { QuranAyahData } from './types';
import { QURAN_FULL_MAP } from './quranFullData';
import { QURAN_METADATA } from './quranData';

// 1. Tipe Data Strict untuk Firebase (Mencegah Error Undefined)
export interface SafeCalculationResult {
  valid: boolean;
  pages: number;
  lines: number;
  totalLines: number;
  reason: string | null; // Selalu string atau null
}

// 2. Konfigurasi Dasar Kurikulum SDQ
const LINES_PER_PAGE = 15;
const SDQ_JUZ_ORDER = [
  30, 29, 28, 27, 26, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25
];

const JUZ_PAGE_LIMITS: Record<number, { start: number; end: number }> = {
  1: { start: 1, end: 21 }, 2: { start: 22, end: 41 }, 3: { start: 42, end: 61 },
  4: { start: 62, end: 81 }, 5: { start: 82, end: 101 }, 6: { start: 102, end: 121 },
  7: { start: 122, end: 141 }, 8: { start: 142, end: 161 }, 9: { start: 162, end: 181 },
  10: { start: 182, end: 201 }, 11: { start: 202, end: 221 }, 12: { start: 222, end: 241 },
  13: { start: 242, end: 261 }, 14: { start: 262, end: 281 }, 15: { start: 282, end: 301 },
  16: { start: 302, end: 321 }, 17: { start: 322, end: 341 }, 18: { start: 342, end: 361 },
  19: { start: 362, end: 381 }, 20: { start: 382, end: 401 }, 21: { start: 402, end: 421 },
  22: { start: 422, end: 441 }, 23: { start: 442, end: 461 }, 24: { start: 462, end: 481 },
  25: { start: 482, end: 501 }, 26: { start: 502, end: 521 }, 27: { start: 522, end: 541 },
  28: { start: 542, end: 561 }, 29: { start: 562, end: 581 }, 30: { start: 582, end: 604 }
};

const SDQ_INDEX_MAP: Record<number, number> = {};
const SDQ_JUZ_START_OFFSET: Record<number, number> = {};

// Inisialisasi Offset Baris Global berdasarkan Urutan SDQ
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

export class TahfizhEngineSDQ {
  
  /**
   * Normalisasi Nama Surah (Case Insensitive & Typos)
   */
  private static normalizeSurah(input: string): string {
    if (!input) return "";
    let n = input.toLowerCase().trim().replace(/['`’‘]/g, "'").replace(/-/g, " ");
    n = n.replace(/\bal\s+/g, "al-");
    const map: Record<string, string> = { 
      "ali imran": "Ali 'Imran", 
      "al imran": "Ali 'Imran",
      "amma": "An-Naba'", 
      "yasin": "Ya-Sin",
      "al lahab": "Al-Lahab",
      "al masad": "Al-Lahab"
    };
    return map[n] || n.replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Ambil Koordinat (Juz, Halaman, Baris)
   */
  private static getCoordinates(surahRaw: string, ayah: number): QuranAyahData | null {
    const s = this.normalizeSurah(surahRaw);
    const metaKey = Object.keys(QURAN_METADATA).find(k => this.normalizeSurah(k) === s);
    if (!metaKey) return null;
    
    const meta = QURAN_METADATA[metaKey];
    if (ayah < 1 || ayah > meta.totalAyah) return null;
    
    const key = `${metaKey}:${ayah}`;
    if (QURAN_FULL_MAP[key]) return QURAN_FULL_MAP[key];
    
    // Fallback estimasi jika data map belum lengkap
    const totalPages = meta.endPage - meta.startPage + 1;
    const estPage = Math.min(meta.endPage, meta.startPage + Math.floor(((ayah - 1) / meta.totalAyah) * totalPages));
    let estJuz = 30;
    for (const [j, l] of Object.entries(JUZ_PAGE_LIMITS)) {
      if (estPage >= l.start && estPage <= l.end) { estJuz = parseInt(j); break; }
    }
    return { juz: estJuz, page: estPage, line: 1 };
  }

  /**
   * Hitung Posisi Baris Absolut dalam Kurikulum SDQ
   */
  private static getGlobalSDQLine(coord: QuranAyahData): number {
    const juzOffset = SDQ_JUZ_START_OFFSET[coord.juz] ?? 0;
    const juzStartPage = JUZ_PAGE_LIMITS[coord.juz]?.start ?? 1;
    return juzOffset + ((coord.page - juzStartPage) * LINES_PER_PAGE) + coord.line;
  }

  /**
   * Core: Hitung Volume Hafalan (Halaman & Baris)
   */
  public static calculateRange(startS: string, startA: number, endS: string, endA: number): SafeCalculationResult {
    const fail = (msg: string) => ({ 
      valid: false, pages: 0, lines: 0, totalLines: 0, reason: msg 
    });

    try {
      const sCoord = this.getCoordinates(startS, startA);
      const eCoord = this.getCoordinates(endS, endA);
      
      if (!sCoord || !eCoord) return fail("Surah/Ayat tidak ditemukan dalam database");
      
      // Validasi arah SDQ (30 -> 1 -> 25)
      if (SDQ_INDEX_MAP[eCoord.juz] < SDQ_INDEX_MAP[sCoord.juz]) {
        return fail("Mundur Kurikulum (Urutan Juz Terbalik)");
      }

      const absS = this.getGlobalSDQLine(sCoord);
      const absE = this.getGlobalSDQLine(eCoord);
      
      if (absE < absS) return fail("Ayat terbalik (Akhir < Awal)");

      const total = absE - absS + 1;
      return { 
        valid: true, 
        pages: Math.floor(total / LINES_PER_PAGE), 
        lines: total % LINES_PER_PAGE, 
        totalLines: total, 
        reason: null // Jaminan untuk Firestore
      };
    } catch { return fail("Terjadi kesalahan internal perhitungan"); }
  }

  /**
   * Parser String Input Flexible (Contoh: "Al-Mulk: 1 - 10")
   */
  public static parseAndCalculate(str: string): SafeCalculationResult {
    const fail = (msg: string) => ({ valid: false, pages: 0, lines: 0, totalLines: 0, reason: msg });

    if (!str || str.trim() === '-' || str.trim() === '') {
      return { valid: true, pages: 0, lines: 0, totalLines: 0, reason: null };
    }

    try {
      const parts = str.split(/\s*[-–]\s*/);
      if (parts.length < 2) return fail("Format harus 'Surah:Ayat - Surah:Ayat'");
      
      const parse = (s: string) => {
        const m = s.match(/^(.*?)[\s:]+(\d+)$/);
        return m ? { s: m[1].trim(), a: parseInt(m[2]) } : null;
      };

      const start = parse(parts[0]);
      if (!start) return fail("Format awal salah (Cth: Al-Fatihah:1)");
      
      let endS = start.s, endA = 0;
      if (/^\d+$/.test(parts[1].trim())) { 
        endA = parseInt(parts[1].trim()); 
      } else { 
        const end = parse(parts[1]); 
        if (!end) return fail("Format akhir salah"); 
        endS = end.s; 
        endA = end.a; 
      }
      return this.calculateRange(start.s, start.a, endS, endA);
    } catch { return fail("Gagal memproses teks input"); }
  }
}

/**
 * AUTO-MAPPER: Sinkronisasi ke Kolom Akumulasi di UI
 */
export const syncToAkumulasi = (engineResult: SafeCalculationResult) => {
  return {
    juz: engineResult.pages >= 20 ? Math.floor(engineResult.pages / 20) : 0,
    hal: engineResult.pages || 0,
    baris: engineResult.lines || 0
  };
};
