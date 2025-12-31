
import { AyahPointer, CalculationResult } from './types';
import { QURAN_FULL_MAP } from './quranFullData';

export class TahfizhEngine {
  private static readonly LINES_PER_PAGE = 15;

  /**
   * Menghitung capaian (Halaman & Baris) secara 100% akurat menggunakan pemetaan koordinat.
   */
  static calculateRange(start: AyahPointer, end: AyahPointer): CalculationResult {
    const sKey = `${this.normalizeSurahName(start.surah)}:${start.ayah}`;
    const eKey = `${this.normalizeSurahName(end.surah)}:${end.ayah}`;

    let startData = QURAN_FULL_MAP[sKey];
    let endData = QURAN_FULL_MAP[eKey];

    if (!startData || !endData) {
      return { 
        pages: 0, 
        lines: 0, 
        juz: 0, 
        isPartial: true, 
        error: `Koordinat tidak ditemukan untuk: ${!startData ? sKey : eKey}` 
      };
    }

    // Pastikan urutan selalu dari globalIndex terkecil ke terbesar
    if (startData.globalIndex > endData.globalIndex) {
      const temp = startData;
      startData = endData;
      endData = temp;
    }

    /**
     * KALKULASI BARIS TOTAL:
     * (Selisih Halaman * 15) + Selisih Baris + 1
     */
    const totalLines = (endData.page - startData.page) * this.LINES_PER_PAGE + (endData.line - startData.line) + 1;

    /**
     * KALKULASI HALAMAN TERSENTUH (Touched Pages):
     * Halaman Akhir - Halaman Awal + 1
     */
    const touchedPages = endData.page - startData.page + 1;

    // Sesuai aturan SDQ:
    // Pages = Total Baris / 15 (Halaman Penuh hasil konversi baris)
    // Lines = Sisa Baris (0-14)
    // Namun untuk UI biasanya lebih akurat menggunakan Touched Pages jika definisinya adalah lembaran fisik yang dibaca.
    // Di sini kita kembalikan total baris yang dikonversi ke format halaman SDQ.
    const calculatedPages = Math.floor(totalLines / this.LINES_PER_PAGE);
    const calculatedLines = totalLines % this.LINES_PER_PAGE;

    return { 
      pages: calculatedPages, 
      lines: calculatedLines, 
      juz: endData.juz, 
      isPartial: false 
    };
  }

  private static normalizeSurahName(name: string): string {
    return name.replace(/[’‘`]/g, "'").trim();
  }
}
