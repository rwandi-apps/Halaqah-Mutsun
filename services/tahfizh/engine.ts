import { AyahPointer, CalculationResult } from './types';
import { QURAN_METADATA } from './quranData';
import { SDQ_SURAH_ORDER } from './sdqCurriculum';
import { AYAH_MAP } from './ayahMap';

export class TahfizhEngine {
  private static readonly LINES_PER_PAGE = 15;

  static calculateRange(start: AyahPointer, end: AyahPointer): CalculationResult {
    const sSurah = this.normalizeSurahName(start.surah);
    const eSurah = this.normalizeSurahName(end.surah);

    const startIndex = SDQ_SURAH_ORDER.indexOf(sSurah);
    const endIndex = SDQ_SURAH_ORDER.indexOf(eSurah);

    if (startIndex === -1 || endIndex === -1) {
      return { pages: 0, lines: 0, juz: 0, isPartial: true };
    }

    const path =
      startIndex <= endIndex
        ? SDQ_SURAH_ORDER.slice(startIndex, endIndex + 1)
        : SDQ_SURAH_ORDER.slice(endIndex, startIndex + 1);

    let totalLines = 0;
    let firstPointer: { page: number; line: number } | null = null;
    let lastPointer: { page: number; line: number } | null = null;

    path.forEach((surah, idx) => {
      const meta = QURAN_METADATA[surah];
      if (!meta) return;

      const startAyah = idx === 0 ? start.ayah : 1;
      const endAyah = idx === path.length - 1 ? end.ayah : meta.totalAyah;

      const startPrev = this.getPointer(surah, startAyah - 1);
      const endLoc = this.getPointer(surah, endAyah);

      if (!firstPointer) firstPointer = startPrev;
      lastPointer = endLoc;

      totalLines += this.diffLines(startPrev, endLoc);
    });

    if (!firstPointer || !lastPointer) {
      return { pages: 0, lines: 0, juz: 0, isPartial: true };
    }

    // ✅ HITUNG HALAMAN DARI PAGE MUSHAF (BUKAN DARI BARIS)
    const pages =
      lastPointer.page > firstPointer.page
        ? lastPointer.page - firstPointer.page
        : 0;

    // ✅ HITUNG BARIS SISA DI HALAMAN TERAKHIR SAJA
    const lines = lastPointer.line === this.LINES_PER_PAGE ? 0 : lastPointer.line;

    const juz = parseFloat((totalLines / 300).toFixed(2));

    return { pages, lines, juz, isPartial: false };
  }

  private static diffLines(
    start: { page: number; line: number },
    end: { page: number; line: number }
  ): number {
    if (start.page === end.page) {
      return Math.max(0, end.line - start.line);
    }

    return (
      (this.LINES_PER_PAGE - start.line) +
      (end.page - start.page - 1) * this.LINES_PER_PAGE +
      end.line
    );
  }

  private static getPointer(
    surah: string,
    ayah: number
  ): { page: number; line: number } {
    const manual = AYAH_MAP.find(a => a.surah === surah && a.ayah === ayah);
    if (manual) return { page: manual.page, line: manual.line };

    const meta = QURAN_METADATA[surah];
    if (!meta) return { page: 0, line: 0 };

    if (ayah <= 0) return { page: meta.startPage, line: 0 };
    if (ayah >= meta.totalAyah) return { page: meta.endPage, line: 15 };

    const totalLines = (meta.endPage - meta.startPage + 1) * 15;
    const est = Math.floor(totalLines * (ayah / meta.totalAyah));

    return {
      page: meta.startPage + Math.floor(est / 15),
      line: est % 15 || 1
    };
  }

  private static normalizeSurahName(name: string): string {
    return name.replace(/[’‘`]/g, "'").trim();
  }
}
