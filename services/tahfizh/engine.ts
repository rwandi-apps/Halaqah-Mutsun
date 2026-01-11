import {
  AyahPointer,
  SDQCalculationResult,
  CalculationBreakdown
} from './types'; // Pastikan types Anda mendukung struktur ini
import {
  QURAN_FULL_MAP,
  JUZ_BOUNDARIES,
  IQRA_PAGES
} from './quranFullData';

// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================

/**
 * Hasil akhir yang "Safe" untuk UI
 * Menggabungkan struktur result Kode B dengan validasi Kode A
 */
export interface UltimateCalculationResult {
  valid: boolean;
  reason?: string;
  iqra: { totalHalaman: number };
  quran: { totalHalaman: number; totalBaris: number };
  total: { halaman: number; baris: number };
  breakdown: CalculationBreakdown[];
}

export class TahfizhEngineSDQ {
  private static readonly LINES_PER_PAGE = 15;

  /**
   * Urutan resmi kurikulum SDQ
   */
  private static readonly SDQ_JUZ_ORDER = [
    30, 29, 28, 27, 26,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25
  ];

  // BATAS HALAMAN FISIK PER JUZ (DARI KODE A - SEBAGAI FALLBACK)
  private static readonly JUZ_PAGE_LIMITS: Record<number, { start: number, end: number }> = {
    1: { start: 1, end: 21 }, 2: { start: 22, end: 41 }, 3: { start: 42, end: 61 }, 4: { start: 62, end: 81 }, 5: { start: 82, end: 101 },
    6: { start: 102, end: 121 }, 7: { start: 122, end: 141 }, 8: { start: 142, end: 161 }, 9: { start: 162, end: 181 }, 10: { start: 182, end: 201 },
    11: { start: 202, end: 221 }, 12: { start: 222, end: 241 }, 13: { start: 242, end: 261 }, 14: { start: 262, end: 281 }, 15: { start: 282, end: 301 },
    16: { start: 302, end: 321 }, 17: { start: 322, end: 341 }, 18: { start: 342, end: 361 }, 19: { start: 362, end: 381 }, 20: { start: 382, end: 401 },
    21: { start: 402, end: 421 }, 22: { start: 422, end: 441 }, 23: { start: 442, end: 461 }, 24: { start: 462, end: 481 }, 25: { start: 482, end: 501 },
    26: { start: 502, end: 521 }, 27: { start: 522, end: 541 }, 28: { start: 542, end: 561 }, 29: { start: 562, end: 581 }, 30: { start: 582, end: 604 }
  };

  // ==========================================
  // 2. PUBLIC API
  // ==========================================

  /**
   * Entry Point Utama (Menerima String Raw)
   * Menggunakan kekuatan parsing dari KODE A
   */
  static parseAndCalculate(rangeStr: string): UltimateCalculationResult {
    try {
      // 1. Validasi Kosong
      if (!rangeStr || typeof rangeStr !== 'string') {
        return this.createErrorResult("Input kosong");
      }
      const cleanStr = rangeStr.trim();
      if (cleanStr === '-' || cleanStr === '' || cleanStr === 'Belum Ada') {
        return this.createEmptyResult();
      }

      // 2. Parsing String ke Object (Logika Kode A yang kuat)
      const parts = cleanStr.split(/\s*[-–]\s*/);
      if (parts.length < 2) {
        return this.createErrorResult("Format salah (Gunakan tanda strip '-')");
      }

      const startRaw = parts[0].trim();
      let endRaw = parts[1].trim();

      // Helper Parser "NamaSurat:Ayah"
      const parseRef = (s: string) => {
        const match = s.match(/^(.*?)\s*[:]\s*(\d+)$/);
        if (match) return { surah: match[1].trim(), ayah: parseInt(match[2]) };
        return null;
      };

      const startObj = parseRef(startRaw);
      if (!startObj) return this.createErrorResult("Format awal salah");

      let endSurah = startObj.surah;
      let endAyah = 0;

      // Deteksi Format Pendek: "Al-Baqarah:1 - 10" (Ayat saja di belakang)
      if (/^\d+$/.test(endRaw)) {
        endAyah = parseInt(endRaw);
      } else {
        // Format Panjang: "Al-Baqarah:1 - An-Nisa:5"
        const endObj = parseRef(endRaw);
        if (!endObj) return this.createErrorResult("Format akhir salah");
        endSurah = endObj.surah;
        endAyah = endObj.ayah;
      }

      // 3. Hitung (Logika Kode B yang kaya fitur)
      return this.calculateCapaian(startObj, { surah: endSurah, ayah: endAyah });

    } catch (e) {
      console.error("Engine Crash:", e);
      return this.createErrorResult("Terjadi kesalahan internal");
    }
  }

  // ==========================================
  // 3. CORE ENGINE (Logic Kode B + Safety)
  // ==========================================

  private static createErrorResult(reason: string): UltimateCalculationResult {
    return {
      valid: false,
      reason,
      iqra: { totalHalaman: 0 },
      quran: { totalHalaman: 0, totalBaris: 0 },
      total: { halaman: 0, baris: 0 },
      breakdown: []
    };
  }

