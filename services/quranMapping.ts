
import { TahfizhEngineSDQ } from './tahfizh/engine';
import { QURAN_METADATA } from './tahfizh/quranData';

export const QURAN_MAPPING = Object.values(QURAN_METADATA).map(m => ({
  page: m.startPage,
  surah: m.name,
  start: 1,
  end: m.totalAyah
}));

export const calculateHafalan = (
  fromSurah: string, 
  fromAyat: number, 
  toSurah: string, 
  toAyat: number
): { pages: number, lines: number } => {
  if (!fromSurah || !toSurah) return { pages: 0, lines: 0 };

  try {
    const result = TahfizhEngineSDQ.calculateCapaian(
      { surah: fromSurah, ayah: fromAyat },
      { surah: toSurah, ayah: toAyat }
    );
    
    // Untuk Iqra, total halaman adalah result.total.halaman
    // Untuk Quran, total baris adalah result.total.baris
    return { 
      pages: result.total.halaman, 
      lines: result.total.baris 
    };
  } catch (error) {
    console.error("Calculation Error:", error);
    return { pages: 0, lines: 0 };
  }
};

export const calculateFromRangeString = (rangeStr: string): { pages: number, lines: number } => {
  if (!rangeStr || rangeStr.trim() === '-' || rangeStr.trim() === '') return { pages: 0, lines: 0 };
  
  let parts = rangeStr.split(' - ').map(s => s.trim());
  if (parts.length !== 2) {
      const strictParts = rangeStr.split('-');
      if (strictParts.length === 2) parts = strictParts.map(s => s.trim());
      else return { pages: 0, lines: 0 };
  }

  const parseLocation = (s: string) => {
    // Menghandle format "Iqra 1: 5" atau "An-Naba: 1"
    const match = s.match(/^(.*?)[:\s]+(\d+)$/);
    if (match) return { surah: match[1].trim(), ayah: parseInt(match[2]) };
    return null;
  };

  const start = parseLocation(parts[0]);
  const end = parseLocation(parts[1]);

  if (start && end) return calculateHafalan(start.surah, start.ayah, end.surah, end.ayah);
  return { pages: 0, lines: 0 };
};
