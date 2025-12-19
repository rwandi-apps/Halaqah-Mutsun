// Data Mapping for Al-Quran (Madinah Standard: 15 Lines/Page)
// Format: Page, Surah Name, Start Ayah, End Ayah

export interface QuranPageEntry {
  page: number;
  surah: string;
  start: number;
  end: number;
}

export const QURAN_MAPPING: QuranPageEntry[] = [
  // Juz 1
  { page: 1, surah: "Al-Fatihah", start: 1, end: 7 },
  { page: 2, surah: "Al-Baqarah", start: 1, end: 5 },
  { page: 3, surah: "Al-Baqarah", start: 6, end: 16 },
  { page: 4, surah: "Al-Baqarah", start: 17, end: 24 },
  { page: 5, surah: "Al-Baqarah", start: 25, end: 29 },
  { page: 6, surah: "Al-Baqarah", start: 30, end: 37 },
  { page: 7, surah: "Al-Baqarah", start: 38, end: 48 },
  { page: 8, surah: "Al-Baqarah", start: 49, end: 57 },
  { page: 9, surah: "Al-Baqarah", start: 58, end: 61 },
  { page: 10, surah: "Al-Baqarah", start: 62, end: 69 },
  { page: 11, surah: "Al-Baqarah", start: 70, end: 76 },
  { page: 12, surah: "Al-Baqarah", start: 77, end: 83 },
  { page: 13, surah: "Al-Baqarah", start: 84, end: 88 },
  { page: 14, surah: "Al-Baqarah", start: 89, end: 93 },
  { page: 15, surah: "Al-Baqarah", start: 94, end: 101 },
  { page: 16, surah: "Al-Baqarah", start: 102, end: 105 },
  { page: 17, surah: "Al-Baqarah", start: 106, end: 112 },
  { page: 18, surah: "Al-Baqarah", start: 113, end: 119 },
  { page: 19, surah: "Al-Baqarah", start: 120, end: 126 },
  { page: 20, surah: "Al-Baqarah", start: 127, end: 134 },
  { page: 21, surah: "Al-Baqarah", start: 135, end: 141 },
  // Juz 29
  { page: 562, surah: "Al-Mulk", start: 1, end: 12 },
  { page: 563, surah: "Al-Mulk", start: 13, end: 26 },
  { page: 564, surah: "Al-Mulk", start: 27, end: 30 },
  // Juz 30
  { page: 582, surah: "An-Naba'", start: 1, end: 30 },
  { page: 583, surah: "An-Naba'", start: 31, end: 40 },
  { page: 583, surah: "An-Nazi'at", start: 1, end: 15 },
  { page: 584, surah: "An-Nazi'at", start: 16, end: 46 },
  { page: 585, surah: "'Abasa", start: 1, end: 42 },
  { page: 586, surah: "At-Takwir", start: 1, end: 29 },
  { page: 587, surah: "Al-Infitar", start: 1, end: 19 },
  { page: 604, surah: "An-Nas", start: 1, end: 6 },
];

export const IQRA_MAPPING = [
  { volume: 1, pages: 31 },
  { volume: 2, pages: 30 },
  { volume: 3, pages: 30 },
  { volume: 4, pages: 30 },
  { volume: 5, pages: 30 },
  { volume: 6, pages: 31 },
];

const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

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

  const stripPrefix = (s: string) => s.replace(/^\d+\.\s*/, '').trim();
  const nFromSurah = normalize(stripPrefix(fromSurah));
  const nToSurah = normalize(stripPrefix(toSurah));

  const startEntry = QURAN_MAPPING.find(entry => 
    normalize(entry.surah) === nFromSurah && fromAyat >= entry.start && fromAyat <= entry.end
  );
  
  const endEntry = QURAN_MAPPING.find(entry => 
    normalize(entry.surah) === nToSurah && toAyat >= entry.start && toAyat <= entry.end
  );

  if (!startEntry || !endEntry) return { pages: 0, lines: 0 };
  if (endEntry.page < startEntry.page) return { pages: 0, lines: 0 };

  let totalLines = 0;
  if (startEntry.page === endEntry.page) {
    const totalVersesOnPage = startEntry.end - startEntry.start + 1;
    const versesCovered = toAyat - fromAyat + 1;
    if (versesCovered > 0) totalLines = (versesCovered / totalVersesOnPage) * 15;
  } else {
    const startPageTotalVerses = startEntry.end - startEntry.start + 1;
    const startPageVersesCovered = startEntry.end - fromAyat + 1;
    const linesOnStart = (startPageVersesCovered / startPageTotalVerses) * 15;
    const endPageTotalVerses = endEntry.end - endEntry.start + 1;
    const endPageVersesCovered = toAyat - endEntry.start + 1;
    const linesOnEnd = (endPageVersesCovered / endPageTotalVerses) * 15;
    const fullPages = endEntry.page - startEntry.page - 1;
    const linesOnFullPages = Math.max(0, fullPages) * 15;
    totalLines = linesOnStart + linesOnEnd + linesOnFullPages;
  }
  
  const finalPages = Math.floor(totalLines / 15);
  const finalLines = Math.round(totalLines % 15);
  return { pages: finalPages, lines: finalLines };
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
    const match = s.match(/^(.*?)[:\s]+(\d+)$/);
    if (match) return { surah: match[1].trim(), ayat: parseInt(match[2]) };
    return null;
  };
  const start = parseLocation(parts[0]);
  const end = parseLocation(parts[1]);
  if (start && end) return calculateHafalan(start.surah, start.ayat, end.surah, end.ayat);
  return { pages: 0, lines: 0 };
};