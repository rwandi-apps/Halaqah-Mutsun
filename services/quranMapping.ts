
import { TahfizhEngine } from './tahfizh/engine';
import { QURAN_METADATA } from './tahfizh/quranData';

export const QURAN_MAPPING = Object.values(QURAN_METADATA).map(m => ({
  page: m.startPage,
  surah: m.name,
  start: 1,
  end: m.totalAyah
}));

export const IQRA_MAPPING = [
  { volume: 1, pages: 31 },
  { volume: 2, pages: 30 },
  { volume: 3, pages: 30 },
  { volume: 4, pages: 30 },
  { volume: 5, pages: 30 },
  { volume: 6, pages: 31 },
];

const getIqraVolume = (surahName: string): number | null => {
  const match = surahName.match(/iqra\s*'?\s*(\d+)/i);
  if (match) return parseInt(match[1]);
  return null;
};

const getIqraAbsolutePage = (volume: number, page: number): number => {
  let absolute = 0;
  for (let i = 0; i < volume - 1; i++) {
    absolute += IQRA_MAPPING[i].pages;
  }
  return absolute + page;
};

export const calculateHafalan = (
  fromSurah: string, 
  fromAyat: number, 
  toSurah: string, 
  toAyat: number
): { pages: number, lines: number } => {
  if (!fromSurah || !toSurah) return { pages: 0, lines: 0 };

  const fromIqraVol = getIqraVolume(fromSurah);
  const toIqraVol = getIqraVolume(toSurah);

  if (fromIqraVol !== null && toIqraVol !== null) {
    const startAbs = getIqraAbsolutePage(fromIqraVol, fromAyat);
    const endAbs = getIqraAbsolutePage(toIqraVol, toAyat);
    const diff = endAbs - startAbs + 1;
    return { pages: Math.max(0, diff), lines: 0 };
  }

  const result = TahfizhEngine.calculateRange(
    { surah: fromSurah, ayah: fromAyat },
    { surah: toSurah, ayah: toAyat }
  );

  return { pages: result.pages, lines: result.lines };
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
    // Menangani format "Surah: Ayat" atau "Surah Ayat"
    const match = s.match(/^(.*?)[:\s]+(\d+)$/);
    if (match) return { surah: match[1].trim(), ayah: parseInt(match[2]) };
    return null;
  };

  const start = parseLocation(parts[0]);
  const end = parseLocation(parts[1]);

  if (start && end) return calculateHafalan(start.surah, start.ayah, end.surah, end.ayah);
  return { pages: 0, lines: 0 };
};
