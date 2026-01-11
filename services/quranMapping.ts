
import { SDQQuranEngine, SDQCalculationResult } from './tahfizh/engine';
import { QURAN_METADATA } from './tahfizh/quranData';

export const QURAN_MAPPING = Object.values(QURAN_METADATA).map(m => ({
  page: m.startPage,
  surah: m.name,
  start: 1,
  end: m.totalAyah
}));

/**
 * Wrapper for UI compatibility - calculate by separate coordinates
 */
export const calculateHafalan = (
  fromSurah: string, 
  fromAyat: number, 
  toSurah: string, 
  toAyat: number
): { pages: number, lines: number, valid: boolean, totalLines: number } => {
  const result: SDQCalculationResult = SDQQuranEngine.calculate(fromSurah, fromAyat, toSurah, toAyat);
  return { 
    pages: result.pages, 
    lines: result.lines, 
    valid: result.valid, 
    totalLines: result.totalLines 
  };
};

/**
 * String range parser wrapper - calculate from "Surah:Ayat - Surah:Ayat"
 */
export const calculateFromRangeString = (rangeStr: string): { pages: number, lines: number, valid: boolean, totalLines: number } => {
  const result: SDQCalculationResult = SDQQuranEngine.parseAndCalculate(rangeStr);
  return { 
    pages: result.pages, 
    lines: result.lines, 
    valid: result.valid, 
    totalLines: result.totalLines 
  };
};
