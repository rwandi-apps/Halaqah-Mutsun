
import { TahfizhEngine } from './tahfizh/engine';
import { QURAN_METADATA } from './tahfizh/quranData';

export const QURAN_MAPPING = Object.values(QURAN_METADATA).map(m => ({
  page: m.startPage,
  surah: m.name,
  start: 1,
  end: m.totalAyah
}));

/**
 * Interface untuk mapping Iqra
 */
export const IQRA_MAPPING = [
  { volume: 1, pages: 31 },
  { volume: 2, pages: 30 },
  { volume: 3, pages: 30 },
  { volume: 4, pages: 30 },
  { volume: 5, pages: 30 },
  { volume: 6, pages: 31 },
];

/**
 * Menghitung selisih hafalan secara fisik (Halaman/Baris Mushaf Madinah).
 */
export const calculateHafalan = (
  fromSurah: string, 
  fromAyat: number, 
  toSurah: string, 
  toAyat: number
): { pages: number, lines: number } => {
  if (!fromSurah || !toSurah) return { pages: 0, lines: 0 };

  const result = TahfizhEngine.calculateRange(
    { surah: fromSurah, ayah: fromAyat },
    { surah: toSurah, ayah: toAyat }
  );

  return { pages: result.pages, lines: result.lines };
};

/**
 * Parsing string range (contoh: "An-Naba: 1 - An-Naba: 24") ke hasil fisik.
 */
export const calculateFromRangeString = (rangeStr: string): { pages: number, lines: number } => {
  if (!rangeStr || rangeStr.trim() === '-' || rangeStr.trim() === '') return { pages: 0, lines: 0 };
  
  let parts = rangeStr.split(' - ').map(s => s.trim());
  if (parts.length !== 2) {
      const strictParts = rangeStr.split('-');
      if (strictParts.length === 2) parts = strictParts.map(s => s.trim());
      else return { pages: 0, lines: 0 };
  }

  const parseLocation = (s: string) => {
    // Mencocokkan "Surah: Ayat" atau "Surah:Ayat"
    const match = s.match(/^(.*?)[:\s]+(\d+)$/);
    if (match) return { surah: match[1].trim(), ayah: parseInt(match[2]) };
    return null;
  };

  const start = parseLocation(parts[0]);
  const end = parseLocation(parts[1]);

  if (start && end) return calculateHafalan(start.surah, start.ayah, end.surah, end.ayah);
  return { pages: 0, lines: 0 };
};
