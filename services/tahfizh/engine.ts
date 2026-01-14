import { QURAN_METADATA } from './quranData';
import { QURAN_FULL_MAP } from './quranFullData';
import { QuranAyahData } from './types';

export interface SDQCalculationResult {
  valid: boolean;
  pages: number;
  lines: number;
  totalLines: number;
  isIqra: boolean;
  reason: string;
}

// Urutan Linear Kurikulum SDQ
const SDQ_CURRICULUM_ORDER = [
  // Juz 30
  "An-Naba'", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infitar", "Al-Muthaffifin", "Al-Insyiqaq", "Al-Buruj", "Ath-Thariq", "Al-A'la", "Al-Ghasyiyah", "Al-Fajr", "Al-Balad", "Asy-Syams", "Al-Lail", "Ad-Duha", "Al-Insyirah", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat", "Al-Qari'ah", "At-Takatsur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraisy", "Al-Ma'un", "Al-Kautsar", "Al-Kafirun", "An-Nasr", "Al-Lahab", "Al-Ikhlas", "Al-Falaq", "An-Nas",
  // Juz 29
  "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddassir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat",
  // Juz 28
  "Al-Mujadilah", "Al-Hasyr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim",
  // Juz 27 & 26 (Special handling Adz-Dzariyat di kode engine)
  "Adz-Dzariyat_31_60", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid",
  "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adz-Dzariyat_1_30",
  // 1 - 25 Linear
  "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Taubah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra'", "Al-Kahf", "Maryam", "Ta-Ha", "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Asy-Syu'ara'", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir", "Fussilat", "Asy-Syura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jasiyah"
];

export class SDQQuranEngine {
  private static readonly LINES_PER_PAGE = 15;

  private static normalizeSurahName(name: string): string {
    if (!name) return "";
    const clean = name.toLowerCase().trim().replace(/['`’‘]/g, "'").replace(/\s+/g, " ");
    const keys = Object.keys(QURAN_METADATA);
    const exact = keys.find(k => k.toLowerCase() === clean);
    if (exact) return exact;
    const fuzzyClean = clean.replace(/[^a-z0-9]/g, "");
    return keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, "") === fuzzyClean) || "";
  }

  private static getAyahAbsoluteLine(surahRaw: string, ayahNum: number): number {
    const surahName = this.normalizeSurahName(surahRaw);
    if (!surahName) return 0;

    let lookupName = surahName;
    if (surahName === "Adz-Dzariyat") {
        lookupName = ayahNum <= 30 ? "Adz-Dzariyat_1_30" : "Adz-Dzariyat_31_60";
    }

    const currentIndex = SDQ_CURRICULUM_ORDER.indexOf(lookupName);
    if (currentIndex === -1) return 0;

    let totalLinesAccumulated = 0;

    // 1. Hitung baris penuh bagi semua surat SEBELUMNYA dalam kurikulum
    for (let i = 0; i < currentIndex; i++) {
        const sName = SDQ_CURRICULUM_ORDER[i];
        const realName = sName.split('_')[0];
        
        // Ambil data baris awal dan akhir surat tersebut dari QURAN_FULL_MAP
        const meta = QURAN_METADATA[realName];
        if (meta) {
            // Kita ambil baris pertama dan terakhir surat tersebut
            const startKey = `${realName}:1`;
            const endKey = `${realName}:${meta.totalAyah}`;
            
            const startData = QURAN_FULL_MAP[startKey];
            const endData = QURAN_FULL_MAP[endKey];

            if (startData && endData) {
                // RUMUS PENTING: (HalamanAkhir - HalamanAwal) * 15 + (BarisAkhir - BarisAwal + 1)
                const linesInThisSurah = ((endData.page - startData.page) * 15) + (endData.line - startData.line + 1);
                totalLinesAccumulated += linesInThisSurah;
            } else {
                // Fallback jika data MAP tidak lengkap (estimasi kasar)
                totalLinesAccumulated += (meta.endPage - meta.startPage) * 15 + 5; 
            }
        }
    }

    // 2. Tambah baris dalam surat SEMASA (dari ayat 1 hingga ayat yang diinput)
    const currentSurahStartKey = `${surahName}:1`;
    const currentAyahKey = `${surahName}:${ayahNum}`;
    
    const startData = QURAN_FULL_MAP[currentSurahStartKey];
    const ayahData = QURAN_FULL_MAP[currentAyahKey];

    if (startData && ayahData) {
        const linesInCurrentSurah = ((ayahData.page - startData.page) * 15) + (ayahData.line - startData.line + 1);
        return totalLinesAccumulated + linesInCurrentSurah;
    }

    return totalLinesAccumulated;
}

  public static calculate(fs: string, fa: number, ts: string, ta: number): SDQCalculationResult {
    const isIqra = fs.toLowerCase().includes("iqra") || ts.toLowerCase().includes("iqra");

    if (isIqra) {
      const jStart = parseInt(fs.match(/\d+/)?.[0] || "1");
      const jEnd = parseInt(ts.match(/\d+/)?.[0] || jStart.toString());
      let totalHal = (jStart === jEnd) ? (ta - fa + 1) : (((jEnd - jStart) * 30) + ta - fa);
      return { valid: true, pages: Math.max(0, totalHal), lines: 0, totalLines: 0, isIqra: true, reason: "" };
    }

    const startAbs = this.getAyahAbsoluteLine(fs, fa);
    const endAbs = this.getAyahAbsoluteLine(ts, ta);

    if (startAbs === 0 || endAbs === 0) {
      return { valid: false, pages: 0, lines: 0, totalLines: 0, isIqra: false, reason: "Data tidak ditemukan" };
    }

    const totalLines = Math.abs(endAbs - startAbs) + 1;

    return {
      valid: true,
      totalLines,
      pages: Math.floor(totalLines / this.LINES_PER_PAGE),
      lines: totalLines % this.LINES_PER_PAGE,
      isIqra: false,
      reason: ""
    };
  }

  public static parseAndCalculate(rangeStr: string): SDQCalculationResult {
    const empty = { valid: false, pages: 0, lines: 0, totalLines: 0, isIqra: false, reason: "" };
    if (!rangeStr || rangeStr === "-" || rangeStr === "Belum Ada") return { ...empty, valid: true };

    try {
      const parts = rangeStr.split(/\s*[-–]\s*/);
      const parse = (s: string) => {
        const m = s.match(/^(.*?)\s*[:]\s*(\d+)$/);
        return m ? { s: m[1].trim(), a: parseInt(m[2]) } : null;
      };

      const start = parse(parts[0]);
      if (!start) return empty;

      let endSurah = start.s, endAyah = start.a;
      if (parts[1]) {
        if (/^\d+$/.test(parts[1].trim())) {
          endAyah = parseInt(parts[1].trim());
        } else {
          const end = parse(parts[1]);
          if (end) { endSurah = end.s; endAyah = end.a; }
        }
      }
      return this.calculate(start.s, start.a, endSurah, endAyah);
    } catch { return empty; }
  }
}