  private static createEmptyResult(): UltimateCalculationResult {
    return {
      valid: true,
      iqra: { totalHalaman: 0 },
      quran: { totalHalaman: 0, totalBaris: 0 },
      total: { halaman: 0, baris: 0 },
      breakdown: []
    };
  }

  /**
   * Logic Utama (Adaptasi dari Kode B)
   */
  private static calculateCapaian(
    start: AyahPointer,
    end: AyahPointer
  ): UltimateCalculationResult {
    // Normalisasi Nama Surat (Kode A: Kuat di typo)
    const startSurah = this.normalizeName(start.surah);
    const endSurah = this.normalizeName(end.surah);

    const startIsIqra = this.isIqra(startSurah);
    const endIsIqra = this.isIqra(endSurah);

    const result: UltimateCalculationResult = {
      valid: true,
      iqra: { totalHalaman: 0 },
      quran: { totalHalaman: 0, totalBaris: 0 },
      total: { halaman: 0, baris: 0 },
      breakdown: []
    };

    try {
      /* ===== SCENARIO A: MURNI IQRA ===== */
      if (startIsIqra && endIsIqra) {
        const iqraRes = this.calculateIqraRange(
          this.getIqraJilid(startSurah), start.ayah,
          this.getIqraJilid(endSurah), end.ayah
        );
        result.iqra.totalHalaman = iqraRes.halaman;
        result.breakdown.push(...iqraRes.breakdown);
      }

      /* ===== SCENARIO B: TRANSISI IQRA -> QURAN ===== */
      else if (startIsIqra && !endIsIqra) {
        // 1. Hitung sisa Iqra sampai jilid 6 selesai
        const iqraRes = this.calculateIqraRange(
          this.getIqraJilid(startSurah), start.ayah,
          6, IQRA_PAGES[6]
        );
        result.iqra.totalHalaman = iqraRes.halaman;
        result.breakdown.push(...iqraRes.breakdown);

        // 2. Hitung Quran mulai Juz 30 (Default transisi SDQ)
        const qStartKey = JUZ_BOUNDARIES[30].start;
        const qEndKey = `${endSurah}:${end.ayah}`;
        
        // Cek apakah Key valid di Map
        if (!QURAN_FULL_MAP[qStartKey] || !QURAN_FULL_MAP[qEndKey]) {
           return this.createErrorResult("Data transisi Iqra ke Quran tidak ditemukan.");
        }

        const quranRes = this.calculateQuranRangeSafe(qStartKey, qEndKey);
        result.quran = quranRes;
        result.breakdown.push(...quranRes.breakdown);
      }

      /* ===== SCENARIO C: MURNI QURAN ===== */
      else {
        // Cek Validitas Input Quran (Safety Check)
        const qStartKey = `${startSurah}:${start.ayah}`;
        const qEndKey = `${endSurah}:${end.ayah}`;

        if (!QURAN_FULL_MAP[qStartKey]) {
          return this.createErrorResult(`Surat/Ayat Awal tidak ditemukan: ${qStartKey}`);
        }
        if (!QURAN_FULL_MAP[qEndKey]) {
          return this.createErrorResult(`Surat/Ayat Akhir tidak ditemukan: ${qEndKey}`);
        }

        const quranRes = this.calculateQuranRangeSafe(qStartKey, qEndKey);
        result.quran = quranRes;
        result.breakdown.push(...quranRes.breakdown);
      }

      // Hitung Total Akhir
      result.total.halaman = result.iqra.totalHalaman + result.quran.totalHalaman;
      result.total.baris = result.quran.totalBaris;

      return result;

    } catch (e) {
      console.error("Calculation Error:", e);
      return this.createErrorResult("Gagal menghitung range");
    }
  }

  /**
   * Menghitung Quran dengan Validasi Kurikulum (Kode A + Kode B)
   */
  private static calculateQuranRangeSafe(
    startKey: string,
    endKey: string
  ): { totalHalaman: number; totalBaris: number; breakdown: CalculationBreakdown[] } {
    const startObj = QURAN_FULL_MAP[startKey];
    const endObj = QURAN_FULL_MAP[endKey];

    // VALIDASI KURIKULUM (Logika Kode A)
    const startIdx = this.SDQ_JUZ_ORDER.indexOf(startObj.juz);
    const endIdx = this.SDQ_JUZ_ORDER.indexOf(endObj.juz);

    if (endIdx < startIdx) {
      throw new Error(`Mundur Kurikulum: Dari Juz ${startObj.juz} ke Juz ${endObj.juz}`);
    }

    // KALKULASI UTAMA (Logika Kode B)
    let grandTotalBaris = 0;
    const breakdown: CalculationBreakdown[] = [];
    const juzSeq = this.SDQ_JUZ_ORDER.slice(startIdx, endIdx + 1);

    juzSeq.forEach((juz, idx) => {
      let currentStartKey: string;
      let currentEndKey: string;

      if (idx === 0) currentStartKey = startKey;
      else currentStartKey = JUZ_BOUNDARIES[juz].start;

      if (idx === juzSeq.length - 1) currentEndKey = endKey;
      else currentEndKey = JUZ_BOUNDARIES[juz].end;

      const p1 = QURAN_FULL_MAP[currentStartKey];
      const p2 = QURAN_FULL_MAP[currentEndKey];

      // Rumus: (Selisih Halaman * 15) + Selisih Baris + 1 (Inklusif)
      const diffPages = p2.page - p1.page;
      const diffLines = p2.line - p1.line;
      const totalBarisJuz = (diffPages * 15) + diffLines + 1;

      const dispHalaman = Math.floor(totalBarisJuz / 15);
      const dispBaris = totalBarisJuz % 15;

      grandTotalBaris += totalBarisJuz;

      breakdown.push({
        type: 'juz',
        name: `Juz ${juz}`,
        from: currentStartKey,
        to: currentEndKey,
        halaman: dispHalaman,
        baris: dispBaris
      });
    });

    return {
      totalHalaman: Math.floor(grandTotalBaris / 15),
      totalBaris: grandTotalBaris % 15,
      breakdown
    };
  }

