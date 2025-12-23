import { AYAT_DB, AyatEntry } from "./ayatDB";
export function calculateTahfizhRange(
  startSurah: string,
  startAyat: number,
  endSurah: string,
  endAyat: number
) {

  let isInRange = false;
  const selected: AyatEntry[] = [];

  for (const ayat of AYAT_DB) {

    if (ayat.surah === startSurah && ayat.ayat === startAyat) {
      isInRange = true;
    }

    if (isInRange) {
      selected.push(ayat);
    }

    if (ayat.surah === endSurah && ayat.ayat === endAyat) {
      break;
    }
  }

  const totalLines = selected.reduce((s, a) => s + a.lines, 0);
  const totalPages = new Set(selected.map(a => a.page)).size;

  return { totalLines, totalPages };
}
