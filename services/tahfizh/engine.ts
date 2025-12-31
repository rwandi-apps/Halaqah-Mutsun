import { AyahPointer, CalculationResult } from './types';
import { QURAN_FULL_MAP } from './quranFullData';

// --- KONFIGURASI DATA SURAH ---
// Mapping Nama Surah ke Index Pertama & Terakhir di Global QURAN_FULL_MAP
const SURAH_RANGES: Record<string, { startIdx: number, endIdx: number }> = {
  "Al-Fatihah": { startIdx: 1, endIdx: 7 },
  "Al-Baqarah": { startIdx: 8, endIdx: 286 },
  "Ali 'Imran": { startIdx: 294, endIdx: 493 },
  "An-Nisa'": { startIdx: 494, endIdx: 669 },
  "Al-Ma'idah": { startIdx: 670, endIdx: 789 },
  "Al-An'am": { startIdx: 790, endIdx: 954 },
  "Al-A'raf": { startIdx: 955, endIdx: 1223 },
  "Al-Anfal": { startIdx: 1224, endIdx: 1299 },
  "At-Taubah": { startIdx: 1300, endIdx: 1362 },
  "Yunus": { startIdx: 1363, endIdx: 1450 },
  "Hud": { startIdx: 1451, endIdx: 1536 },
  "Yusuf": { startIdx: 1537, endIdx: 1594 },
  "Ar-Ra'd": { startIdx: 1595, endIdx: 1633 },
  "Ibrahim": { startIdx: 1634, endIdx: 1695 },
  "Al-Hijr": { startIdx: 1696, endIdx: 1722 },
  "An-Nahl": { startIdx: 1723, endIdx: 1779 },
  "Al-Isra'": { startIdx: 1780, endIdx: 1825 },
  "Al-Kahf": { startIdx: 1826, endIdx: 1863 },
  "Maryam": { startIdx: 1864, endIdx: 1905 },
  "Ta Ha": { startIdx: 1906, endIdx: 1938 },
  "Al-Anbiya'": { startIdx: 1939, endIdx: 1993 },
  "Al-Hajj": { startIdx: 1994, endIdx: 2042 },
  "Al-Mu'minun": { startIdx: 2043, endIdx: 2094 },
  "An-Nur": { startIdx: 2095, endIdx: 2153 },
  "Al-Furqan": { startIdx: 2154, endIdx: 2183 },
  "Ash-Shu'ara'": { startIdx: 2184, endIdx: 2238 },
  "An-Naml": { startIdx: 2239, endIdx: 2289 },
  "Al-Qasas": { startIdx: 2290, endIdx: 2337 },
  "Al-Ankabut": { startIdx: 2338, endIdx: 2397 },
  "Ar-Rum": { startIdx: 2398, endIdx: 2456 },
  "Luqman": { startIdx: 2457, endIdx: 2490 },
  "As-Sajdah": { startIdx: 2491, endIdx: 2518 },
  "Al-Ahzab": { startIdx: 2519, endIdx: 2567 },
  "Saba'": { startIdx: 2568, endIdx: 2599 },
  "Fatir": { startIdx: 2600, endIdx: 2625 },
  "Ya Sin": { startIdx: 2626, endIdx: 2659 },
  "As-Saffat": { startIdx: 2660, endIdx: 2698 },
  "Sad": { startIdx: 2699, endIdx: 2729 },
  "Az-Zumar": { startIdx: 2730, endIdx: 2773 },
  "Ghafir": { startIdx: 2774, endIdx: 2815 },
  "Fussilat": { startIdx: 2816, endIdx: 2861 },
  "Ash-Shura": { startIdx: 2862, endIdx: 2894 },
  "Az-Zukhruf": { startIdx: 2895, endIdx: 2927 },
  "Ad-Dukhan": { startIdx: 2928, endIdx: 2943 },
  "Al-Jasiyah": { startIdx: 2944, endIdx: 2968 },
  "Al-Ahqaf": { startIdx: 2969, endIdx: 3010 },
  "Muhammad": { startIdx: 3011, endIdx: 3058 },
  "Al-Fath": { startIdx: 3059, endIdx: 3094 },
  "Al-Hujurat": { startIdx: 3095, endIdx: 3118 },
  "Qaf": { startIdx: 3119, endIdx: 3166 },
  "Adz-Dzariyat": { startIdx: 3167, endIdx: 3206 },
  "At-Tur": { startIdx: 3207, endIdx: 3247 },
  "An-Najm": { startIdx: 3248, endIdx: 3291 },
  "Al-Qamar": { startIdx: 3292, endIdx: 3340 },
  "Ar-Rahman": { startIdx: 3341, endIdx: 3396 },
  "Al-Waqi'ah": { startIdx: 3397, endIdx: 3468 },
  "Al-Hadid": { startIdx: 3469, endIdx: 3524 },
  "Al-Mujadilah": { startIdx: 3525, endIdx: 3572 },
  "Al-Hashr": { startIdx: 3573, endIdx: 3595 },
  "Al-Mumtahanah": { startIdx: 3596, endIdx: 3621 },
  "Ash-Shaf": { startIdx: 3622, endIdx: 3639 },
  "Al-Jumu'ah": { startIdx: 3640, endIdx: 3650 },
  "Al-Munafiqun": { startIdx: 3651, endIdx: 3661 },
  "At-Taghabun": { startIdx: 3662, endIdx: 3684 },
  "At-Talaq": { startIdx: 3685, endIdx: 3696 },
  "At-Tahrim": { startIdx: 3697, endIdx: 3710 },
  "Al-Mulk": { startIdx: 3711, endIdx: 3743 },
  "Al-Qalam": { startIdx: 3744, endIdx: 3787 },
  "Al-Haqqah": { startIdx: 3788, endIdx: 3839 },
  "Al-Ma'arij": { startIdx: 3840, endIdx: 3875 },
  "Nuh": { startIdx: 3876, endIdx: 3908 },
  "Al-Jinn": { startIdx: 3909, endIdx: 3931 },
  "Al-Muzzammil": { startIdx: 3932, endIdx: 3955 },
  "Al-Muddassir": { startIdx: 3956, endIdx: 4018 },
  "Al-Qiyamah": { startIdx: 4019, endIdx: 4048 },
  "Al-Insan": { startIdx: 4049, endIdx: 4078 },
  "Al-Mursalat": { startIdx: 4079, endIdx: 4115 },
  "An-Naba'": { startIdx: 4116, endIdx: 4151 },
  "An-Nazi'at": { startIdx: 4152, endIdx: 4201 },
  "Abasa": { startIdx: 4202, endIdx: 4243 },
  "At-Takwir": { startIdx: 4244, endIdx: 4284 },
  "Al-Infitar": { startIdx: 4285, endIdx: 4302 },
  "Al-Mutaffifin": { startIdx: 4303, endIdx: 4342 },
  "Al-Insyiqaq": { startIdx: 4343, endIdx: 4376 },
  "Al-Buruj": { startIdx: 4377, endIdx: 4402 },
  "Ath-Thariq": { startIdx: 4403, endIdx: 4420 },
  "Al-A'la": { startIdx: 4421, endIdx: 4434 },
  "Al-Ghashiyah": { startIdx: 4435, endIdx: 4456 },
  "Al-Fajr": { startIdx: 4457, endIdx: 4481 },
  "Al-Balad": { startIdx: 4482, endIdx: 4495 },
  "Ash-Shams": { startIdx: 4496, endIdx: 4505 },
  "Al-Lail": { startIdx: 4506, endIdx: 4518 },
  "Adh-Duha": { startIdx: 4519, endIdx: 4526 },
  "Al-Insyirah": { startIdx: 4527, endIdx: 4533 },
  "At-Tin": { startIdx: 4534, endIdx: 4539 },
  "Al-'Alaq": { startIdx: 4540, endIdx: 4555 },
  "Al-Qadr": { startIdx: 4556, endIdx: 4560 },
  "Al-Bayyinah": { startIdx: 4561, endIdx: 4572 },
  "Al-Zalzalah": { startIdx: 4573, endIdx: 4585 },
  "Al-'Adiyat": { startIdx: 4586, endIdx: 4598 },
  "Al-Qari'ah": { startIdx: 4599, endIdx: 4616 },
  "At-Takathur": { startIdx: 4617, endIdx: 4636 },
  "Al-'Ashr": { startIdx: 4637, endIdx: 4642 },
  "Al-Humazah": { startIdx: 4643, endIdx: 4650 },
  "Al-Fil": { startIdx: 4651, endIdx: 4656 },
  "Quraisy": { startIdx: 4657, endIdx: 4662 },
  "Al-Ma'un": { startIdx: 4663, endIdx: 4672 },
  "Al-Kautsar": { startIdx: 4673, endIdx: 4675 },
  "Al-Kafirun": { startIdx: 4676, endIdx: 4682 },
  "An-Nasr": { startIdx: 4683, endIdx: 4685 },
  "Al-Masad": { startIdx: 4686, endIdx: 4691 },
  "Al-Ikhlas": { startIdx: 4692, endIdx: 4695 },
  "Al-Falaq": { startIdx: 4696, endIdx: 4699 },
  "An-Nas": { startIdx: 4700, endIdx: 4706 }
};

