
import { AyahPointer, CalculationResult } from './types';
import { QURAN_FULL_MAP } from './quranFullData';

export class TahfizhEngine {
  private static readonly LINES_PER_PAGE = 15;

  /**
   * Normalisasi nama surah untuk memastikan kecocokan dengan key di QURAN_FULL_MAP.
   * Mengubah curly quotes (’) menjadi straight quotes (') dan menghapus spasi berlebih.
   */
  private static normalize(name: string): string {
    return name.replace(/[’‘`]/g, "'").trim();
  }

  /**
   * Menghitung selisih hafalan berdasarkan (page, line) fisik Mushaf.
   * Fokus: Jarak fisik absolut antar koordinat.
   */
  static calculateRange(start: AyahPointer, end: AyahPointer): CalculationResult {
    const sKey = `${this.normalize(start.surah)}:${start.ayah}`;
    const eKey = `${this.normalize(end.surah)}:${end.ayah}`;

    let startPos = QURAN_FULL_MAP[sKey];
    let endPos = QURAN_FULL_MAP[eKey];

    // 1. Validasi Data: Jika koordinat tidak ditemukan, kembalikan status partial.
    if (!startPos || !endPos) {
      return { 
        pages: 0, 
        lines: 0, 
        juz: 0, 
        isPartial: true, 
        error: `Data koordinat tidak ditemukan untuk: ${!startPos ? sKey : eKey}` 
      };
    }

    // 2. Handling Arah Mundur: 
    // Jika start secara fisik berada setelah end, tukar pointernya.
    // Ini memastikan perhitungan selalu positif (jarak fisik).
    let p1 = startPos;
    let p2 = endPos;

    if (p1.page > p2.page || (p1.page === p2.page && p1.line > p2.line)) {
      p1 = endPos;
      p2 = startPos;
    }

    // 3. Logika Hitung Selisih Fisik (Langkah 4 & 5 Spesifikasi)
    // Rumus Dasar: Inclusive Line Count
    // Total Baris = ((PageEnd - PageStart) * 15) + (LineEnd - LineStart) + 1
    const totalLinesInclusive = ((p2.page - p1.page) * this.LINES_PER_PAGE) + (p2.line - p1.line) + 1;

    // 4. Konversi ke Format Output SDQ (Pages : Lines)
    // Pages = Kelipatan 15 baris
    // Lines = Sisa baris (0-14)
    let pages = Math.floor(totalLinesInclusive / this.LINES_PER_PAGE);
    let lines = totalLinesInclusive % this.LINES_PER_PAGE;

    // 5. Validasi Validitas (Pages >= 0, Lines 0-14)
    // Logic: Jika lines == 15 otomatis menjadi 1 page 0 lines karena floor/mod.
    
    // Khusus SDQ: Jika melompat halaman namun total baris sedikit, 
    // pastikan tidak ada hasil "0 Halaman" jika secara fisik menyentuh halaman baru yang signifikan.
    // Namun tetap mengacu pada hitungan baris absolut agar adil.

    return {
      pages,
      lines,
      juz: endPos.juz,
      isPartial: false
    };
  }
}
