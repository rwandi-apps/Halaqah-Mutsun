/**
 * SDQ QURAN CALCULATION ENGINE - FINAL PRODUCTION VERSION
 * Architecture: Senior System Architect Standard
 * 
 * Logic:
 * 1. Urutan Juz Khas SDQ: 30, 29, 28, 27, 26, 1, 2, ..., 25
 * 2. Mushaf Madinah Standard: 15 Baris / Halaman, 20 Halaman / Juz (rata-rata)
 * 3. Zero-Undefined Policy: Semua return value dijamin aman untuk Firestore
 * 4. Defensive Parsing: Menangani typo, format pendek, dan data legacy tanpa crash
 */

// ==========================================
// 1. DATA CONSTANTS (Self-Contained)
// ==========================================

interface SurahMeta {
  name: string;
  totalAyah: number;
  startPage: number;
  endPage: number;
}

const QURAN_METADATA: Record<string, SurahMeta> = {
  "Al-Fatihah": { name: "Al-Fatihah", totalAyah: 7, startPage: 1, endPage: 1 },
  "Al-Baqarah": { name: "Al-Baqarah", totalAyah: 286, startPage: 2, endPage: 49 },
  "Ali 'Imran": { name: "Ali 'Imran", totalAyah: 200, startPage: 50, endPage: 76 },
  "An-Nisa'": { name: "An-Nisa'", totalAyah: 176, startPage: 77, endPage: 106 },
  "Al-Ma'idah": { name: "Al-Ma'idah", totalAyah: 120, startPage: 106, endPage: 127 },
  "Al-An'am": { name: "Al-An'am", totalAyah: 165, startPage: 128, endPage: 150 },
  "Al-A'raf": { name: "Al-A'raf", totalAyah: 206, startPage: 151, endPage: 176 },
  "Al-Anfal": { name: "Al-Anfal", totalAyah: 75, startPage: 177, endPage: 186 },
  "At-Taubah": { name: "At-Taubah", totalAyah: 129, startPage: 187, endPage: 207 },
  "Yunus": { name: "Yunus", totalAyah: 109, startPage: 208, endPage: 221 },
  "Hud": { name: "Hud", totalAyah: 123, startPage: 221, endPage: 235 },
  "Yusuf": { name: "Yusuf", totalAyah: 111, startPage: 235, endPage: 248 },
  "Ar-Ra'd": { name: "Ar-Ra'd", totalAyah: 43, startPage: 249, endPage: 255 },
  "Ibrahim": { name: "Ibrahim", totalAyah: 52, startPage: 255, endPage: 261 },
  "Al-Hijr": { name: "Al-Hijr", totalAyah: 99, startPage: 262, endPage: 267 },
  "An-Nahl": { name: "An-Nahl", totalAyah: 128, startPage: 267, endPage: 281 },
  "Al-Isra'": { name: "Al-Isra'", totalAyah: 111, startPage: 282, endPage: 293 },
  "Al-Kahf": { name: "Al-Kahf", totalAyah: 110, startPage: 293, endPage: 304 },
  "Maryam": { name: "Maryam", totalAyah: 98, startPage: 305, endPage: 312 },
  "Ta-Ha": { name: "Ta-Ha", totalAyah: 135, startPage: 312, endPage: 321 },
  "Al-Anbiya'": { name: "Al-Anbiya'", totalAyah: 112, startPage: 322, endPage: 331 },
  "Al-Hajj": { name: "Al-Hajj", totalAyah: 78, startPage: 332, endPage: 341 },
  "Al-Mu'minun": { name: "Al-Mu'minun", totalAyah: 118, startPage: 342, endPage: 349 },
  "An-Nur": { name: "An-Nur", totalAyah: 64, startPage: 350, endPage: 359 },
  "Al-Furqan": { name: "Al-Furqan", totalAyah: 77, startPage: 359, endPage: 366 },
  "Asy-Syu'ara'": { name: "Asy-Syu'ara'", totalAyah: 227, startPage: 367, endPage: 376 },
  "An-Naml": { name: "An-Naml", totalAyah: 93, startPage: 377, endPage: 385 },
  "Al-Qasas": { name: "Al-Qasas", totalAyah: 88, startPage: 385, endPage: 396 },
  "Al-'Ankabut": { name: "Al-'Ankabut", totalAyah: 69, startPage: 396, endPage: 404 },
  "Ar-Rum": { name: "Ar-Rum", totalAyah: 60, startPage: 404, endPage: 410 },
  "Luqman": { name: "Luqman", totalAyah: 34, startPage: 411, endPage: 414 },
  "As-Sajdah": { name: "As-Sajdah", totalAyah: 30, startPage: 415, endPage: 417 },
  "Al-Ahzab": { name: "Al-Ahzab", totalAyah: 73, startPage: 418, endPage: 427 },
  "Saba'": { name: "Saba'", totalAyah: 54, startPage: 428, endPage: 434 },
  "Fatir": { name: "Fatir", totalAyah: 45, startPage: 434, endPage: 440 },
  "Ya-Sin": { name: "Ya-Sin", totalAyah: 83, startPage: 440, endPage: 445 },
  "As-Saffat": { name: "As-Saffat", totalAyah: 182, startPage: 446, endPage: 452 },
  "Sad": { name: "Sad", totalAyah: 88, startPage: 453, endPage: 458 },
  "Az-Zumar": { name: "Az-Zumar", totalAyah: 75, startPage: 458, endPage: 467 },
  "Ghafir": { name: "Ghafir", totalAyah: 85, startPage: 467, endPage: 476 },
  "Fussilat": { name: "Fussilat", totalAyah: 54, startPage: 477, endPage: 482 },
  "Asy-Syura": { name: "Asy-Syura", totalAyah: 53, startPage: 483, endPage: 489 },
  "Az-Zukhruf": { name: "Az-Zukhruf", totalAyah: 89, startPage: 489, endPage: 495 },
  "Ad-Dukhan": { name: "Ad-Dukhan", totalAyah: 59, startPage: 496, endPage: 498 },
  "Al-Jasiyah": { name: "Al-Jasiyah", totalAyah: 37, startPage: 499, endPage: 502 },
  "Al-Ahqaf": { name: "Al-Ahqaf", totalAyah: 35, startPage: 502, endPage: 506 },
  "Muhammad": { name: "Muhammad", totalAyah: 38, startPage: 507, endPage: 510 },
  "Al-Fath": { name: "Al-Fath", totalAyah: 29, startPage: 511, endPage: 515 },
  "Al-Hujurat": { name: "Al-Hujurat", totalAyah: 18, startPage: 515, endPage: 517 },
  "Qaf": { name: "Qaf", totalAyah: 45, startPage: 518, endPage: 520 },
  "Adz-Dzariyat": { name: "Adz-Dzariyat", totalAyah: 60, startPage: 520, endPage: 523 },
  "At-Tur": { name: "At-Tur", totalAyah: 49, startPage: 523, endPage: 525 },
  "An-Najm": { name: "An-Najm", totalAyah: 62, startPage: 526, endPage: 528 },
  "Al-Qamar": { name: "Al-Qamar", totalAyah: 55, startPage: 528, endPage: 531 },
  "Ar-Rahman": { name: "Ar-Rahman", totalAyah: 78, startPage: 531, endPage: 534 },
  "Al-Waqi'ah": { name: "Al-Waqi'ah", totalAyah: 96, startPage: 534, endPage: 537 },
  "Al-Hadid": { name: "Al-Hadid", totalAyah: 29, startPage: 537, endPage: 541 },
  "Al-Mujadilah": { name: "Al-Mujadilah", totalAyah: 22, startPage: 542, endPage: 545 },
  "Al-Hasyr": { name: "Al-Hasyr", totalAyah: 24, startPage: 545, endPage: 548 },
  "Al-Mumtahanah": { name: "Al-Mumtahanah", totalAyah: 13, startPage: 549, endPage: 551 },
  "As-Saff": { name: "As-Saff", totalAyah: 14, startPage: 551, endPage: 552 },
  "Al-Jumu'ah": { name: "Al-Jumu'ah", totalAyah: 11, startPage: 553, endPage: 554 },
  "Al-Munafiqun": { name: "Al-Munafiqun", totalAyah: 11, startPage: 554, endPage: 555 },
  "At-Taghabun": { name: "At-Taghabun", totalAyah: 18, startPage: 556, endPage: 557 },
  "At-Talaq": { name: "At-Talaq", totalAyah: 12, startPage: 558, endPage: 559 },
  "At-Tahrim": { name: "At-Tahrim", totalAyah: 12, startPage: 560, endPage: 561 },
  "Al-Mulk": { name: "Al-Mulk", totalAyah: 30, startPage: 562, endPage: 564 },
  "Al-Qalam": { name: "Al-Qalam", totalAyah: 52, startPage: 564, endPage: 566 },
  "Al-Haqqah": { name: "Al-Haqqah", totalAyah: 52, startPage: 567, endPage: 568 },
  "Al-Ma'arij": { name: "Al-Ma'arij", totalAyah: 44, startPage: 568, endPage: 570 },
  "Nuh": { name: "Nuh", totalAyah: 28, startPage: 570, endPage: 571 },
  "Al-Jinn": { name: "Al-Jinn", totalAyah: 28, startPage: 572, endPage: 573 },
  "Al-Muzzammil": { name: "Al-Muzzammil", totalAyah: 20, startPage: 574, endPage: 575 },
  "Al-Muddassir": { name: "Al-Muddassir", totalAyah: 56, startPage: 575, endPage: 577 },
  "Al-Qiyamah": { name: "Al-Qiyamah", totalAyah: 40, startPage: 577, endPage: 578 },
  "Al-Insan": { name: "Al-Insan", totalAyah: 31, startPage: 578, endPage: 580 },
  "Al-Mursalat": { name: "Al-Mursalat", totalAyah: 50, startPage: 580, endPage: 581 },
  "An-Naba'": { name: "An-Naba'", totalAyah: 40, startPage: 582, endPage: 583 },
  "An-Nazi'at": { name: "An-Nazi'at", totalAyah: 46, startPage: 583, endPage: 584 },
  "'Abasa": { name: "'Abasa", totalAyah: 42, startPage: 585, endPage: 585 },
  "At-Takwir": { name: "At-Takwir", totalAyah: 29, startPage: 586, endPage: 586 },
  "Al-Infitar": { name: "Al-Infitar", totalAyah: 19, startPage: 587, endPage: 587 },
  "Al-Muthaffifin": { name: "Al-Muthaffifin", totalAyah: 36, startPage: 587, endPage: 589 },
  "Al-Insyiqaq": { name: "Al-Insyiqaq", totalAyah: 25, startPage: 589, endPage: 590 },
  "Al-Buruj": { name: "Al-Buruj", totalAyah: 22, startPage: 590, endPage: 591 },
  "Ath-Thariq": { name: "Ath-Thariq", totalAyah: 17, startPage: 591, endPage: 592 },
  "Al-A'la": { name: "Al-A'la", totalAyah: 19, startPage: 592, endPage: 592 },
  "Al-Ghasyiyah": { name: "Al-Ghasyiyah", totalAyah: 26, startPage: 592, endPage: 593 },
  "Al-Fajr": { name: "Al-Fajr", totalAyah: 30, startPage: 593, endPage: 594 },
  "Al-Balad": { name: "Al-Balad", totalAyah: 20, startPage: 594, endPage: 595 },
  "Asy-Syams": { name: "Asy-Syams", totalAyah: 15, startPage: 595, endPage: 595 },
  "Al-Lail": { name: "Al-Lail", totalAyah: 21, startPage: 595, endPage: 596 },
  "Ad-Duha": { name: "Ad-Duha", totalAyah: 11, startPage: 596, endPage: 596 },
  "Al-Insyirah": { name: "Al-Insyirah", totalAyah: 8, startPage: 596, endPage: 596 },
  "At-Tin": { name: "At-Tin", totalAyah: 8, startPage: 597, endPage: 597 },
  "Al-'Alaq": { name: "Al-'Alaq", totalAyah: 19, startPage: 597, endPage: 597 },
  "Al-Qadr": { name: "Al-Qadr", totalAyah: 5, startPage: 598, endPage: 598 },
  "Al-Bayyinah": { name: "Al-Bayyinah", totalAyah: 8, startPage: 598, endPage: 599 },
  "Az-Zalzalah": { name: "Az-Zalzalah", totalAyah: 8, startPage: 599, endPage: 599 },
  "Al-'Adiyat": { name: "Al-'Adiyat", totalAyah: 11, startPage: 599, endPage: 600 },
  "Al-Qari'ah": { name: "Al-Qari'ah", totalAyah: 11, startPage: 600, endPage: 600 },
  "At-Takatsur": { name: "At-Takatsur", totalAyah: 8, startPage: 600, endPage: 600 },
  "Al-'Asr": { name: "Al-'Asr", totalAyah: 3, startPage: 601, endPage: 601 },
  "Al-Humazah": { name: "Al-Humazah", totalAyah: 9, startPage: 601, endPage: 601 },
  "Al-Fil": { name: "Al-Fil", totalAyah: 5, startPage: 601, endPage: 601 },
  "Quraisy": { name: "Quraisy", totalAyah: 4, startPage: 602, endPage: 602 },
  "Al-Ma'un": { name: "Al-Ma'un", totalAyah: 7, startPage: 602, endPage: 602 },
  "Al-Kautsar": { name: "Al-Kautsar", totalAyah: 3, startPage: 602, endPage: 602 },
  "Al-Kafirun": { name: "Al-Kafirun", totalAyah: 6, startPage: 603, endPage: 603 },
  "An-Nasr": { name: "An-Nasr", totalAyah: 3, startPage: 603, endPage: 603 },
  "Al-Lahab": { name: "Al-Lahab", totalAyah: 5, startPage: 603, endPage: 603 },
  "Al-Ikhlas": { name: "Al-Ikhlas", totalAyah: 4, startPage: 604, endPage: 604 },
  "Al-Falaq": { name: "Al-Falaq", totalAyah: 5, startPage: 604, endPage: 604 },
  "An-Nas": { name: "An-Nas", totalAyah: 6, startPage: 604, endPage: 604 }
};

