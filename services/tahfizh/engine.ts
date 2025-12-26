
import { AyahPointer, CalculationResult } from './types';
import { QURAN_METADATA } from './quranData';
import { SDQ_SURAH_ORDER } from './sdqCurriculum';
import { AYAH_MAP } from './ayahMap';

export class TahfizhEngine {
  /**
   * Menghitung capaian berdasarkan kurikulum SDQ.
   * Menggunakan AYAH_MAP untuk akurasi baris absolut jika tersedia.
   */
  static calculateRange(start: AyahPointer, end: AyahPointer): CalculationResult {
    try {
      const cleanStartSurah = this.normalizeSurahName(start.surah);
      const cleanEndSurah = this.normalizeSurahName(end.surah);

      const startIndex = SDQ_SURAH_ORDER.indexOf(cleanStartSurah);
      const endIndex = SDQ_SURAH_ORDER.indexOf(cleanEndSurah);

      if (startIndex === -1 || endIndex === -1) {
        return { pages: 0, lines: 0, juz: 0, isPartial: true, error: "Surah tidak ditemukan" };
      }

      // Pastikan urutan selalu searah kurikulum
      if (startIndex > endIndex) {
         return this.calculateRange(end, start);
      }

      const surahPath = SDQ_SURAH_ORDER.slice(startIndex, endIndex + 1);
      let totalLines = 0;

      surahPath.forEach((surahName, index) => {
        const meta = QURAN_METADATA[surahName];
        if (!meta) return;

        const isFirstSurah = index === 0;
        const isLastSurah = index === surahPath.length - 1;

        let sAyah = isFirstSurah ? start.ayah : 1;
        let eAyah = isLastSurah ? end.ayah : meta.totalAyah;

        // PRIORITAS 1: Gunakan Precision Map jika data tersedia (untuk akurasi per baris)
        const startLoc = AYAH_MAP.find(a => this.normalizeSurahName(a.surah) === surahName && a.ayah === sAyah);
        const endLoc = AYAH_MAP.find(a => this.normalizeSurahName(a.surah) === surahName && a.ayah === eAyah);

        if (startLoc && endLoc) {
          // Perhitungan baris presisi: (Selisih Halaman * 15) + Selisih Baris + 1 (inklusif)
          const lines = ((endLoc.page - startLoc.page) * 15) + (endLoc.line - startLoc.line) + 1;
          totalLines += Math.max(0, lines);
        } else {
          // PRIORITAS 2: Fallback ke Estimasi Rasio (untuk Juz yang belum dipetakan lengkap)
          const totalPagesInSurah = meta.endPage - meta.startPage + 1;
          const totalLinesInSurah = totalPagesInSurah * 15;
          const ayatsCovered = Math.max(0, eAyah - sAyah + 1);
          const linesEarned = totalLinesInSurah * (ayatsCovered / meta.totalAyah);
          totalLines += linesEarned;
        }
      });

      const finalPages = Math.floor(totalLines / 15);
      const remainingLines = Math.round(totalLines % 15);
      const decimalJuz = parseFloat((totalLines / 300).toFixed(2)); // 300 baris = 20 hal = 1 juz

      return {
        pages: finalPages,
        lines: remainingLines,
        juz: decimalJuz,
        isPartial: false
      };
    } catch (error) {
      console.error("Tahfizh Engine Error:", error);
      return { pages: 0, lines: 0, juz: 0, isPartial: true };
    }
  }

  /**
   * Menormalisasi nama surah agar pencarian di map konsisten.
   * Menghapus angka urutan, menormalisasi tanda petik curly, dan spasi.
   */
  private static normalizeSurahName(name: string): string {
    if (!name) return "";
    return name
      .replace(/^\d+\.\s*/, '') // Hapus "1. ", "2. ", dst
      .replace(/[’‘`]/g, "'")   // Ubah tanda petik curly ke straight
      .trim();
  }
}
