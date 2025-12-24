import { QURAN_MAPPING } from "./services/quranMapping";
import { AYAT_DB, AyatEntry } from "./ayatDB";

export interface TahfizhResult {
  totalLines: number;
  totalPages: number;
  isPartial: boolean; // penanda data belum lengkap
}

export function calculateTahfizhRange(
  startSurah: string,
  startAyat: number,
  endSurah: string,
  endAyat: number
): TahfizhResult {

  let isInRange = false;
  const selected: AyatEntry[] = [];
  let reachedEnd = false;

  for (const ayat of AYAT_DB) {

    if (ayat.surah === startSurah && ayat.ayat === startAyat) {
      isInRange = true;
    }

    if (isInRange) {
      selected.push(ayat);
    }

    if (ayat.surah === endSurah && ayat.ayat === endAyat) {
      reachedEnd = true;
      break;
    }
  }
console.log("mapping loaded", QURAN_MAPPING.length);
  return {
    totalLines: selected.reduce((s, a) => s + a.lines, 0),
    totalPages: new Set(selected.map(a => a.page)).size,
    isPartial: !reachedEnd
  };
}
