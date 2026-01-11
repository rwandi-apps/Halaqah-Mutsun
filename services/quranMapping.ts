
// Fix: Import correct members and missing metadata from tahfizh sub-directory
import { SDQQuranEngine, SDQCalculationResult } from './tahfizh/engine';
import { QURAN_METADATA } from './tahfizh/quranData';

export const QURAN_MAPPING = Object.values(QURAN_METADATA).map(m => ({
  page: m.startPage,
  surah: m.name,
  start: 1,
  end: m.totalAyah
}));

// Wrapper lama untuk kompatibilitas UI
export const calculateHafalan = (
  fromSurah: string, 
  fromAyat: number, 
  toSurah: string, 
  toAyat: number
): { pages: number, lines: number } => {
  // Fix: Use correct class name 'SDQQuranEngine' and method 'calculate'
  const result: SDQCalculationResult = SDQQuranEngine.calculate(fromSurah, fromAyat, toSurah, toAyat);
  return { pages: result.pages, lines: result.lines };
};

// Wrapper parser string
export const calculateFromRangeString = (rangeStr: string): { pages: number, lines: number } => {
  // Fix: Use correct class name 'SDQQuranEngine' and method 'parseAndCalculate'
  const result: SDQCalculationResult = SDQQuranEngine.parseAndCalculate(rangeStr);
  
  if (!result.valid && result.reason) {
    // Optional: Log ke console tapi jangan crash app
    // console.debug(`Calc Skipped: ${rangeStr} (${result.reason})`);
  }
  
  return { pages: result.pages, lines: result.lines };
};