  private static calculateIqraRange(
    sJilid: number,
    sPage: number,
    eJilid: number,
    ePage: number
  ): { halaman: number; breakdown: CalculationBreakdown[] } {
    let totalHalaman = 0;
    const breakdown: CalculationBreakdown[] = [];

    for (let j = sJilid; j <= eJilid; j++) {
      const maxPage = IQRA_PAGES[j] || 0; // Fallback safety
      const from = (j === sJilid) ? sPage : 1;
      const to = (j === eJilid) ? ePage : maxPage;
      const count = Math.max(0, to - from + 1);

      totalHalaman += count;
      breakdown.push({
        type: 'iqra',
        name: `Iqra ${j}`,
        from: `Hal ${from}`,
        to: `Hal ${to}`,
        halaman: count,
        baris: 0
      });
    }
    return { halaman: totalHalaman, breakdown };
  }

  // ==========================================
  // 4. UTILITIES (Parser & Normalizer)
  // ==========================================

  private static normalizeName(name: string): string {
    if (!name) return "";
    let n = name.toLowerCase().trim();
    
    // Bersihkan karakter khusus
    n = n.replace(/[’‘`]/g, "'").replace(/\s*-\s*/g, "-").replace(/\bal\s+/g, "al-");

    // Mapping Typo Luas (Dari Kode A)
    const map: Record<string, string> = {
      "ali imran": "Ali 'Imran", "al-imran": "Ali 'Imran", "ali-imran": "Ali 'Imran", "al imran": "Ali 'Imran",
      "yasin": "Ya-Sin", "ya sin": "Ya-Sin", "ya-sin": "Ya-Sin",
      "amma": "An-Naba'", "an naba": "An-Naba'", "an-naba": "An-Naba'",
      "al-lahab": "Al-Lahab", "al masad": "Al-Lahab",
      "al-insyirah": "Al-Insyirah", "alam nasyrah": "Al-Insyirah",
      "al-waqi'ah": "Al-Waqi'ah", "al waqiah": "Al-Waqi'ah", "al-waqiah": "Al-Waqi'ah",
      "ar-rahman": "Ar-Rahman", "al rahman": "Ar-Rahman"
    };

    if (map[n]) return map[n];

    // Capitalize Standard
    return n.replace(/(^|-)(\w)/g, (match) => match.toUpperCase());
  }

  private static isIqra(name: string): boolean {
    const n = name.toLowerCase();
    return n.includes('iqra') || n.includes('jilid');
  }

  private static getIqraJilid(name: string): number {
    const m = name.match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  }
  // ==========================================
  // 5. COMPATIBILITY WRAPPER (FIX ERROR)
  // ==========================================

  /**
   * Wrapper untuk menjaga kompatibilitas dengan Kode Lama / UI Lama.
   * Mengubah panggilan lama (4 argumen) menjadi format baru (1 string).
   */
  public static calculateRange(
    fromRaw: string,
    fromAyah: number,
    toRaw: string,
    toAyah: number
  ): { valid: boolean; pages: number; lines: number; totalLines: number; reason?: string } {
    
    // 1. Format ulang input menjadi string yang dipahami engine baru
    // Contoh: "Al-Baqarah:1 - An-Nisa:5"
    const rangeStr = `${fromRaw}:${fromAyah} - ${toRaw}:${toAyah}`;

    // 2. Panggil Engine Baru (parseAndCalculate)
    const ultimateResult = this.parseAndCalculate(rangeStr);

    // 3. Konversi hasil UltimateCalculationResult -> SafeCalculationResult (Format Lama)
    const totalLines = (ultimateResult.total.halaman * this.LINES_PER_PAGE) + ultimateResult.total.baris;

    return {
      valid: ultimateResult.valid,
      pages: ultimateResult.total.halaman, // Mapping: halaman -> pages
      lines: ultimateResult.total.baris,   // Mapping: baris -> lines
      totalLines: totalLines,              // Hitung total absolut baris
      reason: ultimateResult.reason
    };
  }
}
