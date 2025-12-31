import { AyahPointer, CalculationResult } from './types';
import { QURAN_FULL_MAP } from './quranFullData';

// --- DATA INTERNAL (Agar Aman & Tidak Error) ---
// Mapping Nama Surah -> Data (Nomor Surah, GlobalIndex Ayat 1, Total Ayat)
const SURAH_DATA: Record<string, { num: number, startIdx: number, totalAyat: number }> = {
  "Al-Fatihah": { num: 1, startIdx: 1, totalAyat: 7 },
  "Al-Baqarah": { num: 2, startIdx: 8, totalAyat: 286 },
  "Ali Imran": { num: 3, startIdx: 294, totalAyat: 200 },
  "An-Nisa": { num: 4, startIdx: 494, totalAyat: 176 },
  "Al-Maidah": { num: 5, startIdx: 670, totalAyat: 120 },
  "Al-An'am": { num: 6, startIdx: 790, totalAyat: 165 },
  "Al-A'raf": { num: 7, startIdx: 955, totalAyat: 206 },
  "Al-Anfal": { num: 8, startIdx: 1224, totalAyat: 75 },
  "At-Taubah": { num: 9, startIdx: 1300, totalAyat: 129 },
  "Yunus": { num: 10, startIdx: 1363, totalAyat: 109 },
  "Hud": { num: 11, startIdx: 1451, totalAyat: 123 },
  "Yusuf": { num: 12, startIdx: 1537, totalAyat: 111 },
  "Ar-Ra'd": { num: 13, startIdx: 1595, totalAyat: 43 },
  "Ibrahim": { num: 14, startIdx: 1634, totalAyat: 52 },
  "Al-Hijr": { num: 15, startIdx: 1686, totalAyat: 99 },
  "An-Nahl": { num: 16, startIdx: 1723, totalAyat: 128 },
  "Al-Isra": { num: 17, startIdx: 1780, totalAyat: 111 },
  "Al-Kahf": { num: 18, startIdx: 1826, totalAyat: 110 },
  "Maryam": { num: 19, startIdx: 1864, totalAyat: 98 },
  "Ta Ha": { num: 20, startIdx: 1906, totalAyat: 135 },
  "Al-Anbiya": { num: 21, startIdx: 1939, totalAyat: 112 },
  "Al-Hajj": { num: 22, startIdx: 1994, totalAyat: 78 },
  "Al-Mu'minun": { num: 23, startIdx: 2043, totalAyat: 118 },
  "An-Nur": { num: 24, startIdx: 2095, totalAyat: 64 },
  "Al-Furqan": { num: 25, startIdx: 2154, totalAyat: 77 },
  "Ash-Shu'ara": { num: 26, startIdx: 2184, totalAyat: 227 },
  "An-Naml": { num: 27, startIdx: 2239, totalAyat: 93 },
  "Al-Qasas": { num: 28, startIdx: 2290, totalAyat: 88 },
  "Al-Ankabut": { num: 29, startIdx: 2338, totalAyat: 69 },
  "Ar-Rum": { num: 30, startIdx: 2398, totalAyat: 60 },
  "Luqman": { num: 31, startIdx: 2457, totalAyat: 34 },
  "As-Sajdah": { num: 32, startIdx: 2491, totalAyat: 54 },
  "Al-Ahzab": { num: 33, startIdx: 2519, totalAyat: 73 },
  "Saba": { num: 34, startIdx: 2568, totalAyat: 54 },
  "Fatir": { num: 35, startIdx: 2600, totalAyat: 45 },
  "Ya Sin": { num: 36, startIdx: 2626, totalAyat: 83 },
  "As-Saffat": { num: 37, startIdx: 2660, totalAyat: 182 },
  "Sad": { num: 38, startIdx: 2699, totalAyat: 88 },
  "Az-Zumar": { num: 39, startIdx: 2730, totalAyat: 75 },
  "Ghafir": { num: 40, startIdx: 2774, totalAyat: 85 },
  "Fussilat": { num: 41, startIdx: 2816, totalAyat: 54 },
  "Ash-Shura": { num: 42, startIdx: 2862, totalAyat: 53 },
  "Az-Zukhruf": { num: 43, startIdx: 2895, totalAyat: 89 },
  "Ad-Dukhan": { num: 44, startIdx: 2928, totalAyat: 59 },
  "Al-Jasiyah": { num: 45, startIdx: 2944, totalAyat: 37 },
  "Al-Ahqaf": { num: 46, startIdx: 2969, totalAyat: 35 },
  "Muhammad": { num: 47, startIdx: 3011, totalAyat: 38 },
  "Al-Fath": { num: 48, startIdx: 3059, totalAyat: 29 },
  "Al-Hujurat": { num: 49, startIdx: 3095, totalAyat: 18 },
  "Qaf": { num: 50, startIdx: 3119, totalAyat: 45 },
  "Adz-Dzariyat": { num: 51, startIdx: 3167, totalAyat: 60 },
  "At-Tur": { num: 52, startIdx: 3207, totalAyat: 49 },
  "An-Najm": { num: 53, startIdx: 3248, totalAyat: 62 },
  "Al-Qamar": { num: 54, startIdx: 3292, totalAyat: 55 },
  "Ar-Rahman": { num: 55, startIdx: 3341, totalAyat: 78 },
  "Al-Waqi'ah": { num: 56, startIdx: 3397, totalAyat: 96 },
  "Al-Hadid": { num: 57, startIdx: 3469, totalAyat: 29 },
  "Al-Mujadilah": { num: 58, startIdx: 3525, totalAyat: 22 },
  "Al-Hashr": { num: 59, startIdx: 3573, totalAyat: 24 },
  "Al-Mumtahanah": { num: 60, startIdx: 3596, totalAyat: 13 },
  "Ash-Shaf": { num: 61, startIdx: 3622, totalAyat: 14 },
  "Al-Jumu'ah": { num: 62, startIdx: 3640, totalAyat: 11 },
  "Al-Munafiqun": { num: 63, startIdx: 3651, totalAyat: 11 },
  "At-Taghabun": { num: 64, startIdx: 3662, totalAyat: 18 },
  "At-Talaq": { num: 65, startIdx: 3685, totalAyat: 12 },
  "At-Tahrim": { num: 66, startIdx: 3697, totalAyat: 12 },
  "Al-Mulk": { num: 67, startIdx: 3711, totalAyat: 30 },
  "Al-Qalam": { num: 68, startIdx: 3744, totalAyat: 52 },
  "Al-Haqqah": { num: 69, startIdx: 3788, totalAyat: 52 },
  "Al-Ma'arij": { num: 70, startIdx: 3840, totalAyat: 44 },
  "Nuh": { num: 71, startIdx: 3876, totalAyat: 28 },
  "Al-Jinn": { num: 72, startIdx: 3909, totalAyat: 22 },
  "Al-Muzzammil": { num: 73, startIdx: 3932, totalAyat: 20 },
  "Al-Muddassir": { num: 74, startIdx: 3956, totalAyat: 56 },
  "Al-Qiyamah": { num: 75, startIdx: 4019, totalAyat: 40 },
  "Al-Insan": { num: 76, startIdx: 4049, totalAyat: 31 },
  "Al-Mursalat": { num: 77, startIdx: 4079, totalAyat: 50 },
  "An-Naba": { num: 78, startIdx: 4116, totalAyat: 40 },
  "An-Nazi'at": { num: 79, startIdx: 4152, totalAyat: 46 },
  "Abasa": { num: 80, startIdx: 4202, totalAyat: 42 },
  "At-Takwir": { num: 81, startIdx: 4244, totalAyat: 29 },
  "Al-Infitar": { num: 82, startIdx: 4285, totalAyat: 17 },
  "Al-Mutaffifin": { num: 83, startIdx: 4303, totalAyat: 36 },
  "Al-Insyiqaq": { num: 84, startIdx: 4343, totalAyat: 17 },
  "Al-Buruj": { num: 85, startIdx: 4377, totalAyat: 22 },
  "Ath-Thariq": { num: 86, startIdx: 4403, totalAyat: 17 },
  "Al-A'la": { num: 87, startIdx: 4421, totalAyat: 19 },
  "Al-Ghashiyah": { num: 88, startIdx: 4435, totalAyat: 26 },
  "Al-Fajr": { num: 89, startIdx: 4457, totalAyat: 30 },
  "Al-Balad": { num: 90, startIdx: 4482, totalAyat: 20 },
  "Ash-Shams": { num: 91, startIdx: 4496, totalAyat: 15 },
  "Al-Lail": { num: 92, startIdx: 4506, totalAyat: 21 },
  "Adh-Duha": { num: 93, startIdx: 4519, totalAyat: 11 },
  "Al-Insyirah": { num: 94, startIdx: 4527, totalAyat: 8 },
  "At-Tin": { num: 95, startIdx: 4534, totalAyat: 8 },
  "Al-'Alaq": { num: 96, startIdx: 4540, totalAyat: 19 },
  "Al-Qadr": { num: 97, startIdx: 4556, totalAyat: 5 },
  "Al-Bayyinah": { num: 98, startIdx: 4561, totalAyat: 8 },
  "Al-Zalzalah": { num: 99, startIdx: 4573, totalAyat: 8 },
  "Al-'Adiyat": { num: 100, startIdx: 4586, totalAyat: 11 },
  "Al-Qari'ah": { num: 101, startIdx: 4599, totalAyat: 11 },
  "At-Takathur": { num: 102, startIdx: 4617, totalAyat: 8 },
  "Al-'Ashr": { num: 103, startIdx: 4637, totalAyat: 3 },
  "Al-Humazah": { num: 104, startIdx: 4643, totalAyat: 9 },
  "Al-Fil": { num: 105, startIdx: 4651, totalAyat: 5 },
  "Quraisy": { num: 106, startIdx: 4657, totalAyat: 4 },
  "Al-Ma'un": { num: 107, startIdx: 4663, totalAyat: 7 },
  "Al-Kautsar": { num: 108, startIdx: 4673, totalAyat: 3 },
  "Al-Kafirun": { num: 109, startIdx: 4676, totalAyat: 6 },
  "An-Nasr": { num: 110, startIdx: 4683, totalAyat: 3 },
  "Al-Masad": { num: 111, startIdx: 4686, totalAyat: 5 },
  "Al-Ikhlas": { num: 112, startIdx: 4692, totalAyat: 4 },
  "Al-Falaq": { num: 113, startIdx: 4696, totalAyat: 5 },
  "An-Nas": { num: 114, startIdx: 4700, totalAyat: 6 },
};

