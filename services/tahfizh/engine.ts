import {
  AyahPointer,
  SDQCalculationResult,
  CalculationBreakdown,
  QuranAyahData
} from './types';
import { QURAN_FULL_MAP, JUZ_BOUNDARIES, IQRA_PAGES } from './quranFullData';

export class TahfizhEngineSDQ {
  private static readonly LINES_PER_PAGE = 15;
 
  // Urutan resmi kurikulum SDQ
  private static readonly SDQ_JUZ_ORDER = [
    30, 29, 28, 27, 26,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25
  ];

  private static normalizeName(name: string): string {
    return name
      .replace(/[’‘`]/g, "'")
      .replace(/Al\s+/g, "Al-")
      .trim();
  }

  /**
   * Mendeteksi apakah input adalah Iqra
   */
  private static isIqra(name: string): boolean {
    const n = name.toLowerCase();
    return n.includes('iqra') || n.includes('jilid');
  }

  /**
   * Ekstrak nomor jilid dari string "Iqra 1"
   */
  private static getIqraJilid(name: string): number {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Main Engine Perhitungan Capaian
   */
  static calculateCapaian(start: AyahPointer, end: AyahPointer): SDQCalculationResult {
    const result: SDQCalculationResult = {
      iqra: { totalHalaman: 0 },
      quran: { totalHalaman: 0, totalBaris: 0 },
      total: { halaman: 0, baris: 0 },
      breakdown: []
    };

    const isStartIqra = this.isIqra(start.surah);
    const isEndIqra = this.isIqra(end.surah);

    // Kasus A: Murni Iqra
    if (isStartIqra && isEndIqra) {
      const iqraResult = this.calculateIqra(
        this.getIqraJilid(start.surah), start.ayah,
        this.getIqraJilid(end.surah), end.ayah
      );
      result.iqra.totalHalaman = iqraResult.halaman;
      result.breakdown = iqraResult.breakdown;
    }
    // Kasus B: Dari Iqra pindah ke Quran
    else if (isStartIqra && !isEndIqra) {
      // 1. Hitung sisa Iqra sampai Jilid 6 terakhir
      const iqraPart = this.calculateIqra(
        this.getIqraJilid(start.surah), start.ayah,
        6, IQRA_PAGES[6]
      );
      result.iqra.totalHalaman = iqraPart.halaman;
      result.breakdown.push(...iqraPart.breakdown);

      // 2. Hitung Quran dari awal Juz 30 ke target
      const quranStartKey = JUZ_BOUNDARIES[30].start;
      const quranEndKey = `${this.normalizeName(end.surah)}:${end.ayah}`;
 
      const quranPart = this.calculateQuranRange(quranStartKey, quranEndKey);
      result.quran = { totalHalaman: quranPart.halaman, totalBaris: quranPart.baris };
      result.breakdown.push(...quranPart.breakdown);
    }
    // Kasus C: Murni Quran
    else {
      const startKey = `${this.normalizeName(start.surah)}:${start.ayah}`;
      const endKey = `${this.normalizeName(end.surah)}:${end.ayah}`;
      const quranPart = this.calculateQuranRange(startKey, endKey);
      result.quran = { totalHalaman: quranPart.halaman, totalBaris: quranPart.baris };
      result.breakdown = quranPart.breakdown;
    }

    result.total.halaman = result.iqra.totalHalaman + result.quran.totalHalaman;
    result.total.baris = result.quran.totalBaris;

    return result;
  }

  /**
   * Logika Khusus Iqra (Hanya Halaman)
   */
  private static calculateIqra(sJilid: number, sPage: number, eJilid: number, ePage: number): { halaman: number, breakdown: CalculationBreakdown[] } {
    let totalHalaman = 0;
    const breakdown: CalculationBreakdown[] = [];

    for (let j = sJilid; j <= eJilid; j++) {
      const maxPage = IQRA_PAGES[j] || 30;
      const from = (j === sJilid) ? sPage : 1;
      const to = (j === eJilid) ? ePage : maxPage;
      const count = to - from + 1;

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

  /**
   * Logika Quran (Halaman + Baris)
   */
  private static calculateQuranRange(startKey: string, endKey: string): { halaman: number, baris: number, breakdown: CalculationBreakdown[] } {
    const startData = QURAN_FULL_MAP[startKey];
    const endData = QURAN_FULL_MAP[endKey];

    if (!startData || !endData) throw new Error("Data Quran tidak valid");

    let totalHalaman = 0;
    let totalBaris = 0;
    const breakdown: CalculationBreakdown[] = [];

    const juzSequence = this.getJuzSequence(startData.juz, endData.juz);
 
    juzSequence.forEach((juzNum, index) => {
      let curStart: string, curEnd: string;

      if (index === 0) { curStart = startKey; curEnd = (juzSequence.length === 1) ? endKey : JUZ_BOUNDARIES[juzNum].end; }
      else if (index === juzSequence.length - 1) { curStart = JUZ_BOUNDARIES[juzNum].start; curEnd = endKey; }
      else { curStart = JUZ_BOUNDARIES[juzNum].start; curEnd = JUZ_BOUNDARIES[juzNum].end; }

      const p1 = QURAN_FULL_MAP[curStart];
      const p2 = QURAN_FULL_MAP[curEnd];

      let h = 0, b = 0;
      if (p1.page === p2.page) {
        b = p2.line - p1.line + 1;
      } else {
        b = (15 - p1.line + 1) + ((p2.page - p1.page - 1) * 15) + p2.line;
        h = p2.page - p1.page;
      }

      totalHalaman += h;
      totalBaris += b;
      breakdown.push({ type: 'juz', name: `Juz ${juzNum}`, from: curStart, to: curEnd, halaman: h, baris: b });
    });

    return { halaman: totalHalaman, baris: totalBaris, breakdown };
  }

  private static getJuzSequence(startJuz: number, endJuz: number): number[] {
    const startIndex = this.SDQ_JUZ_ORDER.indexOf(startJuz);
    const endIndex = this.SDQ_JUZ_ORDER.indexOf(endJuz);
    if (startIndex === -1 || endIndex === -1) return [startJuz];
    return this.SDQ_JUZ_ORDER.slice(startIndex, endIndex + 1);
  }
}
