// data/ayatDB.ts
// STEP 1 — DATA AYAT DASAR (CONTOH)

export interface AyahDB {
  surah: number;
  ayah: number;
  page: number;
  line: number;
  globalIndex: number;
}

// CONTOH DATA — JUZ 30 (POTONGAN)
export const AYAT_DB: AyahDB[] = [
  // An-Naba (78) — halaman 582
  { surah: 78, ayah: 1, page: 582, line: 1, globalIndex: 5663 },
  { surah: 78, ayah: 2, page: 582, line: 1, globalIndex: 5664 },
  { surah: 78, ayah: 3, page: 582, line: 1, globalIndex: 5665 },
  { surah: 78, ayah: 4, page: 582, line: 2, globalIndex: 5667 },
  { surah: 78, ayah: 5, page: 582, line: 2, globalIndex: 5668 },
  { surah: 78, ayah: 6, page: 582, line: 2, globalIndex: 5669 },
  { surah: 78, ayah: 7, page: 582, line: 3, globalIndex: 5670 },
  { surah: 78, ayah: 8, page: 582, line: 3, globalIndex: 5671 },
  { surah: 78, ayah: 9, page: 582, line: 3, globalIndex: 5672 },
  { surah: 78, ayah: 10, page: 582, line: 4, globalIndex: 5673 },
{ surah: 78, ayah: 11, page: 582, line: 4, globalIndex: 5674 },
  { surah: 78, ayah: 12, page: 582, line: 5, globalIndex: 5675 },
  { surah: 78, ayah: 13, page: 582, line: 5, globalIndex: 5676 },
  { surah: 78, ayah: 14, page: 582, line: 6, globalIndex: 5677 },
  { surah: 78, ayah: 15, page: 582, line: 6, globalIndex: 5678 },
  { surah: 78, ayah: 16, page: 582, line: 7, globalIndex: 5679 },
  { surah: 78, ayah: 17, page: 582, line: 7, globalIndex: 5680 },
  { surah: 78, ayah: 18, page: 582, line: 8, globalIndex: 5681 },
  { surah: 78, ayah: 19, page: 582, line: 8, globalIndex: 5682 },
  { surah: 78, ayah: 20, page: 582, line: 9, globalIndex: 5683 },
  { surah: 78, ayah: 21, page: 582, line: 9, globalIndex: 5684 },
  { surah: 78, ayah: 22, page: 582, line: 10, globalIndex: 5685 },
  { surah: 78, ayah: 23, page: 582, line: 10, globalIndex: 5686 },
  { surah: 78, ayah: 24, page: 582, line: 10, globalIndex: 5687 },
  { surah: 78, ayah: 25, page: 582, line: 11, globalIndex: 5688 },
  { surah: 78, ayah: 26, page: 582, line: 11, globalIndex: 5689 },
  { surah: 78, ayah: 27, page: 582, line: 12, globalIndex: 5690 },
  { surah: 78, ayah: 28, page: 582, line: 12, globalIndex: 5691 },
  { surah: 78, ayah: 29, page: 582, line: 13, globalIndex: 5692 },
  { surah: 78, ayah: 30, page: 582, line: 13, globalIndex: 5693 },
  // Halaman 583
  { surah: 78, ayah: 31, page: 583, line: 2, globalIndex: 5694 },
  { surah: 78, ayah: 32, page: 583, line: 3, globalIndex: 5695 },
  { surah: 78, ayah: 33, page: 583, line: 3, globalIndex: 5696 },
  { surah: 78, ayah: 34, page: 583, line: 4, globalIndex: 5697 },
  { surah: 78, ayah: 35, page: 583, line: 4, globalIndex: 5698 },
  { surah: 78, ayah: 36, page: 583, line: 5, globalIndex: 5699 },
  { surah: 78, ayah: 37, page: 583, line: 6, globalIndex: 5700 },
  { surah: 78, ayah: 38, page: 583, line: 7, globalIndex: 5701 },
  { surah: 78, ayah: 39, page: 583, line: 8, globalIndex: 5702 },
  { surah: 78, ayah: 40, page: 583, line: 9, globalIndex: 5703 },
 // --- SURAH AN-NAZI'AT (79) ---
  { surah: 79, ayah: 1, page: 583, line: 11, globalIndex: 5703 },
  { surah: 79, ayah: 2, page: 583, line: 11, globalIndex: 5704 },
  { surah: 79, ayah: 3, page: 583, line: 12, globalIndex: 5705 },
  { surah: 79, ayah: 4, page: 583, line: 12, globalIndex: 5706 },
  { surah: 79, ayah: 5, page: 583, line: 13, globalIndex: 5707 },
];
