
import { 
  AyahPointer, 
  SDQCalculationResult, 
  CalculationBreakdown, 
  QuranAyahData 
} from './types';
import { QURAN_FULL_MAP, IQRA_PAGES } from './quranFullData';
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
    
    // Prioritaskan Hard-coded Map (Presisi Baris)
    if (QURAN_FULL_MAP[key]) return QURAN_FULL_MAP[key];

    // Fallback ke Metadata (Estimasi jika data detail tidak ada)
    const meta = QURAN_METADATA[normalized];
    if (!meta) throw new Error(`Surah "${surah}" tidak ditemukan.`);

    const totalPages = meta.endPage - meta.startPage + 1;
    const progress = (ayah - 1) / meta.totalAyah;
    
    const estPage = meta.startPage + Math.floor(progress * totalPages);
    const estLine = Math.floor(((progress * totalPages) % 1) * 15) + 1;

    let juz = 1;
    if (estPage >= 2) juz = Math.min(30, Math.floor((estPage - 2) / 20) + 1);
    if (estPage >= 582) juz = 30;

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
      result.total.halaman = iqraResult.halaman;
      result.total.baris = 0;
      result.breakdown = iqraResult.breakdown;
    } 
    else {
      // Logic Quran (Termasuk Transisi Iqra -> Quran jika diperlukan)
      const p1 = this.getAyahCoordinates(start.surah, start.ayah);
      const p2 = this.getAyahCoordinates(end.surah, end.ayah);
      
      const qPart = this.calculateQuranRange(
        p1, p2,
        `${this.normalizeName(start.surah)}:${start.ayah}`,
        `${this.normalizeName(end.surah)}:${end.ayah}`
      );

      result.quran = { totalHalaman: qPart.halaman, totalBaris: qPart.totalBarisFull };
      result.total.halaman = qPart.halaman;
      result.total.baris = qPart.sisaBaris;
      result.breakdown = qPart.breakdown;
    }

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
  ): { halaman: number, sisaBaris: number, totalBarisFull: number, breakdown: CalculationBreakdown[] } {
    
    // RUMUS UTAMA: Selisih baris kumulatif
    // (Loncatan Halaman * 15 baris) + (Baris Akhir - Baris Awal + 1)
    const totalBaris = ((p2.page - p1.page) * 15) + (p2.line - p1.line + 1);
    
    const finalTotalBaris = Math.max(0, totalBaris);
    const displayHalaman = Math.floor(finalTotalBaris / 15);
    const displayBaris = finalTotalBaris % 15;

    return { 
      halaman: displayHalaman, 
      sisaBaris: displayBaris,
      totalBarisFull: finalTotalBaris,
      breakdown: [{
        type: 'juz',
        name: p1.juz === p2.juz ? `Juz ${p1.juz}` : `Juz ${p1.juz}-${p2.juz}`,
        from: sLabel,
        to: eLabel,
        halaman: displayHalaman,
        baris: displayBaris
      }]
    };
  }
}
