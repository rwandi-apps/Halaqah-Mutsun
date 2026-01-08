import {
  AyahPointer,
  SDQCalculationResult,
  CalculationBreakdown
} from './types';

import {
  QURAN_FULL_MAP,
  JUZ_BOUNDARIES,
  IQRA_PAGES
} from './quranFullData';

export class TahfizhEngineSDQ {
  private static readonly LINES_PER_PAGE = 15;
  private static readonly PAGES_PER_JUZ = 20;

  /* =======================
     URUTAN KURIKULUM SDQ
  ======================= */
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
      .replace(/Al\s+/g, 'Al-')
      .trim();
  }

  private static isIqra(name: string): boolean {
    return /iqra|jilid/i.test(name);
  }

  private static getIqraJilid(name: string): number {
    const m = name.match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  }

  /* =======================
     KONVERSI BARIS (KUNCI)
  ======================= */
  private static juzToBaris(juz: number): number {
    return juz * this.PAGES_PER_JUZ * this.LINES_PER_PAGE;
  }

  private static halamanToBaris(hal: number): number {
    return hal * this.LINES_PER_PAGE;
  }

  static normalizeBaris(totalBaris: number) {
    const totalHalaman = Math.floor(totalBaris / 15);
    const baris = totalBaris % 15;

    const juz = Math.floor(totalHalaman / 20);
    const halaman = totalHalaman % 20;

    return { juz, halaman, baris };
  }

  /* =======================
     ENGINE UTAMA
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

    // A. IQRA → IQRA
    if (startIsIqra && endIsIqra) {
      const iqra = this.calculateIqra(
        this.getIqraJilid(start.surah), start.ayah,
        this.getIqraJilid(end.surah), end.ayah
      );
      result.iqra.totalHalaman = iqra.halaman;
      result.breakdown.push(...iqra.breakdown);
    }

    // B. IQRA → QURAN
    else if (startIsIqra && !endIsIqra) {
      const iqra = this.calculateIqra(
        this.getIqraJilid(start.surah), start.ayah,
        6, IQRA_PAGES[6]
      );
      result.iqra.totalHalaman = iqra.halaman;
      result.breakdown.push(...iqra.breakdown);

      const quran = this.calculateQuranRange(
        JUZ_BOUNDARIES[30].start,
        `${this.normalizeName(end.surah)}:${end.ayah}`
      );
      result.quran = quran;
      result.breakdown.push(...quran.breakdown);
    }

    // C. QURAN → QURAN
    else {
      const quran = this.calculateQuranRange(
        `${this.normalizeName(start.surah)}:${start.ayah}`,
        `${this.normalizeName(end.surah)}:${end.ayah}`
      );
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
  ) {
    let halaman = 0;
    const breakdown: CalculationBreakdown[] = [];

    for (let j = sJilid; j <= eJilid; j++) {
      const max = IQRA_PAGES[j];
      const from = j === sJilid ? sPage : 1;
      const to = j === eJilid ? ePage : max;
      const count = Math.max(0, to - from + 1);

      halaman += count;

      breakdown.push({
        type: 'iqra',
        name: `Iqra ${j}`,
        from: `Hal ${from}`,
        to: `Hal ${to}`,
        halaman: count,
        baris: 0
      });
    }

    return { halaman, breakdown };
  }

  /* =======================
     QURAN ENGINE
  ======================= */
  private static calculateQuranRange(startKey: string, endKey: string) {
    const start = QURAN_FULL_MAP[startKey];
    const end = QURAN_FULL_MAP[endKey];
    if (!start || !end) throw new Error('Data Quran tidak valid');

    let totalBaris = 0;
    const breakdown: CalculationBreakdown[] = [];

    const juzSeq = this.getJuzSequence(start.juz, end.juz);

    juzSeq.forEach((juz, idx) => {
      const sKey = idx === 0 ? startKey : JUZ_BOUNDARIES[juz].start;
      const eKey = idx === juzSeq.length - 1 ? endKey : JUZ_BOUNDARIES[juz].end;

      const a = QURAN_FULL_MAP[sKey];
      const b = QURAN_FULL_MAP[eKey];

      const baris = (b.page - a.page) * 15 + (b.line - a.line) + 1;
      totalBaris += baris;

      breakdown.push({
        type: 'juz',
        name: `Juz ${juz}`,
        from: sKey,
        to: eKey,
        halaman: Math.floor(baris / 15),
        baris: baris % 15
      });
    });

    return {
      totalHalaman: Math.floor(totalBaris / 15),
      totalBaris: totalBaris % 15,
      breakdown
    };
  }

  private static getJuzSequence(start: number, end: number): number[] {
    const s = this.SDQ_JUZ_ORDER.indexOf(start);
    const e = this.SDQ_JUZ_ORDER.indexOf(end);
    if (s === -1 || e === -1) return [start];
    return this.SDQ_JUZ_ORDER.slice(s, e + 1);
  }

  /* =======================
     AKUMULASI SALDO
  ======================= */
  static accumulateSaldo(
    saldoAwal: { juz: number; halaman: number; baris?: number },
    capaian: SDQCalculationResult
  ) {
    const saldoBaris =
      this.juzToBaris(saldoAwal.juz) +
      this.halamanToBaris(saldoAwal.halaman) +
      (saldoAwal.baris || 0);

    const capaianBaris =
      this.halamanToBaris(capaian.total.halaman) +
      capaian.total.baris;

    return this.normalizeBaris(saldoBaris + capaianBaris);
  }
}
