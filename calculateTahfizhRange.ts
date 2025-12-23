// calculateTahfizhRange.ts
import { AYAT_DB, AyatEntry } from "./ayatDB";

export interface TahfizhResult {
  totalLines: number;
  totalPages: number;
}

/**
 * Hitung total baris & halaman dari range ayat
 * contoh:
 *   An-Naba:1 → An-Naba:30
 */
export function calculateTahfizhRange(
  startSurah: string,
  startAyat: number,
  endSurah: string,
  endAyat: number
): TahfizhResult {

  // Filter ayat sesuai range
  const rangeAyats = AYAT_DB.filter((a) => {
    if (a.surah === startSurah && a.ayat >= startAyat) return true;
    if (a.surah === endSurah && a.ayat <= endAyat) return true;
    return false;
  });

  if (rangeAyats.length === 0) {
    return { totalLines: 0, totalPages: 0 };
  }

  const totalLines = rangeAyats.reduce((sum, a) => sum + a.lines, 0);

  const pages = new Set(rangeAyats.map(a => a.page));
  const totalPages = pages.size;

  return {
    totalLines,
    totalPages
  };
}
