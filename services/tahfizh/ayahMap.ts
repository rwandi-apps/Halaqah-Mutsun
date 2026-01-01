
import { AyahPointer } from './types';

interface AyahMapEntry extends AyahPointer {
  page: number;
  line: number;
}

export const AYAH_MAP: AyahMapEntry[] = [
  { "surah": "An-Nas", "ayah": 1, "page": 604, "line": 11 },
  { "surah": "An-Nas", "ayah": 6, "page": 604, "line": 15 },
  { "surah": "Al-Kafirun", "ayah": 1, "page": 603, "line": 11 },
  { "surah": "Al-Kafirun", "ayah": 6, "page": 603, "line": 15 },
  { "surah": "An-Naba'", "ayah": 1, "page": 582, "line": 1 },
  { "surah": "An-Naba'", "ayah": 24, "page": 582, "line": 12 }
];
