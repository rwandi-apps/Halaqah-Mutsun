
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

  /**
   * Menghitung capaian berdasarkan rentang input.
   * Input diasumsikan sudah tervalidasi urutannya oleh UI.
   */
  static calculateCapaian(start: AyahPointer, end: AyahPointer): SDQCalculationResult {
    const startKey = `${start.surahId}:${start.ayah}`;
    const endKey = `${end.surahId}:${end.ayah}`;

    const startData = QURAN_FULL_MAP[startKey];
    const endData = QURAN_FULL_MAP[endKey];

    if (!startData || !endData) {
      throw new Error("Data ayat tidak ditemukan dalam database koordinat.");
    }

    const result: SDQCalculationResult = {
      iqra: { totalHalaman: 0 },
      quran: { totalHalaman: 0, totalBaris: 0 },
      total: { halaman: 0, baris: 0 },
      breakdown: []
    };

    // Kasus 1: Dalam 1 Juz yang sama
    if (startData.juz === endData.juz) {
      const part = this.calculateSingleJuz(startData, endData, startKey, endKey);
      result.quran.totalHalaman = part.halaman;
      result.quran.totalBaris = part.baris;
      result.breakdown.push(part);
    } 
    // Kasus 2: Lintas Juz
    else {
      const juzSequence = this.getJuzSequence(startData.juz, endData.juz);
      
      juzSequence.forEach((juzNum, index) => {
        let currentStart: string;
        let currentEnd: string;

        if (index === 0) {
          // Bagian Awal: Input -> Akhir Juz
          currentStart = startKey;
          currentEnd = JUZ_BOUNDARIES[juzNum].end;
        } else if (index === juzSequence.length - 1) {
          // Bagian Akhir: Awal Juz -> Input
          currentStart = JUZ_BOUNDARIES[juzNum].start;
          currentEnd = endKey;
        } else {
          // Bagian Tengah: Full Juz
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

    // Finalisasi Total
    result.total.halaman = result.quran.totalHalaman;
    result.total.baris = result.quran.totalBaris;

    return result;
  }

  /**
   * Menghitung selisih fisik dalam 1 Juz sesuai rumus Mushaf Madinah 15 baris.
   */
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

  /**
   * Mendapatkan urutan Juz yang dilalui berdasarkan kurikulum SDQ.
   */
  private static getJuzSequence(startJuz: number, endJuz: number): number[] {
    const startIndex = this.SDQ_JUZ_ORDER.indexOf(startJuz);
    const endIndex = this.SDQ_JUZ_ORDER.indexOf(endJuz);

    if (startIndex === -1 || endIndex === -1) throw new Error("Juz tidak valid.");
    if (startIndex > endIndex) {
      // SDQ tidak mengizinkan lompatan urutan terbalik di engine (harus sudah urut dari UI)
      return [startJuz]; 
    }

    return this.SDQ_JUZ_ORDER.slice(startIndex, endIndex + 1);
  }
}
