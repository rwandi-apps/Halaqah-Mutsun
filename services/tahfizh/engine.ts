import { AyahPointer, CalculationResult } from './types';
import { QURAN_METADATA } from './quranData';
import { SDQ_SURAH_ORDER } from './sdqCurriculum';
import { AYAH_MAP } from './ayahMap';

export class TahfizhEngine {
  private static readonly LINES_PER_PAGE = 15;

  /**
   * Menghitung capaian tahfizh berdasarkan BARIS & HALAMAN FISIK mushaf,
   * mengikuti urutan kurikulum SDQ.
   */
  static calculateRange(
    start: AyahPointer,
    end: AyahPointer
  ): CalculationResult {

    const sSurah = this.normalizeSurahName(start.surah);
    const eSurah = this.normalizeSurahName(end.surah);

    const startIndex = SDQ_SURAH_ORDER.indexOf(sSurah);
    const endIndex = SDQ_SURAH_ORDER.indexOf(eSurah);

    if (startIndex === -1 || endIndex === -1) {
      return {
        pages: 0,
        lines: 0,
        juz: 0,
        isPartial: true,
        error: 'Surah tidak terdaftar di kurikulum SDQ'
      };
    }

    // Pastikan selalu maju sesuai urutan SDQ
    const path =
      startIndex <= endIndex
        ? SDQ_SURAH_ORDER.slice(startIndex, endIndex + 1)
        : SDQ_SURAH_ORDER.slice(endIndex, startIndex + 1);

    let totalLines = 0;
    const uniquePages = new Set<number>();

    path.forEach((surahName, idx) => {
      const meta = QURAN_METADATA[surahName];
      if (!meta) return;

      const isFirst = idx === 0;
      const isLast = idx === path.length - 1;

      const startAyah = isFirst ? start.ayah : 1;
      const endAyah = isLast ? end.ayah : meta.totalAyah;

      const locStart = this.getPointer(surahName, startAyah);
      const locEnd = this.getPointer(surahName, endAyah);

      // Hitung baris
      totalLines += this.diffLines(locStart, locEnd);

      // Hitung halaman fisik (bukan konversi baris)
      for (let p = locStart.page; p <= locEnd.page; p++) {
        if (p > 0) uniquePages.add(p);
      }
    });

    return {
      pages: uniquePages.size,
      lines: totalLines,
      juz: parseFloat((totalLines / 300).toFixed(2)), // opsional: estimasi progres
      isPartial: false
    };
  }

  /**
   * Menghitung selisih baris fisik mushaf
   * (inklusif ayat awal & ayat akhir).
   */
  private static diffLines(
    start: { page: number; line: number },
    end: { page: number; line: number }
  ): number {
    if (!start.page || !end.page) return 0;

    // Satu halaman
    if (start.page === end.page) {
      return Math.max(0, end.line - start.line + 1);
    }

    // Lintas halaman
    return (
      (this.LINES_PER_PAGE - start.line + 1) +
      (end.page - start.page - 1) * this.LINES_PER_PAGE +
      end.line
    );
  }

  /**
   * Mengambil posisi fisik ayat dari map (akurat),
   * fallback ke estimasi metadata jika tidak tersedia.
   */
  private static getPointer(
    surah: string,
    ayah: number
  ): { page: number; line: number } {

    const manual = AYAH_MAP.find(
      a => a.surah === surah && a.ayah === ayah
    );
    if (manual) {
      return { page: manual.page, line: manual.line };
    }

    const meta = QURAN_METADATA[surah];
    if (!meta) return { page: 0, line: 0 };

    if (ayah <= 1) {
      return { page: meta.startPage, line: 1 };
    }

    if (ayah >= meta.totalAyah) {
      return { page: meta.endPage, line: this.LINES_PER_PAGE };
    }

    // Estimasi linier (fallback DARURAT)
    const totalLines =
      (meta.endPage - meta.startPage + 1) * this.LINES_PER_PAGE;
    const estimated = Math.floor(
      totalLines * (ayah / meta.totalAyah)
    );

    return {
      page: meta.startPage + Math.floor(estimated / this.LINES_PER_PAGE),
      line: (estimated % this.LINES_PER_PAGE) + 1
    };
  }

  private static normalizeSurahName(name: string): string {
    return name.replace(/[’‘`]/g, "'").trim();
  }
}