// --- URUTAN KURIKULUM SDQ (Juz 30 mundur ke 1) ---
// Urutan berdasarkan nomor surah agar mudah diproses
const SDQ_SEQUENCE: number[] = [
  // Juz 30 (114-78)
  114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78,
  // Juz 29 (67-77)
  67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77,
  // Juz 28 (57-66)
  57, 58, 59, 60, 61, 62, 63, 64, 65, 66,
  // Juz 27 (51-55)
  51, 52, 53, 54, 55,
  // Juz 26 (46-50)
  46, 47, 48, 49, 50,
  // Juz 1-25 (1-25)
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

    // Urutkan input agar selalu dari kecil ke besar (secara logika)
    if (startData.globalIndex > endData.globalIndex) {
      const temp = startData;
      startData = endData;
      endData = temp;
    }

    // 1. KASUS PENTING: SATU SURAH (Setoran Lanjut)
    const isSameSurah = this.normalizeSurahName(start.surah) === this.normalizeSurahName(end.surah);
    if (isSameSurah) {
      const totalLines = (endData.page - startData.page) * 15 + (endData.line - startData.line) + 1;
      return { 
        pages: Math.floor(totalLines / 15), 
        lines: totalLines % 15, 
        juz: endData.juz, 
        isPartial: false 
      };
    }

    // 2. KASUS LINTAS SURAH (Muraja'ah / SDQ)
    // Cari index urutan SDQ berdasarkan Nama Surah (Perlu mapping nama ke No Surah atau menggunakan logic manual)
    // Kita gunakan mapping manual sederhana untuk keamanan
    const surahToNum: { [key: string]: number } = {
      "Al-Fatihah": 1, "Al-Baqarah": 2, "Ali 'Imran": 3, "An-Nisa'": 4, "Al-Ma'idah": 5, "Al-An'am": 6,
      "Al-A'raf": 7, "Al-Anfal": 8, "At-Taubah": 9, "Yunus": 10, "Hud": 11, "Yusuf": 12,
      "Ar-Ra'd": 13, "Ibrahim": 14, "Al-Hijr": 15, "An-Nahl": 16, "Al-Isra'": 17, "Al-Kahf": 18,
      "Maryam": 19, "Ta Ha": 20, "Al-Anbiya'": 21, "Al-Hajj": 22, "Al-Mu'minun": 23, "An-Nur": 24,
      "Al-Furqan": 25, "Ash-Shu'ara'": 26, "An-Naml": 27, "Al-Qasas": 28, "Al-Ankabut": 29, "Ar-Rum": 30,
      "Luqman": 31, "As-Sajdah": 32, "Al-Ahzab": 33, "Saba'": 34, "Fatir": 35, "Ya Sin": 36,
      "As-Saffat": 37, "Sad": 38, "Az-Zumar": 39, "Ghafir": 40, "Fussilat": 41, "Ash-Shura": 42,
      "Az-Zukhruf": 43, "Ad-Dukhan": 44, "Al-Jasiyah": 45, "Al-Ahqaf": 46, "Muhammad": 47,
      "Al-Fath": 48, "Al-Hujurat": 49, "Qaf": 50, "Adz-Dzariyat": 51, "At-Tur": 52, "An-Najm": 53,
      "Al-Qamar": 54, "Ar-Rahman": 55, "Al-Waqi'ah": 56, "Al-Hadid": 57, "Al-Mujadilah": 58,
      "Al-Hashr": 59, "Al-Mumtahanah": 60, "Ash-Shaf": 61, "Al-Jumu'ah": 62, "Al-Munafiqun": 63,
      "At-Taghabun": 64, "At-Talaq": 65, "At-Tahrim": 66, "Al-Mulk": 67, "Al-Qalam": 68,
      "Al-Haqqah": 69, "Al-Ma'arij": 70, "Nuh": 71, "Al-Jinn": 72, "Al-Muzzammil": 73,
      "Al-Muddassir": 74, "Al-Qiyamah": 75, "Al-Insan": 76, "Al-Mursalat": 77, "An-Naba'": 78,
      "An-Nazi'at": 79, "Abasa": 80, "At-Takwir": 81, "Al-Infitar": 82, "Al-Mutaffifin": 83,
      "Al-Insyiqaq": 84, "Al-Buruj": 85, "Ath-Thariq": 86, "Al-A'la": 87, "Al-Ghashiyah": 88,
      "Al-Fajr": 89, "Al-Balad": 90, "Ash-Shams": 91, "Al-Lail": 92, "Adh-Duha": 93, "Al-Insyirah": 94,
      "At-Tin": 95, "Al-'Alaq": 96, "Al-Qadr": 97, "Al-Bayyinah": 98, "Al-Zalzalah": 99,
      "Al-'Adiyat": 100, "Al-Qari'ah": 101, "At-Takathur": 102, "Al-'Ashr": 103, "Al-Humazah": 104,
      "Al-Fil": 105, "Quraisy": 106, "Al-Ma'un": 107, "Al-Kautsar": 108, "Al-Kafirun": 109, "An-Nasr": 110,
      "Al-Masad": 111, "Al-Ikhlas": 112, "Al-Falaq": 113, "An-Nas": 114
    };

    const startSurahNum = surahToNum[this.normalizeSurahName(start.surah)];
    const endSurahNum = surahToNum[this.normalizeSurahName(end.surah)];

    // Cari posisi dalam urutan SDQ
    const startIndex = SDQ_SEQUENCE.indexOf(startSurahNum);
    const endIndex = SDQ_SEQUENCE.indexOf(endSurahNum);

    if (startIndex === -1 || endIndex === -1) {
      return { pages: 0, lines: 0, juz: 0, isPartial: true, error: "Nama surah tidak dikenali SDQ" };
    }

    let totalLines = 0;

    // Jika Start terletak sebelum End dalam urutan SDQ (Linear Forward)
    if (startIndex <= endIndex) {
      // LOOP AKUMULASI SURAH (Mulai dari Start Sampai End)
      for (let i = startIndex; i <= endIndex; i++) {
        const surahNum = SDQ_SEQUENCE[i];
        const range = Object.values(SURAH_RANGES).find(r => r.endIdx === SURAH_RANGES[`Surah ${surahNum}`]?.endIdx); // Hacky finder
        
        // Cari range yang tepat berdasarkan Nomor Surah (Lebih aman mencari di Object Keys)
        const surahKey = Object.keys(SURAH_RANGES).find(k => k.includes(surahNum.toString()));
        if (!surahKey) continue;
        const rangeData = SURAH_RANGES[surahKey];

        // Hitung Volume Surah
        let sIdx: number;
        let eIdx: number;

        if (i === startIndex) {
          // Surah Pertama: Dari Ayat Start sampai Terakhir
          sIdx = startData.globalIndex;
          eIdx = rangeData.endIdx;
        } else if (i === endIndex) {
          // Surah Terakhir: Dari Ayat 1 sampai Ayat End
          // Cari data ayat 1
          const firstAyahKey = `${this.normalizeSurahName(end.surah)}:1`;
          const firstData = QURAN_FULL_MAP[firstAyahKey];
          sIdx = firstData ? firstData.globalIndex : rangeData.startIdx;
          eIdx = endData.globalIndex;
        } else {
          // Surah Tengah: Full Surah
          sIdx = rangeData.startIdx;
          eIdx = rangeData.endIdx;
        }

        if (sIdx && eIdx) {
           // Ambil koordinat start dan end untuk hitung halaman
           // Perlu mapping globalIndex kembali ke Page/Line. 
           // Untuk efisiensi, kita asumsikan globalIndex berurutan naik.
           // Namun QURAN_FULL_MAP diakses by Key string.
           // Kita ambil data 'dummy' untuk Page/Line start/end atau cari Key.
           
           // Cara paling cepat: Kita ambil data GlobalIndex Start dan End.
           // Kita ambil Page Start dan Page End dari data yang ada.
           
           const startObj = Object.values(QURAN_FULL_MAP).find(d => d.globalIndex === sIdx);
           const endObj = Object.values(QURAN_FULL_MAP).find(d => d.globalIndex === eIdx);
           
           if (startObj && endObj) {
             totalLines += (endObj.page - startObj.page) * 15 + (endObj.line - startObj.line) + 1;
           }
        }
      }
    } else {
      // Input terbalik / mundur dalam urutan SDQ
      // Fallback ke logika Touched Pages atau Error
      const touchedPages = endData.page - startData.page + 1;
      totalLines = touchedPages * 15;
    }

    return { 
      pages: Math.floor(totalLines / 15), 
      lines: totalLines % 15, 
      juz: endData.juz, 
      isPartial: false 
    };
  }

  private static normalizeSurahName(name: string): string {
    return name.replace(/[’‘`]/g, "'").trim();
  }
}
