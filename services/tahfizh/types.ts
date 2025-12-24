
export interface AyahPointer {
  surah: string;
  ayah: number;
}

export interface CalculationResult {
  pages: number;
  lines: number;
  juz: number;
  isPartial: boolean;
  error?: string;
}

export interface SurahMeta {
  index: number; // Index asli Mushaf (1-114)
  name: string;
  totalAyah: number;
  startPage: number;
  endPage: number;
}
