import { SDQ_SURAH_ORDER } from "./sdqSurahOrder";

export function normalizeRange(
  fromSurah: string,
  fromAyah: number,
  toSurah: string,
  toAyah: number
) {
  const from = SDQ_SURAH_ORDER.find(s => s.surah === fromSurah);
  const to = SDQ_SURAH_ORDER.find(s => s.surah === toSurah);

  if (!from || !to) return null;

  // Pastikan always maju sesuai SDQ
  if (from.order > to.order) {
    return {
      start: { surah: toSurah, ayah: toAyah },
      end: { surah: fromSurah, ayah: fromAyah }
    };
  }

  return {
    start: { surah: fromSurah, ayah: fromAyah },
    end: { surah: toSurah, ayah: toAyah }
  };
}
