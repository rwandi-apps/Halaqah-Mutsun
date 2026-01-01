
import { 
  AyahPointer, 
  SDQCalculationResult, 
  CalculationBreakdown, 
  QuranAyahData 
} from './types';
import { QURAN_FULL_MAP, JUZ_BOUNDARIES } from './quranFullData';

export class TahfizhEngineSDQ {
  private static readonly LINES_PER_PAGE = 15;
  
  private static readonly SDQ_JUZ_ORDER = [
    30, 29, 28, 27, 26, 
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
    21, 22, 23, 24, 25
  ];

  /**
   * Menghapus karakter non-standar dan menyamakan format nama surah
   */
  private static normalizeSurahName(name: string): string {
    return name
      .replace(/[’‘`]/g, "'") // Normalisasi tanda kutip
      .replace(/Al\s+/g, "Al-") // Pastikan format Al-
      .trim();
  }

  private static createKey(surah: string, ayah: number): string {
    return `${this.normalizeSurahName(surah)}:${ayah}`;
  }

  static calculateCapaian(start: AyahPointer, end: AyahPointer): SDQCalculationResult {
    const startKey = this.createKey(start.surah, start.ayah);
    const endKey = this.createKey(end.surah, end.ayah);

    const startData = QURAN_FULL_MAP[startKey];
    const endData = QURAN_FULL_MAP[endKey];

    if (!startData || !endData) {
      throw new Error(`Data ayat tidak ditemukan: ${!startData ? startKey : endKey}`);
    }

    const result: SDQCalculationResult = {
      iqra: { totalHalaman: 0 },
      quran: { totalHalaman: 0, totalBaris: 0 },
      total: { halaman: 0, baris: 0 },
      breakdown: []
    };

    if (startData.juz === endData.juz) {
      const part = this.calculateSingleJuz(startData, endData, startKey, endKey);
      result.quran.totalHalaman = part.halaman;
      result.quran.totalBaris = part.baris;
      result.breakdown.push(part);
    } else {
      const juzSequence = this.getJuzSequence(startData.juz, endData.juz);
      
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
      totalHalaman = 0;
    } else {
      const barisAwal = 15 - p1.line + 1;
      const barisTengah = (p2.page - p1.page - 1) * this.LINES_PER_PAGE;
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

  private static getJuzSequence(startJuz: number, endJuz: number): number[] {
    const startIndex = this.SDQ_JUZ_ORDER.indexOf(startJuz);
    const endIndex = this.SDQ_JUZ_ORDER.indexOf(endJuz);

    if (startIndex === -1 || endIndex === -1) throw new Error("Juz tidak valid.");
    return this.SDQ_JUZ_ORDER.slice(startIndex, endIndex + 1);
  }
}