// Urutan Nomor Surah SDQ (Juz 30 mundur ke 1)
const SDQ_SEQUENCE: number[] = [
  // Juz 30
  114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78,
  // Juz 29
  67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77,
  // Juz 28
  57, 58, 59, 60, 61, 62, 63, 64, 65, 66,
  // Juz 27
  51, 52, 53, 54, 55,
  // Juz 26
  46, 47, 48, 49, 50,
  // Juz 1-25
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25
];

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

    // --- 1. KASUS SATU SURAH (Volume) ---
    if (this.normalizeSurahName(start.surah) === this.normalizeSurahName(end.surah)) {
      const totalLines = (endData.page - startData.page) * 15 + (endData.line - startData.line) + 1;
      return { 
        pages: Math.floor(totalLines / 15), 
        lines: totalLines % 15, 
        juz: endData.juz, 
        isPartial: false 
      };
    }

    // --- 2. KASUS LINTAS SURAH ---
    
    // Cari posisi Nomor Surah dalam Urutan SDQ
    const sNum = this.getSurahNum(start.surah);
    const eNum = this.getSurahNum(end.surah);

    if (sNum === null || eNum === null) {
      return { pages: 0, lines: 0, juz: 0, isPartial: true, error: "Nama surah tidak dikenali SDQ" };
    }

    const sPos = SDQ_SEQUENCE.indexOf(sNum);
    const ePos = SDQ_SEQUENCE.indexOf(eNum);

    if (sPos === -1 || ePos === -1) {
      return { pages: 0, lines: 0, juz: 0, isPartial: true, error: "Surah tidak ada di urutan SDQ" };
    }

    let totalLines = 0;

    // LOGIKA UTAMA
    // Jika Start (Masa) Muncul SEBELUM End (Tujuan) dalam Urutan SDQ -> MUNDUR (SDQ)
    // Kita AKUMULASI VOLUME (Naik Kelas)
    if (sPos <= ePos) {
      // Loop dari Start Surah sampai End Surah
      for (let i = sPos; i <= ePos; i++) {
        const surahNum = SDQ_SEQUENCE[i];
        const surahName = this.getSurahName(surahNum);
        const data = SURAH_DATA[surahName];
        
        if (data) {
          let ayatsToCount = data.totalAyat;

          // Jika Surah Pertama: Potong ayat sebelum Start
          if (i === sPos) {
            ayatsToCount -= (startData.globalIndex - data.startIdx);
          }
          
          // Jika Surah Terakhir: Potong ayat setelah End
          if (i === ePos) {
            ayatsToCount -= (data.startIdx + data.totalAyat - 1 - endData.globalIndex);
          }

          totalLines += ayatsToCount;
        }
      }
    } 
    // Jika Start Muncul SESUDAH End -> MAJU (Muraja'ah Normal)
    else {
      // Hitung Halaman Fisik
      totalLines = (endData.page - startData.page) * 15 + (endData.line - startData.line) + 1;
    }

    return { 
      pages: Math.floor(totalLines / 15), 
      lines: totalLines % 15, 
      juz: endData.juz, 
      isPartial: false 
    };
  }

  private static normalizeSurahName(name: string): string {
    // Hilangkan kutip dan spasi, lower case untuk pencarian aman
    return name.replace(/[’‘`]/g, "'").replace(/\s/g, "").trim();
  }

  private static getSurahNum(name: string): number | null {
    const normalized = this.normalizeSurahName(name);
    const data = Object.values(SURAH_DATA).find(d => d.num === parseInt(normalized.replace(/\D/g, ''))); // Coba ambil nomor
    if (!data) return null;
    return data.num; // Sebenarnya ini redundant, tapi aman
  }
  
  private static getSurahName(num: number): string {
    const data = Object.values(SURAH_DATA).find(d => d.num === num);
    return data ? Object.keys(SURAH_DATA).find(k => SURAH_DATA[k] === data) || "" : "";
  }
}
