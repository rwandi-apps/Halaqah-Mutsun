
import { AyahPointer, CalculationResult } from './types';
import { QURAN_FULL_MAP } from './quranFullData';

export class TahfizhEngine {
  private static readonly LINES_PER_PAGE = 15;

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

    // Urutkan dari index kecil ke besar
    if (startData.globalIndex > endData.globalIndex) {
      const temp = startData;
      startData = endData;
      endData = temp;
    }

    // 1. Hitung Halaman Fisik (Touched Pages)
    // Ini menyelesaikan masalah An-Nas -> Al-Kafirun (2 Halaman)
    const touchedPages = endData.page - startData.page + 1;

    // 2. Hitung Baris Sisa (Opsional, untuk estimasi)
    const totalLines = (endData.page - startData.page) * 15 + (endData.line - startData.line) + 1;
    const remainingLines = totalLines % 15;

    return { 
      pages: touchedPages,     // <--- PAKAI INI
      lines: remainingLines,    // <--- ATAU 0 jika Anda ingin anggap full halaman
      juz: endData.juz, 
      isPartial: false 
    };
  }

  private static normalizeSurahName(name: string): string {
    // Pastikan backtick ` dan tanda kutip lain dihandle
    return name.replace(/[’‘`]/g, "'").trim();
  }
}
