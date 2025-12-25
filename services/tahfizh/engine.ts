import { AYAH_MAP } from "./ayahMap";

export interface TahfizhResult {
  totalPages: number;
  totalLines: number;
  isPartial: boolean;
}

/**
 * HITUNG PROGRES TAHFIZH BERDASARKAN BARIS MUSHAF
 */
export function calculateTahfizhRange(
  startSurah: string,
  startAyah: number,
  endSurah: string,
  endAyah: number
): TahfizhResult {
  // 1️⃣ Ambil semua baris awal
  const startLines = AYAH_MAP.filter(
    (r) => r.surah === startSurah && r.ayah === startAyah
  );

  // 2️⃣ Ambil semua baris akhir
  const endLines = AYAH_MAP.filter(
    (r) => r.surah === endSurah && r.ayah === endAyah
  );

  // 3️⃣ Validasi data
  if (startLines.length === 0 || endLines.length === 0) {
    return {
      totalPages: 0,
      totalLines: 0,
      isPartial: true,
    };
  }

  // 4️⃣ Tentukan baris start paling AWAL
  const start = startLines.reduce((a, b) =>
    a.globalLine < b.globalLine ? a : b
  );

  // 5️⃣ Tentukan baris end paling AKHIR
  const end = endLines.reduce((a, b) =>
    a.globalLine > b.globalLine ? a : b
  );

  // 6️⃣ Pastikan urutan valid
  if (end.globalLine < start.globalLine) {
    return {
      totalPages: 0,
      totalLines: 0,
      isPartial: true,
    };
  }

  // 7️⃣ Ambil semua baris di antaranya
  const coveredLines = AYAH_MAP.filter(
    (r) =>
      r.globalLine >= start.globalLine &&
      r.globalLine <= end.globalLine
  );

  if (coveredLines.length === 0) {
    return {
      totalPages: 0,
      totalLines: 0,
      isPartial: true,
    };
  }

  // 8️⃣ Hitung baris & halaman
  const totalLines = coveredLines.length;

  const uniquePages = new Set(
    coveredLines.map((r) => r.page)
  );

  return {
    totalLines,
    totalPages: uniquePages.size,
    isPartial: false,
  };
}
