
import { 
  AyahPointer, 
  SDQCalculationResult, 
  CalculationBreakdown, 
  QuranAyahData 
} from './types';
import { QURAN_FULL_MAP, JUZ_BOUNDARIES, IQRA_PAGES } from './quranFullData';
import { QURAN_METADATA } from './quranData';

export class TahfizhEngineSDQ {
  private static readonly LINES_PER_PAGE = 15;
  
  // Urutan resmi kurikulum SDQ: Dimulai dari Juz 30 ke bawah
  private static readonly SDQ_JUZ_ORDER = [
    30, 29, 28, 27, 26, 
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
    21, 22, 23, 24, 25
  ];

  private static normalizeName(name: string): string {
    return name
      .replace(/[’‘`]/g, "'")
      .replace(/Al\s+/g, "Al-")
      .trim();
  }

  private static isIqra(name: string): boolean {
    const n = name.toLowerCase();
    return n.includes('iqra') || n.includes('jilid');
  }

  private static getIqraJilid(name: string): number {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Mendapatkan koordinat (Juz, Page, Line) untuk Surah & Ayat tertentu.
   * Menggunakan data eksplisit jika ada, jika tidak melakukan estimasi linear.
   */
  private static getAyahCoordinates(surah: string, ayah: number): QuranAyahData {
    const normalized = this.normalizeName(surah);
    const key = `${normalized}:${ayah}`;
    
    // 1. Coba cari di Map Eksplisit
    if (QURAN_FULL_MAP[key]) return QURAN_FULL_MAP[key];

    // 2. Estimasi berdasarkan Metadata Surah
    const meta = QURAN_METADATA[normalized];
    if (!meta) throw new Error(`Surah "${surah}" tidak ditemukan dalam database metadata.`);

    const totalPages = meta.endPage - meta.startPage + 1;
    const progress = (ayah - 1) / meta.totalAyah;
    
    const estPage = meta.startPage + Math.floor(progress * totalPages);
    const estLine = Math.floor(((progress * totalPages) % 1) * 15) + 1;

    // Tentukan Juz berdasarkan Page (Estimasi kasar standar Mushaf Madinah)
    // 1 Juz = 20 halaman, Juz 1 starts page 2
    let juz = 1;
    if (estPage >= 2) {
      juz = Math.min(30, Math.floor((estPage - 2) / 20) + 1);
    }
    // Khusus Juz 30-26 (SDQ Priority)
    if (estPage >= 582) juz = 30;
    else if (estPage >= 562) juz = 29;
    else if (estPage >= 542) juz = 28;
    else if (estPage >= 522) juz = 27;
    else if (estPage >= 502) juz = 26;

    return { 
      juz, 
      page: estPage, 
      line: Math.min(15, Math.max(1, estLine)) 
    };
  }

  /**
   * Main Engine Perhitungan Capaian
   */
  static calculateCapaian(start: AyahPointer, end: AyahPointer): SDQCalculationResult {
    const result: SDQCalculationResult = {
      iqra: { totalHalaman: 0 },
      quran: { totalHalaman: 0, totalBaris: 0 },
      total: { halaman: 0, baris: 0 },
      breakdown: []
    };

    const isStartIqra = this.isIqra(start.surah);
    const isEndIqra = this.isIqra(end.surah);

    // Kasus A: Murni Iqra
    if (isStartIqra && isEndIqra) {
      const iqraResult = this.calculateIqra(
        this.getIqraJilid(start.surah), start.ayah,
        this.getIqraJilid(end.surah), end.ayah
      );
      result.iqra.totalHalaman = iqraResult.halaman;
      result.breakdown = iqraResult.breakdown;
    } 
    // Kasus B: Dari Iqra pindah ke Quran
    else if (isStartIqra && !isEndIqra) {
      const iqraPart = this.calculateIqra(
        this.getIqraJilid(start.surah), start.ayah,
        6, IQRA_PAGES[6]
      );
      result.iqra.totalHalaman = iqraPart.halaman;
      result.breakdown.push(...iqraPart.breakdown);

      const qPart = this.calculateQuranRange(
        this.getAyahCoordinates("An-Naba'", 1),
        this.getAyahCoordinates(end.surah, end.ayah),
        "An-Naba':1",
        `${this.normalizeName(end.surah)}:${end.ayah}`
      );
      result.quran = { totalHalaman: qPart.halaman, totalBaris: qPart.baris };
      result.breakdown.push(...qPart.breakdown);
    }
    // Kasus C: Murni Quran
    else {
      const qPart = this.calculateQuranRange(
        this.getAyahCoordinates(start.surah, start.ayah),
        this.getAyahCoordinates(end.surah, end.ayah),
        `${this.normalizeName(start.surah)}:${start.ayah}`,
        `${this.normalizeName(end.surah)}:${end.ayah}`
      );
      result.quran = { totalHalaman: qPart.halaman, totalBaris: qPart.baris };
      result.breakdown = qPart.breakdown;
    }

    result.total.halaman = result.iqra.totalHalaman + result.quran.totalHalaman;
    result.total.baris = result.quran.totalBaris;

    return result;
  }

  private static calculateIqra(sJilid: number, sPage: number, eJilid: number, ePage: number): { halaman: number, breakdown: CalculationBreakdown[] } {
    let totalHalaman = 0;
    const breakdown: CalculationBreakdown[] = [];

    for (let j = sJilid; j <= eJilid; j++) {
      const maxPage = IQRA_PAGES[j] || 30;
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

  private static calculateQuranRange(
    p1: QuranAyahData, 
    p2: QuranAyahData, 
    sLabel: string, 
    eLabel: string
  ): { halaman: number, baris: number, breakdown: CalculationBreakdown[] } {
    let totalHalaman = 0;
    let totalBaris = 0;

    // Hitung jarak baris antar koordinat
    // Rumus: (Sisa baris hal 1) + (Halaman penuh * 15) + (Baris hal terakhir)
    if (p1.page === p2.page) {
      totalBaris = Math.max(0, p2.line - p1.line + 1);
      totalHalaman = 0; // Masih di halaman yang sama
    } else {
      const sisaBarisAwal = 15 - p1.line + 1;
      const halamanPenuh = Math.max(0, p2.page - p1.page - 1);
      const barisAkhir = p2.line;
      
      totalBaris = sisaBarisAwal + (halamanPenuh * 15) + barisAkhir;
      totalHalaman = p2.page - p1.page;
    }

    return { 
      halaman: totalHalaman, 
      baris: totalBaris, 
      breakdown: [{
        type: 'juz',
        name: p1.juz === p2.juz ? `Juz ${p1.juz}` : `Juz ${p1.juz}-${p2.juz}`,
        from: sLabel,
        to: eLabel,
        halaman: totalHalaman,
        baris: totalBaris
      }]
    };
  }
}
