import {
  AyahPointer,
  SDQCalculationResult,
  CalculationBreakdown,
  QuranAyahData
} from './types';
import { QURAN_FULL_MAP, IQRA_PAGES } from './quranFullData';
import { QURAN_METADATA } from './quranData';

export class TahfizhEngineSDQ {

  /** ===============================
   *  KONSTANTA RESMI SDQ
   *  =============================== */

  private static readonly LINES_PER_PAGE = 15;

  /**
   * Urutan resmi kurikulum SDQ (WAJIB)
   */
  private static readonly SDQ_JUZ_ORDER = [
    30, 29, 28, 27, 26,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25
  ];

  /** ===============================
   *  UTIL DASAR
   *  =============================== */

  private static normalizeName(name: string): string {
    return name
      .replace(/[’‘`]/g, "'")
      .replace(/Al\s+/gi, 'Al-')
      .trim();
  }

  private static isIqra(name: string): boolean {
    const n = name.toLowerCase();
    return n.includes('iqra') || n.includes('jilid');
  }

  private static getIqraJilid(name: string): number {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /** ===============================
   *  SDQ POSITION ENGINE (INTI)
   *  =============================== */

  private static getSDQJuzIndex(juz: number): number {
    const idx = this.SDQ_JUZ_ORDER.indexOf(juz);
    if (idx === -1) {
      throw new Error(`Juz ${juz} tidak terdaftar dalam kurikulum SDQ`);
    }
    return idx;
  }

  private static compareSDQPosition(a: QuranAyahData, b: QuranAyahData): number {
    const juzA = this.getSDQJuzIndex(a.juz);
    const juzB = this.getSDQJuzIndex(b.juz);

    if (juzA !== juzB) return juzA - juzB;
    if (a.page !== b.page) return a.page - b.page;
    return a.line - b.line;
  }

  /** ===============================
   *  MAPPING AYAT → POSISI MUSHAF
   *  =============================== */

  private static getAyahCoordinates(surah: string, ayah: number): QuranAyahData {
    const normalized = this.normalizeName(surah);
    const key = `${normalized}:${ayah}`;

    // Presisi utama
    if (QURAN_FULL_MAP[key]) return QURAN_FULL_MAP[key];

    // Fallback estimasi (aman)
    const meta = QURAN_METADATA[normalized];
    if (!meta) throw new Error(`Surah "${surah}" tidak ditemukan`);

    const totalPages = meta.endPage - meta.startPage + 1;
    const progress = Math.max(0, Math.min(1, (ayah - 1) / meta.totalAyah));

    const page = meta.startPage + Math.floor(progress * totalPages);
    const line = Math.min(
      15,
      Math.max(1, Math.floor((progress * totalPages % 1) * 15) + 1)
    );

    let juz = 1;
    if (page >= 2) juz = Math.min(30, Math.floor((page - 2) / 20) + 1);
    if (page >= 582) juz = 30;

    return { juz, page, line };
  }

  /** ===============================
   *  API UTAMA ENGINE
   *  =============================== */

  static calculateCapaian(
    start: AyahPointer,
    end: AyahPointer
  ): SDQCalculationResult {

    // Guard kosong / "-"
    if (!start?.surah || !end?.surah) {
      return {
        iqra: { totalHalaman: 0 },
        quran: { totalHalaman: 0, totalBaris: 0 },
        total: { halaman: 0, baris: 0 },
        breakdown: []
      };
    }

    const result: SDQCalculationResult = {
      iqra: { totalHalaman: 0 },
      quran: { totalHalaman: 0, totalBaris: 0 },
      total: { halaman: 0, baris: 0 },
      breakdown: []
    };

    const isStartIqra = this.isIqra(start.surah);
    const isEndIqra = this.isIqra(end.surah);

    /** ===============================
     *  IQRA
     *  =============================== */
    if (isStartIqra && isEndIqra) {
      const iqra = this.calculateIqra(
        this.getIqraJilid(start.surah), start.ayah,
        this.getIqraJilid(end.surah), end.ayah
      );

      result.iqra.totalHalaman = iqra.halaman;
      result.total.halaman = iqra.halaman;
      result.breakdown = iqra.breakdown;
      return result;
    }

    /** ===============================
     *  QURAN (SDQ-AWARE)
     *  =============================== */
    const p1 = this.getAyahCoordinates(start.surah, start.ayah);
    const p2 = this.getAyahCoordinates(end.surah, end.ayah);

    // VALIDASI SDQ (BUKAN MUSHAF)
    if (this.compareSDQPosition(p1, p2) > 0) {
      throw new Error(
        `Range tidak valid menurut kurikulum SDQ: ${start.surah}:${start.ayah} → ${end.surah}:${end.ayah}`
      );
    }

    const quran = this.calculateQuranRange(
      p1, p2,
      `${this.normalizeName(start.surah)}:${start.ayah}`,
      `${this.normalizeName(end.surah)}:${end.ayah}`
    );

    result.quran.totalHalaman = quran.halaman;
    result.quran.totalBaris = quran.totalBarisFull;
    result.total.halaman = quran.halaman;
    result.total.baris = quran.sisaBaris;
    result.breakdown = quran.breakdown;

    return result;
  }

  /** ===============================
   *  IQRA CALCULATION
   *  =============================== */

  private static calculateIqra(
    sJilid: number,
    sPage: number,
    eJilid: number,
    ePage: number
  ): { halaman: number; breakdown: CalculationBreakdown[] } {

    let total = 0;
    const breakdown: CalculationBreakdown[] = [];

    for (let j = sJilid; j <= eJilid; j++) {
      const maxPage = IQRA_PAGES[j] || 30;
      const from = j === sJilid ? sPage : 1;
      const to = j === eJilid ? ePage : maxPage;

      const count = Math.max(0, to - from + 1);
      total += count;

      breakdown.push({
        type: 'iqra',
        name: `Iqra ${j}`,
        from: `Hal ${from}`,
        to: `Hal ${to}`,
        halaman: count,
        baris: 0
      });
    }

    return { halaman: total, breakdown };
  }

  /** ===============================
   *  QURAN CALCULATION
   *  =============================== */

  private static calculateQuranRange(
    p1: QuranAyahData,
    p2: QuranAyahData,
    fromLabel: string,
    toLabel: string
  ): {
    halaman: number;
    sisaBaris: number;
    totalBarisFull: number;
    breakdown: CalculationBreakdown[];
  } {

    const totalBaris =
      ((p2.page - p1.page) * this.LINES_PER_PAGE) +
      (p2.line - p1.line + 1);

    const finalBaris = Math.max(0, totalBaris);
    const halaman = Math.floor(finalBaris / this.LINES_PER_PAGE);
    const sisaBaris = finalBaris % this.LINES_PER_PAGE;

    return {
      halaman,
      sisaBaris,
      totalBarisFull: finalBaris,
      breakdown: [{
        type: 'juz',
        name: p1.juz === p2.juz
          ? `Juz ${p1.juz}`
          : `Juz ${p1.juz} → ${p2.juz}`,
        from: fromLabel,
        to: toLabel,
        halaman,
        baris: sisaBaris
      }]
    };
  }
}
