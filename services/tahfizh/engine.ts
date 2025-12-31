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

    // 1. Hitung Total Baris (Volume)
    const totalLines = (endData.page - startData.page) * 15 + (endData.line - startData.line) + 1;
    
    // 2. Hitung Halaman Fisik (Touched Pages)
    const touchedPages = endData.page - startData.page + 1;

    // --- LOGIKA HYBRID ---
    let pages: number;
    let lines: number;

    // Cek apakah ini dalam surah yang sama (Setoran Lanjut)
    // Jika sama surah, kita pakai hitungan Volume Baris (Math.floor)
    // Jika beda surah (Muraja'ah), kita pakai hitungan Halaman Fisik
    const isSameSurah = this.normalizeSurahName(start.surah) === this.normalizeSurahName(end.surah);

    if (isSameSurah) {
      // Logika Volume (Sesuai kasus Al-Baqarah 6-17)
      pages = Math.floor(totalLines / 15);
      lines = totalLines % 15;

      // Minimal 1 halaman jika ada isinya (menangani kasus surah pendek seperti An-Naba)
      if (pages === 0 && lines > 0) {
        pages = 1;
      }
    } else {
      // Logika Fisik (Sesuai kasus An-Nas -> Al-Kafirun)
      pages = touchedPages;
      lines = totalLines % 15; // Opsional, bisa diset 0 jika ingin murni hitungan halaman
    }

    return { 
      pages: pages, 
      lines: lines, 
      juz: endData.juz, 
      isPartial: false 
    };
  }

  private static normalizeSurahName(name: string): string {
    // Handle kutip aneh (’, ‘, `)
    return name.replace(/[’‘`]/g, "'").trim();
  }
}