const SDQ_JUZ_ORDER = [
  30, 29, 28, 27, 26, 
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
  21, 22, 23, 24, 25
];

const JUZ_PAGE_LIMITS: Record<number, { start: number; end: number }> = {
  1: { start: 1, end: 21 },
  2: { start: 22, end: 41 },
  3: { start: 42, end: 61 },
  4: { start: 62, end: 81 },
  5: { start: 82, end: 101 },
  6: { start: 102, end: 121 },
  7: { start: 122, end: 141 },
  8: { start: 142, end: 161 },
  9: { start: 162, end: 181 },
  10: { start: 182, end: 201 },
  11: { start: 202, end: 221 },
  12: { start: 222, end: 241 },
  13: { start: 242, end: 261 },
  14: { start: 262, end: 281 },
  15: { start: 282, end: 301 },
  16: { start: 302, end: 321 },
  17: { start: 322, end: 341 },
  18: { start: 342, end: 361 },
  19: { start: 362, end: 381 },
  20: { start: 382, end: 401 },
  21: { start: 402, end: 421 },
  22: { start: 422, end: 441 },
  23: { start: 442, end: 461 },
  24: { start: 462, end: 481 },
  25: { start: 482, end: 501 },
  26: { start: 502, end: 521 },
  27: { start: 522, end: 541 },
  28: { start: 542, end: 561 },
  29: { start: 562, end: 581 },
  30: { start: 582, end: 604 }
};

