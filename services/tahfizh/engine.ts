
import { AyahPointer, CalculationResult } from './types';
import { QURAN_METADATA } from './quranData';
import { SDQ_SURAH_ORDER } from './sdqCurriculum';
import { AYAH_MAP } from './ayahMap';

export class TahfizhEngine {
  private static readonly LINES_PER_PAGE = 15;

  /**
   * Menghitung capaian (Halaman & Baris) secara deterministik.
   * Menggunakan urutan kurikulum SDQ dan koordinat fisik baris (1-15).
   */
  static calculateRange(start: AyahPointer, end: AyahPointer): CalculationResult {
    const sSurah = this.normalizeSurahName(start.surah);
    const eSurah = this.normalizeSurahName(end.surah);

    const startIndex = SDQ_SURAH_ORDER.indexOf(sSurah);
    const endIndex = SDQ_SURAH_ORDER.indexOf(eSurah);

    if (startIndex === -1 || endIndex === -1) {
      return { pages: 0, lines: 0, juz: 0, isPartial: true, error: "Surah tidak ditemukan di kurikulum SDQ" };
    }

    // Tentukan urutan surah yang dilewati
    const path = (startIndex <= endIndex) 
      ? SDQ_SURAH_ORDER.slice(startIndex, endIndex + 1)
      : SDQ_SURAH_ORDER.slice(endIndex, startIndex + 1);

    let totalLines = 0;

    path.forEach((surahName, index) => {
      const isFirstSurah = index === 0;
      const isLastSurah = index === path.length - 1;

      const meta = QURAN_METADATA[surahName];
      if (!meta) return;

      const ayahStart = isFirstSurah ? start.ayah : 1;
      const ayahEnd = isLastSurah ? end.ayah : meta.totalAyah;

      // Ambil koordinat fisik baris
      const startLoc = this.getAyahLocation(surahName, ayahStart);
      const endLoc = this.getAyahLocation(surahName, ayahEnd);

      if (startLoc.page === endLoc.page) {
        // Jika dalam satu halaman mushaf yang sama
        totalLines += (endLoc.line - startLoc.line + 1);
      } else {
        // Jika melintasi beberapa halaman mushaf
        // 1. Baris di halaman pertama
        totalLines += (this.LINES_PER_PAGE - startLoc.line + 1);
        // 2. Halaman penuh di antaranya (15 baris per halaman)
        const middlePages = Math.max(0, endLoc.page - startLoc.page - 1);
        totalLines += (middlePages * this.LINES_PER_PAGE);
        // 3. Baris di halaman terakhir
        totalLines += endLoc.line;
      }
    });

    // Sesuai aturan SDQ:
    // Pages = Total Baris / 15 (Halaman Penuh)
    // Lines = Sisa Baris (0-14). Jika pas 15, maka 1 halaman 0 baris.
    const pages = Math.floor(totalLines / this.LINES_PER_PAGE);
    const lines = totalLines % this.LINES_PER_PAGE;
    const juz = parseFloat((totalLines / 300).toFixed(2)); // Estimasi Juz (1 Juz ~ 20 Hal ~ 300 Baris)

    return { pages, lines, juz, isPartial: false };
  }

  /**
   * Mendapatkan koordinat baris fisik dari AYAH_MAP.
   * Jika tidak ada, menggunakan estimasi fallback yang aman.
   */
  private static getAyahLocation(surah: string, ayah: number): { page: number, line: number } {
    const found = AYAH_MAP.find(a => a.surah === surah && a.ayah === ayah);
    if (found) return { page: found.page, line: found.line };

    const meta = QURAN_METADATA[surah];
    if (!meta) return { page: 1, line: 1 };

    // Fallback Estimasi Linier (Jika data spesifik ayat belum di-mapping)
    const totalLines = (meta.endPage - meta.startPage + 1) * this.LINES_PER_PAGE;
    const estimatedGlobalLine = Math.floor((ayah / meta.totalAyah) * totalLines);
    const pageOffset = Math.floor(estimatedGlobalLine / this.LINES_PER_PAGE);
    const line = (estimatedGlobalLine % this.LINES_PER_PAGE) || 1;

    return { 
      page: meta.startPage + pageOffset, 
      line: Math.min(15, Math.max(1, line)) 
    };
  }

  private static normalizeSurahName(name: string): string {
    return name.replace(/[’‘`]/g, "'").trim();
  }
}
