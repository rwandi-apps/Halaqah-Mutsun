
import { AyahPointer, CalculationResult } from './types';
import { QURAN_METADATA } from './quranData';
import { SDQ_SURAH_ORDER } from './sdqCurriculum';
import { AYAH_MAP } from './ayahMap';

export class TahfizhEngine {
  private static readonly LINES_PER_PAGE = 15;

  /**
   * Menghitung total baris capaian antara dua titik (Start -> End).
   * Menghitung secara deterministik sesuai urutan kurikulum SDQ.
   */
  static calculateRange(start: AyahPointer, end: AyahPointer): CalculationResult {
    const sSurah = this.normalizeSurahName(start.surah);
    const eSurah = this.normalizeSurahName(end.surah);

    const startIndex = SDQ_SURAH_ORDER.indexOf(sSurah);
    const endIndex = SDQ_SURAH_ORDER.indexOf(eSurah);

    if (startIndex === -1 || endIndex === -1) {
      return { pages: 0, lines: 0, juz: 0, isPartial: true, error: "Surah tidak terdaftar di kurikulum" };
    }

    // Pastikan arah perhitungan selalu maju sesuai kurikulum
    const path = (startIndex <= endIndex) 
      ? SDQ_SURAH_ORDER.slice(startIndex, endIndex + 1)
      : SDQ_SURAH_ORDER.slice(endIndex, startIndex + 1);

    let totalLines = 0;
    const uniquePages = new Set<number>();

    path.forEach((surahName, index) => {
      const isFirstSurah = index === 0;
      const isLastSurah = index === path.length - 1;

      const surahMeta = QURAN_METADATA[surahName];
      if (!surahMeta) return;

      const sAyah = isFirstSurah ? start.ayah : 1;
      const eAyat = isLastSurah ? end.ayah : surahMeta.totalAyah;

      // Logika "Delta Baris":
      // Kita hitung dari akhir Ayah (eAyat) dikurangi posisi SEBELUM Ayah awal (sAyah).
      const locEnd = this.getPointer(surahName, eAyat);
      const locStartPrev = this.getPointer(surahName, sAyah - 1);

      totalLines += this.diffLines(locStartPrev, locEnd);

      // Tracking halaman fisik untuk output info halaman
      for (let p = Math.min(locEnd.page, locStartPrev.page); p <= Math.max(locEnd.page, locStartPrev.page); p++) {
        if (p > 0) uniquePages.add(p);
      }
    });

    const pages = Math.floor(totalLines / this.LINES_PER_PAGE);
    const lines = totalLines % this.LINES_PER_PAGE;
    const juz = parseFloat((totalLines / 300).toFixed(2));

    return { pages, lines, juz, isPartial: false };
  }

  /**
   * Menghitung selisih baris antara dua koordinat (Inclusive of End, Exclusive of StartPrev).
   */
  private static diffLines(start: {page: number, line: number}, end: {page: number, line: number}): number {
    if (start.page === 0 || end.page === 0) return 0;

    // Jika pada halaman yang sama
    if (start.page === end.page) {
      // Aturan Khusus: jika ayat awal di baris 1 (atau start prev di baris 0)
      if (start.line === 0) return end.line;
      return Math.max(0, end.line - start.line);
    }

    // Jika pada halaman yang berbeda
    return (this.LINES_PER_PAGE - start.line) + 
           ((end.page - start.page - 1) * this.LINES_PER_PAGE) + 
           end.line;
  }

  /**
   * Mengambil koordinat fisik Ayah dari map atau estimasi.
   */
  private static getPointer(surah: string, ayah: number): {page: number, line: number} {
    // 1. Cek di Manual Map (Akurasi Tinggi)
    const manual = AYAH_MAP.find(a => a.surah === surah && a.ayah === ayah);
    if (manual) return { page: manual.page, line: manual.line };

    // 2. Fallback: Gunakan estimasi berbasis metadata surah (Mushaf Madinah)
    const meta = QURAN_METADATA[surah];
    if (!meta) return { page: 0, line: 0 };

    if (ayah <= 0) {
      // Posisi sebelum Ayah 1 (Header/Basmalah)
      return { page: meta.startPage, line: 0 };
    }

    if (ayah >= meta.totalAyah) {
      return { page: meta.endPage, line: 15 };
    }

    // Estimasi linier sederhana jika tidak ada di map
    const totalLinesSurah = (meta.endPage - meta.startPage + 1) * 15;
    const estLineCount = Math.floor(totalLinesSurah * (ayah / meta.totalAyah));
    const estPage = meta.startPage + Math.floor(estLineCount / 15);
    const estLine = estLineCount % 15 || 1;

    return { page: estPage, line: estLine };
  }

  private static normalizeSurahName(name: string): string {
    return name.replace(/[’‘`]/g, "'").trim();
  }
}
