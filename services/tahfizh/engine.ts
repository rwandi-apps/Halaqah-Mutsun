import { AyahPointer, CalculationResult } from './types';
import { QURAN_FULL_MAP } from './quranFullData';

export class TahfizhEngine {
  private static readonly LINES_PER_PAGE = 15;

  // Daftar surah yang menjadi PEMBUKA Juz di Kurikulum SDQ
  private static readonly SDQ_STARTERS = [
    "Al-Baqarah",    // Juz 1
    "Al-Ahqaf",      // Juz 26
    "Adz-Dzariyat",  // Juz 27 (Dimulai ayat 31)
    "Al-Mujadilah",  // Juz 28
    "Al-Mulk",       // Juz 29
    "An-Nas"         // Juz 30
  ];

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

    // Urutkan input agar selalu dari kecil ke besar
    if (startData.globalIndex > endData.globalIndex) {
      const temp = startData;
      startData = endData;
      endData = temp;
    }

    const totalLines = (endData.page - startData.page) * 15 + (endData.line - startData.line) + 1;
    const touchedPages = endData.page - startData.page + 1;
    const pageGap = touchedPages; // Jarak antara Start dan End

    // --- LOGIKA HYBRID SDQ ---
    let pages: number;
    let lines: number;

    const isSameSurah = this.normalizeSurahName(start.surah) === this.normalizeSurahName(end.surah);
    
    // CASE 1: SATU SURAH (Setoran Lanjut atau SDQ dalam 1 surah)
    if (isSameSurah) {
      // Pakai Volume Baris (Sesuai keinginan Al-Baqarah & An-Nas)
      pages = Math.floor(totalLines / 15);
      lines = totalLines % 15;
    } 
    // CASE 2: BEDA SURAH
    else {
      // Cek apakah ini MURAJA'AH biasa atau TRANSISI SDQ
      const isSDQEndStarter = SDQ_STARTERS.some(s => this.normalizeSurahName(end.surah).includes(s));
      
      // Logika Deteksi SDQ:
      // 1. Ini adalah Surah Pembuka SDQ (Contoh: Al-Mulk)
      // 2. Dan jarak antara Start & End itu KECIL (< 50 halaman).
      //    (Muraja'ah besar jaraknya ratusan, Transisi SDQ jaraknya belasan).
      if (isSDQEndStarter && pageGap < 50) {
        // --- MODE TRANSISI SDQ (Naik Kelas) ---
        // Kita HANYA menghitung volume surah yang BARU (Surah End)
        // Menghitung dari Ayat 1 Surah End sampai Ayat End Surah End
        
        // Cari koordinat ayat pertama surah target
        const firstAyahKey = `${this.normalizeSurahName(end.surah)}:1`;
        const firstAyahData = QURAN_FULL_MAP[firstAyahKey];

        if (firstAyahData) {
           // Hitung volume surah baru tersebut
           const volNewSurah = (endData.page - firstAyahData.page) * 15 + (endData.line - firstAyahData.line) + 1;
           
           pages = Math.floor(volNewSurah / 15);
           lines = volNewSurah % 15;
        } else {
           pages = 0;
           lines = 0;
        }

      } else {
        // --- MODE MURAJA'AH (Umum) ---
        // Pakai Halaman Fisik (Touched Pages)
        pages = touchedPages;
        lines = totalLines % 15; 
      }
    }

    return { 
      pages: pages, 
      lines: lines, 
      juz: endData.juz, 
      isPartial: false 
    };
  }

  private static normalizeSurahName(name: string): string {
    return name.replace(/[’‘`]/g, "'").trim();
  }
}
