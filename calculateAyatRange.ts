// calculateAyatRange.ts
import { AYAT_DB } from './data/ayatDB';

interface AyatPoint {
  surah: number;
  ayah: number;
}

export interface AyatRangeResult {
  pages: number;
  lines: number;
}

export function calculateAyatRange(
  start: AyatPoint,
  end: AyatPoint
): AyatRangeResult {
  const startAyat = AYAT_DB.find(
    a => a.surah === start.surah && a.ayah === start.ayah
  );
  const endAyat = AYAT_DB.find(
    a => a.surah === end.surah && a.ayah === end.ayah
  );

  if (!startAyat || !endAyat) {
    return { pages: 0, lines: 0 };
  }

  // Pastikan urutan benar
  const from = Math.min(startAyat.globalIndex, endAyat.globalIndex);
  const to = Math.max(startAyat.globalIndex, endAyat.globalIndex);

  const ayatRange = AYAT_DB.filter(
    a => a.globalIndex >= from && a.globalIndex <= to
  );

  if (ayatRange.length === 0) {
    return { pages: 0, lines: 0 };
  }

  const pages = new Set(ayatRange.map(a => a.page)).size;
  const lines = ayatRange.length; // 1 ayat = 1 baris (sementara)

  return { pages, lines };
}
// ====== TEST CASE SDQ ======

const test = calculateAyatRange({
  start: { surah: "At-Tahrim", ayat: 1 },
  end: { surah: "Adz-Dzariyat", ayat: 30 }
});

console.log("HASIL TES SDQ:", test);
