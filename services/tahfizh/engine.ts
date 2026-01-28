
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

  for (let i = 0; i < currentIndex; i++) {
    const sName = SDQ_CURRICULUM_ORDER[i];
    const realName = sName.split('_')[0];
    const meta = QURAN_METADATA[realName];

    if (meta) {
      const startData = QURAN_FULL_MAP[`${realName}:1`];
      const endData = QURAN_FULL_MAP[`${realName}:${meta.totalAyah}`];

      if (startData && endData) {
        // 1. Hitung baris murni di dalam surat tersebut
        const linesInSurah = ((endData.page - startData.page) * this.LINES_PER_PAGE) + (endData.line - startData.line + 1);
        totalLinesAccumulated += linesInSurah;

        // 2. Cek jarak ke surat berikutnya dalam kurikulum
        const nextSName = SDQ_CURRICULUM_ORDER[i + 1];
        if (nextSName) {
          const nextRealName = nextSName.split('_')[0];
          const nextStartData = QURAN_FULL_MAP[`${nextRealName}:1`];

          if (nextStartData) {
            if (nextStartData.page === endData.page) {
              // Jika surat berikutnya di HALAMAN YANG SAMA, hitung selisih barisnya (termasuk judul/bismillah)
              const gap = nextStartData.line - endData.line - 1;
              totalLinesAccumulated += Math.max(0, gap);
            } else {
              // Jika surat berikutnya di HALAMAN BERBEDA
              // Selesaikan sisa baris di halaman saat ini agar genap 15, 
              // lalu jika loncat halaman jauh (seperti An-Nas ke Al-Mulk), jangan tambahkan selisih ribuan baris,
              // cukup anggap itu halaman baru.
              const remainingLinesOnPage = this.LINES_PER_PAGE - endData.line;
              totalLinesAccumulated += remainingLinesOnPage;
            }
          }
        }
      }
    }
  }

  // 3. Tambahkan baris di surat terakhir (target)
  const currentStartData = QURAN_FULL_MAP[`${surahName}:1`];
  const targetAyahData = QURAN_FULL_MAP[`${surahName}:${ayahNum}`];

  if (currentStartData && targetAyahData) {
    const linesInCurrent = ((targetAyahData.page - currentStartData.page) * this.LINES_PER_PAGE) + (targetAyahData.line - currentStartData.line + 1);
    return totalLinesAccumulated + linesInCurrent;
  }

  return totalLinesAccumulated;
}

 public static calculate(fs: string, fa: number, ts: string, ta: number): SDQCalculationResult {
  // 1. LOGIKA IQRA (DIPERBAIKI)
  // Menggunakan regex /iqra/i agar mau Iqra atau Iqra' tetap terbaca
  const isIqra = /iqra/i.test(fs) || /iqra/i.test(ts);

  if (isIqra) {
    // Fungsi pembantu mengambil angka jilid (misal "Iqra' 2" -> 2)
    const extractJilid = (str: string) => parseInt(str.replace(/\D/g, "") || "1");
    const jStart = extractJilid(fs);
    const jEnd = extractJilid(ts);

    // fa dan ta adalah halaman dalam Iqra
    let totalHal = (jStart === jEnd) 
      ? (ta - fa + 1) 
      : (((jEnd - jStart) * 30) + ta - fa);

    return { 
      valid: true, 
      pages: Math.max(0, totalHal), 
      lines: 0, 
      totalLines: 0, 
      isIqra: true, 
      reason: "" 
    };
  }

  // 2. LOGIKA AL-QURAN
  const startAbs = this.getAyahAbsoluteLine(fs, fa);
  const endAbs = this.getAyahAbsoluteLine(ts, ta);

  if (startAbs === 0 || endAbs === 0) {
    return { 
      valid: false, 
      pages: 0, 
      lines: 0, 
      totalLines: 0, 
      isIqra: false, 
      reason: "Data tidak ditemukan" 
    };
  }

  // Menghitung selisih garis berdasarkan urutan kurikulum
  const totalLines = endAbs - startAbs + 1;

  if (totalLines <= 0) {
    return { 
      valid: false, 
      pages: 0, 
      lines: 0, 
      totalLines: 0, 
      isIqra: false, 
      reason: "Urutan surat terbalik atau tidak sesuai kurikulum" 
    };
  }

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

