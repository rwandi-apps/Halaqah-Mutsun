import { 
  AyahPointer, 
  SDQCalculationResult, 
  CalculationBreakdown, 
  QuranAyahData 
} from './types';

import { 
  QURAN_FULL_MAP, 
  JUZ_BOUNDARIES, 
  IQRA_PAGES 
} from './quranFullData';

export class TahfizhEngineSDQ {
  private static readonly LINES_PER_PAGE = 15;

  /**
   * Urutan resmi kurikulum SDQ
   */
  private static readonly SDQ_JUZ_ORDER = [
    30, 29, 28, 27, 26,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25
  ];

  /* =======================
     UTIL DASAR
  ======================= */

  private static normalizeName(name: string): string {
    return name
      .replace(/[’‘`]/g, "'")
      .replace(/Al\s+/g, "Al-")
      .trim();
  }

  private static isIqra(name: string): boolean {
    const n = name.toLowerCase();
    return n.includes('iqra') || n.includes('jilid');
  }

  private static getIqraJilid(name: string): number {
    const m = name.match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  }

  /* =======================
     MAIN ENGINE
  ======================= */

  static calculateCapaian(
    start: AyahPointer,
    end: AyahPointer
  ): SDQCalculationResult {

    const result: SDQCalculationResult = {
      iqra: { totalHalaman: 0 },
      quran: { totalHalaman: 0, totalBaris: 0 },
      total: { halaman: 0, baris: 0 },
      breakdown: []
    };

    const startIsIqra = this.isIqra(start.surah);
    const endIsIqra = this.isIqra(end.surah);

    /* ===== A. MURNI IQRA ===== */
    if (startIsIqra && endIsIqra) {
      const iqra = this.calculateIqra(
        this.getIqraJilid(start.surah), start.ayah,
        this.getIqraJilid(end.surah), end.ayah
      );
      result.iqra.totalHalaman = iqra.halaman;
      result.breakdown.push(...iqra.breakdown);
    }

    /* ===== B. IQRA → QURAN ===== */
    else if (startIsIqra && !endIsIqra) {
      // 1. Iqra sampai selesai
      const iqra = this.calculateIqra(
        this.getIqraJilid(start.surah), start.ayah,
        6, IQRA_PAGES[6]
      );
      result.iqra.totalHalaman = iqra.halaman;
      result.breakdown.push(...iqra.breakdown);

      // 2. Quran mulai Juz 30
      const qStart = JUZ_BOUNDARIES[30].start;
      const qEnd = `${this.normalizeName(end.surah)}:${end.ayah}`;

      const quran = this.calculateQuranRange(qStart, qEnd);
      result.quran = quran;
      result.breakdown.push(...quran.breakdown);
    }

    /* ===== C. MURNI QURAN ===== */
    else {
      const qStart = `${this.normalizeName(start.surah)}:${start.ayah}`;
      const qEnd = `${this.normalizeName(end.surah)}:${end.ayah}`;

      const quran = this.calculateQuranRange(qStart, qEnd);
      result.quran = quran;
      result.breakdown.push(...quran.breakdown);
    }

    result.total.halaman =
      result.iqra.totalHalaman + result.quran.totalHalaman;

    result.total.baris = result.quran.totalBaris;

    return result;
  }

  /* =======================
     IQRA ENGINE
  ======================= */

  private static calculateIqra(
    sJilid: number,
    sPage: number,
    eJilid: number,
    ePage: number
  ): { halaman: number; breakdown: CalculationBreakdown[] } {

    let totalHalaman = 0;
    const breakdown: CalculationBreakdown[] = [];

    for (let j = sJilid; j <= eJilid; j++) {
      const maxPage = IQRA_PAGES[j];
      const from = (j === sJilid) ? sPage : 1;
      const to = (j === eJilid) ? ePage : maxPage;
      const count = Math.max(0, to - from + 1);

      totalHalaman += count;

      breakdown.push({
        type: 'iqra',
        name: `Iqra ${j}`,
        from: `Hal ${from}`,
        to: `Hal ${to}`,
        halaman: count,
        baris: 0
      });
    }

    return { halaman: totalHalaman, breakdown };
  }

  /* =======================
     QURAN ENGINE (SDQ MODE)
  ======================= */

  private static calculateQuranRange(
    startKey: string,
    endKey: string
  ): { totalHalaman: number; totalBaris: number; breakdown: CalculationBreakdown[] } {

    const start = QURAN_FULL_MAP[startKey];
    const end = QURAN_FULL_MAP[endKey];

    if (!start || !end) {
      throw new Error('Data Quran tidak ditemukan');
    }

    let totalHalaman = 0;
    let totalBaris = 0;
    const breakdown: CalculationBreakdown[] = [];

    const juzSeq = this.getJuzSequence(start.juz, end.juz);

    juzSeq.forEach((juz, idx) => {
      let fromKey: string;
      let toKey: string;

      if (idx === 0 && idx === juzSeq.length - 1) {
        fromKey = startKey;
        toKey = endKey;
      } else if (idx === 0) {
        fromKey = startKey;
        toKey = JUZ_BOUNDARIES[juz].end;
      } else if (idx === juzSeq.length - 1) {
        fromKey = JUZ_BOUNDARIES[juz].start;
        toKey = endKey;
      } else {
        fromKey = JUZ_BOUNDARIES[juz].start;
        toKey = JUZ_BOUNDARIES[juz].end;
      }

      const p1 = QURAN_FULL_MAP[fromKey];
      const p2 = QURAN_FULL_MAP[toKey];

      const halaman = Math.max(0, p2.page - p1.page);

      // 🔑 SDQ RULE:
      // Baris = posisi ayat terakhir di halaman terakhir
      const baris =
        halaman === 0
          ? Math.max(0, p2.line - p1.line + 1)
          : p2.line;

      totalHalaman += halaman;
      totalBaris = baris; // overwrite → sisa halaman terakhir

      breakdown.push({
        type: 'juz',
        name: `Juz ${juz}`,
        from: fromKey,
        to: toKey,
        halaman,
        baris
      });
    });

    return { totalHalaman, totalBaris, breakdown };
  }

  private static getJuzSequence(startJuz: number, endJuz: number): number[] {
    const s = this.SDQ_JUZ_ORDER.indexOf(startJuz);
    const e = this.SDQ_JUZ_ORDER.indexOf(endJuz);
    if (s === -1 || e === -1) return [startJuz];
    return this.SDQ_JUZ_ORDER.slice(s, e + 1);
  }
}
