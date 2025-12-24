
import { AyahPointer, CalculationResult } from './types';
import { QURAN_METADATA } from './quranData';
import { SDQ_SURAH_ORDER } from './sdqCurriculum';

export class TahfizhEngine {
  /**
   * Menghitung capaian berdasarkan kurikulum SDQ.
   * Menangani Juz 30 terbalik dan Juz 29-26 forward.
   */
  static calculateRange(start: AyahPointer, end: AyahPointer): CalculationResult {
    try {
      // 1. Bersihkan Nama Surah (hapus prefiks angka jika ada)
      const cleanStartSurah = this.normalizeSurahName(start.surah);
      const cleanEndSurah = this.normalizeSurahName(end.surah);

      // 2. Temukan index di kurikulum SDQ
      const startIndex = SDQ_SURAH_ORDER.indexOf(cleanStartSurah);
      const endIndex = SDQ_SURAH_ORDER.indexOf(cleanEndSurah);

      if (startIndex === -1 || endIndex === -1) {
        return { pages: 0, lines: 0, juz: 0, isPartial: true, error: "Surah tidak ditemukan di kurikulum SDQ" };
      }

      // Pastikan urutan benar (start <= end di array kurikulum)
      if (startIndex > endIndex) {
         // Balik jika user input terbalik dari urutan kurikulum
         return this.calculateRange(end, start);
      }

      // 3. Identifikasi jalur surah yang dilewati
      const surahPath = SDQ_SURAH_ORDER.slice(startIndex, endIndex + 1);
      
      let totalLines = 0;

      surahPath.forEach((surahName, index) => {
        const meta = QURAN_METADATA[surahName];
        if (!meta) return;

        const isFirstSurah = index === 0;
        const isLastSurah = index === surahPath.length - 1;

        // Tentukan batas ayat untuk surah ini
        let sAyah = isFirstSurah ? start.ayah : 1;
        let eAyah = isLastSurah ? end.ayah : meta.totalAyah;

        // Validasi Ayat
        if (sAyah > meta.totalAyah) sAyah = meta.totalAyah;
        if (eAyah > meta.totalAyah) eAyah = meta.totalAyah;

        // Hitung proporsi baris Mushaf (15 baris per halaman)
        const totalPagesInSurah = meta.endPage - meta.startPage + 1;
        const totalLinesInSurah = totalPagesInSurah * 15;
        
        // Asumsi distribusi ayat merata per baris (pendekatan standar pendidikan)
        const ayatsCovered = Math.max(0, eAyah - sAyah + 1);
        const completionRatio = ayatsCovered / meta.totalAyah;
        const linesEarned = totalLinesInSurah * completionRatio;

        totalLines += linesEarned;
      });

      // 4. Konversi Baris ke Halaman & Juz (Standard: 20 Hal = 1 Juz)
      const finalPages = Math.floor(totalLines / 15);
      const remainingLines = Math.round(totalLines % 15);
      const decimalJuz = parseFloat((totalLines / (15 * 20)).toFixed(2));

      return {
        pages: finalPages,
        lines: remainingLines,
        juz: decimalJuz,
        isPartial: false
      };
    } catch (error) {
      console.error("Tahfizh Engine Fatal Error:", error);
      return { pages: 0, lines: 0, juz: 0, isPartial: true };
    }
  }

  private static normalizeSurahName(name: string): string {
    return name.replace(/^\d+\.\s*/, '').trim();
  }
}
