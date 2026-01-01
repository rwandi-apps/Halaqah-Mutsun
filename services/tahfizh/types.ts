
export interface AyahPointer {
  surah: string; 
  ayah: number;
}

export interface IqraPointer {
  jilid: number; // 1-6
  page: number;
}

export interface CalculationBreakdown {
  type: 'iqra' | 'juz';
  name: string;
  from: string;
  to: string;
  halaman: number;
  baris: number;
}

export interface SDQCalculationResult {
  iqra: {
    totalHalaman: number;
  };
  quran: {
    totalHalaman: number;
    totalBaris: number;
  };
  total: {
    halaman: number;
    baris: number;
  };
  breakdown: CalculationBreakdown[];
}

export interface QuranAyahData {
  juz: number;
  page: number;
  line: number;
}

export interface SurahMeta {
  index: number;
  name: string;
  totalAyah: number;
  startPage: number;
  endPage: number;
}
