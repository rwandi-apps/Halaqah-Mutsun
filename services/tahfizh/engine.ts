
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

  private static getAyahCoordinates(surah: string, ayah: number): QuranAyahData {
    const normalized = this.normalizeName(surah);
    const key = `${normalized}:${ayah}`;
    
    if (QURAN_FULL_MAP[key]) return QURAN_FULL_MAP[key];

    const meta = QURAN_METADATA[normalized];
    if (!meta) throw new Error(`Surah "${surah}" tidak ditemukan.`);

    const totalPages = meta.endPage - meta.startPage + 1;
    const progress = (ayah - 1) / meta.totalAyah;
    
    const estPage = meta.startPage + Math.floor(progress * totalPages);
    const estLine = Math.floor(((progress * totalPages) % 1) * 15) + 1;

    let juz = 1;
    if (estPage >= 2) {
      juz = Math.min(30, Math.floor((estPage - 2) / 20) + 1);
    }
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

  static calculateCapaian(start: AyahPointer, end: AyahPointer): SDQCalculationResult {
    const result: SDQCalculationResult = {
      iqra: { totalHalaman: 0 },
      quran: { totalHalaman: 0, totalBaris: 0 },
      total: { halaman: 0, baris: 0 },
      breakdown: []
    };

    const isStartIqra = this.isIqra(start.surah);
    const isEndIqra = this.isIqra(end.surah);

    if (isStartIqra && isEndIqra) {
      const iqraResult = this.calculateIqra(
        this.getIqraJilid(start.surah), start.ayah,
        this.getIqraJilid(end.surah), end.ayah
      );
      result.iqra.totalHalaman = iqraResult.halaman;
      result.breakdown = iqraResult.breakdown;
    } 
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
    let totalBaris = 0;

    // Hitung jarak baris antar koordinat
    if (p1.page === p2.page) {
      totalBaris = Math.max(0, p2.line - p1.line + 1);
    } else {
      const sisaBarisAwal = 15 - p1.line + 1;
      const halamanPenuh = Math.max(0, p2.page - p1.page - 1);
      const barisAkhir = p2.line;
      totalBaris = sisaBarisAwal + (halamanPenuh * 15) + barisAkhir;
    }

    // Konversi Baris ke Halaman (15 Baris = 1 Halaman)
    // Gunakan Math.ceil atau logic inclusive agar range tercatat sebagai jumlah halaman numerik yang benar
    const totalHalaman = Math.ceil(totalBaris / 15);

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