// ==========================================
// 2. TYPES & INTERFACES
// ==========================================

export interface SDQCalculationResult {
  valid: boolean;
  pages: number;
  lines: number;
  totalLines: number;
  reason: string;
}

interface AyahCoordinate {
  juz: number;
  page: number;
  line: number;
}

// ==========================================
// 3. ENGINE CLASS
// ==========================================

export class SDQQuranEngine {
  private static readonly LINES_PER_PAGE = 15;
  private static readonly INDEX_MAP: Record<number, number> = SDQ_JUZ_ORDER.reduce(
    (acc, juz, idx) => ({ ...acc, [juz]: idx }), {}
  );

  /**
   * Normalisasi Nama Surah (Production Standard)
   */
  private static normalizeSurah(input: string): string {
    if (!input) return "";
    let clean = input.toLowerCase().trim()
      .replace(/['`’‘]/g, "'") // Standardize apostrophe
      .replace(/\s*-\s*/g, "-") // Standardize hyphen spaces
      .replace(/\bal\s+/g, "al-") // Standardize prefix
      .replace(/^amma$/, "an-naba'")
      .replace(/^yasin$/, "ya-sin");

    // Exact Match Search
    const keys = Object.keys(QURAN_METADATA);
    const match = keys.find(k => k.toLowerCase() === clean || k.toLowerCase().replace(/['\s-]/g, "") === clean.replace(/['\s-]/g, ""));
    return match || "";
  }

  /**
   * Mendapatkan Koordinat Fisik (Defensive estimation)
   */
  private static getCoordinates(surahRaw: string, ayahInput: number): AyahCoordinate | null {
    const surahName = this.normalizeSurah(surahRaw);
    const meta = QURAN_METADATA[surahName];
    
    if (!meta) return null;
    
    const ayah = Math.max(1, Math.min(ayahInput, meta.totalAyah));
    const totalPages = meta.endPage - meta.startPage + 1;
    
    // Proportional Estimation (Safe Fallback)
    const progress = (ayah - 1) / meta.totalAyah;
    const estimatedGlobalPage = meta.startPage + Math.floor(progress * totalPages);
    const estimatedLine = Math.floor(((progress * totalPages) % 1) * this.LINES_PER_PAGE) + 1;

    // Find Juz
    let juz = 30;
    for (const [jStr, limit] of Object.entries(JUZ_PAGE_LIMITS)) {
      if (estimatedGlobalPage >= limit.start && estimatedGlobalPage <= limit.end) {
        juz = parseInt(jStr);
        break;
      }
    }

    return {
      juz,
      page: estimatedGlobalPage,
      line: Math.max(1, Math.min(15, estimatedLine))
    };
  }

  /**
   * Posisi Absolut Baris dalam Juz Fisik (0-based)
   */
  private static getAbsLineInJuz(page: number, line: number, juz: number): number {
    const limit = JUZ_PAGE_LIMITS[juz];
    if (!limit) return 0;
    return ((page - limit.start) * this.LINES_PER_PAGE) + line;
  }

  /**
   * Kapasitas Baris satu Juz
   */
  private static getJuzCapacity(juz: number): number {
    const limit = JUZ_PAGE_LIMITS[juz];
    if (!limit) return 0;
    return (limit.end - limit.start + 1) * this.LINES_PER_PAGE;
  }

  /**
   * CORE CALCULATION LOGIC
   */
  public static calculate(fs: string, fa: number, ts: string, ta: number): SDQCalculationResult {
    const res: SDQCalculationResult = { valid: false, pages: 0, lines: 0, totalLines: 0, reason: "" };

    try {
      const start = this.getCoordinates(fs, fa);
      const end = this.getCoordinates(ts, ta);

      if (!start || !end) {
        res.reason = "Surah atau Ayat tidak dikenali";
        return res;
      }

      const sIdx = this.INDEX_MAP[start.juz];
      const eIdx = this.INDEX_MAP[end.juz];

      // VALIDASI KURIKULUM SDQ
      if (eIdx < sIdx) {
        res.reason = `Mundur Kurikulum (Juz ${start.juz} ke ${end.juz})`;
        return res;
      }

      let diff = 0;

      if (start.juz === end.juz) {
        const absS = (start.page * this.LINES_PER_PAGE) + start.line;
        const absE = (end.page * this.LINES_PER_PAGE) + end.line;
        
        if (absE < absS) {
          res.reason = "Ayat tujuan mendahului ayat awal (Mundur)";
          return res;
        }
        diff = absE - absS + 1;
      } else {
        // Lintas Juz Kurikulum
        const linesLeftInStartJuz = this.getJuzCapacity(start.juz) - this.getAbsLineInJuz(start.page, start.line, start.juz) + 1;
        const linesInEndJuz = this.getAbsLineInJuz(end.page, end.line, end.juz);
        
        let intermediate = 0;
        for (let i = sIdx + 1; i < eIdx; i++) {
          intermediate += this.getJuzCapacity(SDQ_JUZ_ORDER[i]);
        }
        
        diff = linesLeftInStartJuz + linesInEndJuz + intermediate;
      }

      res.valid = true;
      res.totalLines = diff;
      res.pages = Math.floor(diff / this.LINES_PER_PAGE);
      res.lines = diff % this.LINES_PER_PAGE;
      return res;

    } catch (e) {
      res.reason = "Kesalahan internal engine";
      return res;
    }
  }

  /**
   * PUBLIC ENTRY POINT: PARSER
   */
  public static parseAndCalculate(rangeStr: string): SDQCalculationResult {
    const fail: SDQCalculationResult = { valid: true, pages: 0, lines: 0, totalLines: 0, reason: "" };

    if (!rangeStr || typeof rangeStr !== 'string') return fail;
    const clean = rangeStr.trim();
    if (clean === '-' || clean === '' || clean === 'Belum Ada') {
      fail.reason = "Data kosong atau Legacy";
      return fail;
    }

    try {
      // Split separator " - " atau " – "
      const parts = clean.split(/\s*[-–]\s*/);
      if (parts.length < 2) {
        fail.reason = "Format range tidak standar (Legacy)";
        return fail;
      }

      const parseRef = (s: string) => {
        const m = s.match(/^(.*?)\s*[:]\s*(\d+)$/);
        if (m) return { s: m[1].trim(), a: parseInt(m[2]) };
        return null;
      };

      const startObj = parseRef(parts[0]);
      if (!startObj) {
        fail.reason = "Gagal membaca koordinat awal";
        return fail;
      }

      let endSurah = startObj.s;
      let endAyah = 0;

      // Cek format pendek (Surah:Ayat - Ayat)
      if (/^\d+$/.test(parts[1].trim())) {
        endAyah = parseInt(parts[1].trim());
      } else {
        const endObj = parseRef(parts[1]);
        if (endObj) {
          endSurah = endObj.s;
          endAyah = endObj.a;
        } else {
          fail.reason = "Gagal membaca koordinat akhir";
          return fail;
        }
      }

      return this.calculate(startObj.s, startObj.a, endSurah, endAyah);

    } catch (e) {
      fail.reason = "Parser Error";
      return fail;
    }
  }
}

/**
 * BACKWARD COMPATIBILITY EXPORT (Old API Support)
 */
export const calculateHafalan = (fs: string, fa: number, ts: string, ta: number) => {
  const r = SDQQuranEngine.calculate(fs, fa, ts, ta);
  return { pages: r.pages, lines: r.lines };
};

export const calculateFromRangeString = (range: string) => {
  const r = SDQQuranEngine.parseAndCalculate(range);
  return { pages: r.pages, lines: r.lines };
};
