import {
  AyahPointer,
  SDQCalculationResult,
  CalculationBreakdown,
  QuranAyahData
} from './types';
import { QURAN_FULL_MAP, JUZ_BOUNDARIES } from './quranFullData';

/**
 * =========================
 * KONFIGURASI IQRA
 * =========================
 */
const IQRA_PAGE_MAP: Record<number, number> = {
  1: 31,
  2: 30,
  3: 30,
  4: 30,
  5: 30,
  6: 31
};

export type TilawahInput =
  | {
      mode: 'QURAN';
      start: AyahPointer;
      end: AyahPointer;
    }
  | {
      mode: 'IQRA';
      startJilid: number;
      startHalaman: number;
      endJilid: number;
      endHalaman: number;
    };

export class TahfizhEngineSDQ {
  private static readonly LINES_PER_PAGE = 15;

  private static readonly SDQ_JUZ_ORDER = [
    30, 29, 28, 27, 26,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25
  ];

  /**
   * =========================
   * PUBLIC API
   * =========================
   */
  static calculateTilawah(input: TilawahInput): SDQCalculationResult {
    if (input.mode === 'IQRA') {
      return this.calculateIqra(input);
    }

    return this.calculateQuran(input.start, input.end);
  }

  /**
   * =========================
   * IQRA ENGINE
   * =========================
   */
  private static calculateIqra(input: {
    startJilid: number;
    startHalaman: number;
    endJilid: number;
    endHalaman: number;
  }): SDQCalculationResult {
    const {
      startJilid,
      startHalaman,
      endJilid,
      endHalaman
    } = input;

    let totalHalaman = 0;

    if (startJilid === endJilid) {
      totalHalaman = endHalaman - startHalaman + 1;
    } else {
      // halaman sisa di jilid awal
      totalHalaman +=
        IQRA_PAGE_MAP[startJilid] - startHalaman + 1;

      // jilid tengah (jika ada)
      for (let j = startJilid + 1; j < endJilid; j++) {
        totalHalaman += IQRA_PAGE_MAP[j];
      }

      // jilid akhir
      totalHalaman += endHalaman;
    }

    return {
      iqra: { totalHalaman },
      quran: { totalHalaman: 0, totalBaris: 0 },
      total: {
        halaman: totalHalaman,
        baris: 0
      },
      breakdown: [
        {
          type: 'iqra',
          name: 'IQRA',
          from: `Iqra ${startJilid}:${startHalaman}`,
          to: `Iqra ${endJilid}:${endHalaman}`,
          halaman: totalHalaman,
          baris: 0
        }
      ]
    };
  }

  /**
   * =========================
   * QURAN ENGINE
   * =========================
   */
  private static calculateQuran(
    start: AyahPointer,
    end: AyahPointer
  ): SDQCalculationResult {
    const startKey = this.createKey(start.surah, start.ayah);
    const endKey = this.createKey(end.surah, end.ayah);

    const startData = QURAN_FULL_MAP[startKey];
    const endData = QURAN_FULL_MAP[endKey];

    if (!startData || !endData) {
      throw new Error(`Data ayat tidak ditemukan`);
    }

    const result: SDQCalculationResult = {
      iqra: { totalHalaman: 0 },
      quran: { totalHalaman: 0, totalBaris: 0 },
      total: { halaman: 0, baris: 0 },
      breakdown: []
    };

    if (startData.juz === endData.juz) {
      const part = this.calculateSingleJuz(
        startData,
        endData,
        startKey,
        endKey
      );
      result.quran.totalHalaman += part.halaman;
      result.quran.totalBaris += part.baris;
      result.breakdown.push(part);
    } else {
      const juzSequence = this.getJuzSequence(
        startData.juz,
        endData.juz
      );

      juzSequence.forEach((juzNum, index) => {
        let currentStart: string;
        let currentEnd: string;

        if (index === 0) {
          currentStart = startKey;
          currentEnd = JUZ_BOUNDARIES[juzNum].end;
        } else if (index === juzSequence.length - 1) {
          currentStart = JUZ_BOUNDARIES[juzNum].start;
          currentEnd = endKey;
        } else {
          currentStart = JUZ_BOUNDARIES[juzNum].start;
          currentEnd = JUZ_BOUNDARIES[juzNum].end;
        }

        const part = this.calculateSingleJuz(
          QURAN_FULL_MAP[currentStart],
          QURAN_FULL_MAP[currentEnd],
          currentStart,
          currentEnd
        );

        result.quran.totalHalaman += part.halaman;
        result.quran.totalBaris += part.baris;
        result.breakdown.push(part);
      });
    }

    result.total.halaman = result.quran.totalHalaman;
    result.total.baris = result.quran.totalBaris;

    return result;
  }

  /**
   * =========================
   * UTILITIES
   * =========================
   */
  private static normalizeSurahName(name: string): string {
    return name
      .replace(/[’‘`]/g, "'")
      .replace(/Al\s+/g, 'Al-')
      .trim();
  }

  private static createKey(surah: string, ayah: number): string {
    return `${this.normalizeSurahName(surah)}:${ayah}`;
  }

  private static calculateSingleJuz(
    p1: QuranAyahData,
    p2: QuranAyahData,
    key1: string,
    key2: string
  ): CalculationBreakdown {
    let totalBaris = 0;
    let totalHalaman = 0;

    if (p1.page === p2.page) {
      totalBaris = p2.line - p1.line + 1;
    } else {
      const barisAwal = 15 - p1.line + 1;
      const barisTengah =
        (p2.page - p1.page - 1) * this.LINES_PER_PAGE;
      const barisAkhir = p2.line;

      totalBaris = barisAwal + barisTengah + barisAkhir;
      totalHalaman = p2.page - p1.page;
    }

    return {
      type: 'juz',
      name: `Juz ${p1.juz}`,
      from: key1,
      to: key2,
      halaman: totalHalaman,
      baris: totalBaris
    };
  }

  private static getJuzSequence(
    startJuz: number,
    endJuz: number
  ): number[] {
    const startIndex = this.SDQ_JUZ_ORDER.indexOf(startJuz);
    const endIndex = this.SDQ_JUZ_ORDER.indexOf(endJuz);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Juz tidak valid');
    }

    return this.SDQ_JUZ_ORDER.slice(startIndex, endIndex + 1);
  }
}
