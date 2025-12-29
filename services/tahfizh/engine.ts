import { AyahPointer, CalculationResult, AyahMapEntry } from './types';
import { QURAN_METADATA } from './quranData';
import { SDQ_SURAH_ORDER } from './sdqCurriculum';
// Pastikan ini import JSON agar ringan, atau object yang sudah di-cast
import AYAH_DATA_RAW from './ayah-map.json'; 

const AYAH_MAP = AYAH_DATA_RAW as AyahMapEntry[];

export class TahfizhEngine {
  private static readonly LINES_PER_PAGE = 15;

  /**
   * Optimasi: Cache Map untuk pencarian O(1)
   * Key format: "SurahName:AyahNum" -> Entry
   */
  private static ayahMapCache: Map<string, AyahMapEntry> | null = null;

  private static getCachedMap(): Map<string, AyahMapEntry> {
    if (!this.ayahMapCache) {
      this.ayahMapCache = new Map();
      AYAH_MAP.forEach(entry => {
        this.ayahMapCache!.set(`${entry.surah}:${entry.ayah}`, entry);
      });
    }
    return this.ayahMapCache!;
  }

  static calculateRange(start: AyahPointer, end: AyahPointer): CalculationResult {
    const sSurah = this.normalizeSurahName(start.surah);
    const eSurah = this.normalizeSurahName(end.surah);

    const startIndex = SDQ_SURAH_ORDER.indexOf(sSurah);
    const endIndex = SDQ_SURAH_ORDER.indexOf(eSurah);

    if (startIndex === -1 || endIndex === -1) {
      return { pages: 0, lines: 0, juz: 0, isPartial: true, error: "Surah tidak terdaftar" };
    }

    // Tentukan arah path (selalu maju)
    const isForward = startIndex <= endIndex;
    const path = isForward 
      ? SDQ_SURAH_ORDER.slice(startIndex, endIndex + 1)
      : SDQ_SURAH_ORDER.slice(endIndex, startIndex + 1);

    let totalLines = 0;

    path.forEach((surahName, index) => {
      const surahMeta = QURAN_METADATA[surahName];
      if (!surahMeta) return;

      // Tentukan range ayat untuk surah ini
      let startAyah = 1;
      let endAyah = surahMeta.totalAyah;

      if (index === 0) {
        // Jika ini surah pertama dalam range user
        startAyah = isForward ? start.ayah : 1; 
      }
      
      if (index === path.length - 1) {
        // Jika ini surah terakhir dalam range user
        endAyah = isForward ? end.ayah : start.ayah; // Handle jika user input terbalik
      }

      // Hitung Fisik
      // 1. Cari posisi AKHIR dari ayat target
      const locEnd = this.getPointer(surahName, endAyah);
      
      // 2. Cari posisi AKHIR dari ayat SEBELUM start (titik potong awal)
      const locStartPrev = this.getPointer(surahName, startAyah - 1);

      totalLines += this.diffLines(locStartPrev, locEnd);
    });

    const pages = Math.floor(totalLines / this.LINES_PER_PAGE);
    const lines = totalLines % this.LINES_PER_PAGE;
    // Standar umum: 1 Juz = 20 Halaman = 300 Baris (Mushaf Madinah)
    const juz = parseFloat((totalLines / 300).toFixed(2));

    return { pages, lines, juz, isPartial: false };
  }

  /**
   * Menghitung selisih fisik baris.
   * Rumus: (Baris Total Akhir) - (Baris Total Awal)
   */
  private static diffLines(start: {page: number, line: number}, end: {page: number, line: number}): number {
    // Konversi koordinat (Page, Line) menjadi "Global Line Index"
    // Contoh: Hal 1 Baris 15 = Global Line 15. Hal 2 Baris 1 = Global Line 16.
    
    const startGlobalLine = ((start.page - 1) * this.LINES_PER_PAGE) + start.line;
    const endGlobalLine = ((end.page - 1) * this.LINES_PER_PAGE) + end.line;

    const diff = endGlobalLine - startGlobalLine;
    return Math.max(0, diff);
  }

  /**
   * Mengambil koordinat fisik dimana sebuah ayat BERAKHIR.
   */
  private static getPointer(surah: string, ayah: number): {page: number, line: number} {
    const meta = QURAN_METADATA[surah];
    
    // CASE 1: Posisi Awal (Ayah 0 / Basmalah)
    if (ayah <= 0) {
      // Kita cari posisi Ayah 1 dulu
      const ayah1Pos = this.getPointer(surah, 1);
      
      // Secara default, "Sebelum Ayah 1" adalah mundur 1 baris (untuk Basmalah)
      // Jika Ayah 1 ada di baris 1, mundur ke halaman sebelumnya baris 15
      let prevPage = ayah1Pos.page;
      let prevLine = ayah1Pos.line - 1; // Mundur 1 baris (asumsi Header/Basmalah)

      // Aturan Khusus: Jika Ayah 1 panjang dan memakan 1 halaman penuh (sangat jarang),
      // logic ini tetap aman karena kita hanya butuh titik potong start.
      
      // Handle page break mundur
      if (prevLine < 1) {
        prevPage -= 1;
        prevLine = 15;
      }

      // Koreksi: Jangan sampai mundur ke Halaman 0
      if (prevPage < meta.startPage) {
          // Jika sudah mentok di awal surah di awal halaman (misal Al-Fatihah atau awal Juz)
          // Kembalikan posisi tepat sebelum baris pertama surah ini
          // Kita asumsikan start linenya adalah 0 (virtual) relatif terhadap halaman itu
          return { page: meta.startPage, line: Math.max(0, ayah1Pos.line - 1) };
      }

      return { page: prevPage, line: prevLine };
    }

    // CASE 2: Cari di Database Akurat (JSON)
    const cache = this.getCachedMap();
    const exact = cache.get(`${surah}:${ayah}`);
    if (exact) {
      return { page: exact.page, line: exact.line };
    }

    // CASE 3: Fallback Estimasi (Jika data JSON tidak lengkap)
    // Gunakan proporsi linear sederhana
    if (!meta) return { page: 1, line: 15 };
    
    const totalLinesInSurah = ((meta.endPage - meta.startPage + 1) * 15);
    const ratio = ayah / meta.totalAyah;
    const estimatedGlobalLines = Math.floor(totalLinesInSurah * ratio);
    
    const pageOffset = Math.floor(estimatedGlobalLines / 15);
    const lineOffset = estimatedGlobalLines % 15;

    return {
      page: meta.startPage + pageOffset,
      line: lineOffset === 0 ? 15 : lineOffset
    };
  }

  private static normalizeSurahName(name: string): string {
    return name.replace(/[’‘`]/g, "'").trim();
  }
}
