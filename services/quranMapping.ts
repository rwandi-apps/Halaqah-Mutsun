// Data Mapping for Al-Quran (Madinah Standard: 15 Lines/Page)
// Format: Page, Surah Name, Start Ayah, End Ayah

export interface QuranPageEntry {
  page: number;
  surah: string;
  start: number;
  end: number;
}

export const QURAN_MAPPING: QuranPageEntry[] = [
  // Juz 1
  { page: 1, surah: "Al-Fatihah", start: 1, end: 7 },
  { page: 2, surah: "Al-Baqarah", start: 1, end: 5 },
  { page: 3, surah: "Al-Baqarah", start: 6, end: 16 },
  { page: 4, surah: "Al-Baqarah", start: 17, end: 24 },
  { page: 5, surah: "Al-Baqarah", start: 25, end: 29 },
  { page: 6, surah: "Al-Baqarah", start: 30, end: 37 },
  { page: 7, surah: "Al-Baqarah", start: 38, end: 48 },
  { page: 8, surah: "Al-Baqarah", start: 49, end: 57 },
  { page: 9, surah: "Al-Baqarah", start: 58, end: 61 },
  { page: 10, surah: "Al-Baqarah", start: 62, end: 69 },
  { page: 11, surah: "Al-Baqarah", start: 70, end: 76 },
  { page: 12, surah: "Al-Baqarah", start: 77, end: 83 },
  { page: 13, surah: "Al-Baqarah", start: 84, end: 88 },
  { page: 14, surah: "Al-Baqarah", start: 89, end: 93 },
  { page: 15, surah: "Al-Baqarah", start: 94, end: 101 },
  { page: 16, surah: "Al-Baqarah", start: 102, end: 105 },
  { page: 17, surah: "Al-Baqarah", start: 106, end: 112 },
  { page: 18, surah: "Al-Baqarah", start: 113, end: 119 },
  { page: 19, surah: "Al-Baqarah", start: 120, end: 126 },
  { page: 20, surah: "Al-Baqarah", start: 127, end: 134 },
  { page: 21, surah: "Al-Baqarah", start: 135, end: 141 },
  // Juz 2
  { page: 22, surah: "Al-Baqarah", start: 142, end: 145 },
  { page: 23, surah: "Al-Baqarah", start: 146, end: 153 },
  { page: 24, surah: "Al-Baqarah", start: 154, end: 163 },
  { page: 25, surah: "Al-Baqarah", start: 164, end: 169 },
  { page: 26, surah: "Al-Baqarah", start: 170, end: 176 },
  { page: 27, surah: "Al-Baqarah", start: 177, end: 181 },
  { page: 28, surah: "Al-Baqarah", start: 182, end: 186 },
  { page: 29, surah: "Al-Baqarah", start: 187, end: 190 },
  { page: 30, surah: "Al-Baqarah", start: 191, end: 196 },
  { page: 31, surah: "Al-Baqarah", start: 197, end: 202 },
  { page: 32, surah: "Al-Baqarah", start: 203, end: 210 },
  { page: 33, surah: "Al-Baqarah", start: 211, end: 215 },
  { page: 34, surah: "Al-Baqarah", start: 216, end: 219 },
  { page: 35, surah: "Al-Baqarah", start: 220, end: 224 },
  { page: 36, surah: "Al-Baqarah", start: 225, end: 230 },
  { page: 37, surah: "Al-Baqarah", start: 231, end: 233 },
  { page: 38, surah: "Al-Baqarah", start: 234, end: 237 },
  { page: 39, surah: "Al-Baqarah", start: 238, end: 245 },
  { page: 40, surah: "Al-Baqarah", start: 246, end: 248 },
  { page: 41, surah: "Al-Baqarah", start: 249, end: 252 },
  // Juz 3
  { page: 42, surah: "Al-Baqarah", start: 253, end: 256 },
  { page: 43, surah: "Al-Baqarah", start: 257, end: 259 },
  { page: 44, surah: "Al-Baqarah", start: 260, end: 264 },
  { page: 45, surah: "Al-Baqarah", start: 265, end: 269 },
  { page: 46, surah: "Al-Baqarah", start: 270, end: 274 },
  { page: 47, surah: "Al-Baqarah", start: 275, end: 281 },
  { page: 48, surah: "Al-Baqarah", start: 282, end: 282 },
  { page: 49, surah: "Al-Baqarah", start: 283, end: 286 },
  { page: 50, surah: "Ali 'Imran", start: 1, end: 9 },
  { page: 51, surah: "Ali 'Imran", start: 10, end: 15 },
  { page: 52, surah: "Ali 'Imran", start: 16, end: 22 },
  { page: 53, surah: "Ali 'Imran", start: 23, end: 29 },
  { page: 54, surah: "Ali 'Imran", start: 30, end: 37 },
  { page: 55, surah: "Ali 'Imran", start: 38, end: 45 },
  { page: 56, surah: "Ali 'Imran", start: 46, end: 52 },
  { page: 57, surah: "Ali 'Imran", start: 53, end: 61 },
  { page: 58, surah: "Ali 'Imran", start: 62, end: 70 },
  { page: 59, surah: "Ali 'Imran", start: 71, end: 77 },
  { page: 60, surah: "Ali 'Imran", start: 78, end: 83 },
  { page: 61, surah: "Ali 'Imran", start: 84, end: 91 },
  // Juz 4
  { page: 62, surah: "Ali 'Imran", start: 92, end: 100 },
  { page: 63, surah: "Ali 'Imran", start: 101, end: 108 },
  { page: 64, surah: "Ali 'Imran", start: 109, end: 115 },
  { page: 65, surah: "Ali 'Imran", start: 116, end: 121 },
  { page: 66, surah: "Ali 'Imran", start: 122, end: 132 },
  { page: 67, surah: "Ali 'Imran", start: 133, end: 140 },
  { page: 68, surah: "Ali 'Imran", start: 141, end: 148 },
  { page: 69, surah: "Ali 'Imran", start: 149, end: 153 },
  { page: 70, surah: "Ali 'Imran", start: 154, end: 157 },
  { page: 71, surah: "Ali 'Imran", start: 158, end: 165 },
  { page: 72, surah: "Ali 'Imran", start: 166, end: 173 },
  { page: 73, surah: "Ali 'Imran", start: 174, end: 180 },
  { page: 74, surah: "Ali 'Imran", start: 181, end: 186 },
  { page: 75, surah: "Ali 'Imran", start: 187, end: 194 },
  { page: 76, surah: "Ali 'Imran", start: 195, end: 200 },
  { page: 77, surah: "An-Nisa'", start: 1, end: 6 },
  { page: 78, surah: "An-Nisa'", start: 7, end: 11 },
  { page: 79, surah: "An-Nisa'", start: 12, end: 14 },
  { page: 80, surah: "An-Nisa'", start: 15, end: 19 },
  { page: 81, surah: "An-Nisa'", start: 20, end: 23 },
  // Juz 5
  { page: 82, surah: "An-Nisa'", start: 24, end: 26 },
  { page: 83, surah: "An-Nisa'", start: 27, end: 33 },
  { page: 84, surah: "An-Nisa'", start: 34, end: 37 },
  { page: 85, surah: "An-Nisa'", start: 38, end: 44 },
  { page: 86, surah: "An-Nisa'", start: 45, end: 51 },
  { page: 87, surah: "An-Nisa'", start: 52, end: 59 },
  { page: 88, surah: "An-Nisa'", start: 60, end: 65 },
  { page: 89, surah: "An-Nisa'", start: 66, end: 74 },
  { page: 90, surah: "An-Nisa'", start: 75, end: 79 },
  { page: 91, surah: "An-Nisa'", start: 80, end: 86 },
  { page: 92, surah: "An-Nisa'", start: 87, end: 91 },
  { page: 93, surah: "An-Nisa'", start: 92, end: 94 },
  { page: 94, surah: "An-Nisa'", start: 95, end: 101 },
  { page: 95, surah: "An-Nisa'", start: 102, end: 105 },
  { page: 96, surah: "An-Nisa'", start: 106, end: 113 },
  { page: 97, surah: "An-Nisa'", start: 114, end: 121 },
  { page: 98, surah: "An-Nisa'", start: 122, end: 127 },
  { page: 99, surah: "An-Nisa'", start: 128, end: 134 },
  { page: 100, surah: "An-Nisa'", start: 135, end: 140 },
  { page: 101, surah: "An-Nisa'", start: 141, end: 147 },
  // Juz 6
  { page: 102, surah: "An-Nisa'", start: 148, end: 154 },
  { page: 103, surah: "An-Nisa'", start: 155, end: 162 },
  { page: 104, surah: "An-Nisa'", start: 163, end: 170 },
  { page: 105, surah: "An-Nisa'", start: 171, end: 175 },
  { page: 106, surah: "An-Nisa'", start: 176, end: 176 },
  { page: 106, surah: "Al-Ma'idah", start: 1, end: 2 },
  { page: 107, surah: "Al-Ma'idah", start: 3, end: 5 },
  { page: 108, surah: "Al-Ma'idah", start: 6, end: 9 },
  { page: 109, surah: "Al-Ma'idah", start: 10, end: 13 },
  { page: 110, surah: "Al-Ma'idah", start: 14, end: 17 },
  { page: 111, surah: "Al-Ma'idah", start: 18, end: 23 },
  { page: 112, surah: "Al-Ma'idah", start: 24, end: 31 },
  { page: 113, surah: "Al-Ma'idah", start: 32, end: 36 },
  { page: 114, surah: "Al-Ma'idah", start: 37, end: 41 },
  { page: 115, surah: "Al-Ma'idah", start: 42, end: 45 },
  { page: 116, surah: "Al-Ma'idah", start: 46, end: 50 },
  { page: 117, surah: "Al-Ma'idah", start: 51, end: 57 },
  { page: 118, surah: "Al-Ma'idah", start: 58, end: 64 },
  { page: 119, surah: "Al-Ma'idah", start: 65, end: 70 },
  { page: 120, surah: "Al-Ma'idah", start: 71, end: 76 },
  { page: 121, surah: "Al-Ma'idah", start: 77, end: 82 },
  // Juz 7
  { page: 122, surah: "Al-Ma'idah", start: 83, end: 89 },
  { page: 123, surah: "Al-Ma'idah", start: 90, end: 95 },
  { page: 124, surah: "Al-Ma'idah", start: 96, end: 103 },
  { page: 125, surah: "Al-Ma'idah", start: 104, end: 108 },
  { page: 126, surah: "Al-Ma'idah", start: 109, end: 113 },
  { page: 127, surah: "Al-Ma'idah", start: 114, end: 120 },
  { page: 128, surah: "Al-An'am", start: 1, end: 8 },
  { page: 129, surah: "Al-An'am", start: 9, end: 18 },
  { page: 130, surah: "Al-An'am", start: 19, end: 27 },
  { page: 131, surah: "Al-An'am", start: 28, end: 35 },
  { page: 132, surah: "Al-An'am", start: 36, end: 44 },
  { page: 133, surah: "Al-An'am", start: 45, end: 52 },
  { page: 134, surah: "Al-An'am", start: 53, end: 59 },
  { page: 135, surah: "Al-An'am", start: 60, end: 68 },
  { page: 136, surah: "Al-An'am", start: 69, end: 73 },
  { page: 137, surah: "Al-An'am", start: 74, end: 81 },
  { page: 138, surah: "Al-An'am", start: 82, end: 90 },
  { page: 139, surah: "Al-An'am", start: 91, end: 94 },
  { page: 140, surah: "Al-An'am", start: 95, end: 101 },
  { page: 141, surah: "Al-An'am", start: 102, end: 110 },
  // Juz 8
  { page: 142, surah: "Al-An'am", start: 111, end: 118 },
  { page: 143, surah: "Al-An'am", start: 119, end: 124 },
  { page: 144, surah: "Al-An'am", start: 125, end: 131 },
  { page: 145, surah: "Al-An'am", start: 132, end: 137 },
  { page: 146, surah: "Al-An'am", start: 138, end: 142 },
  { page: 147, surah: "Al-An'am", start: 143, end: 146 },
  { page: 148, surah: "Al-An'am", start: 147, end: 151 },
  { page: 149, surah: "Al-An'am", start: 152, end: 157 },
  { page: 150, surah: "Al-An'am", start: 158, end: 165 },
  { page: 151, surah: "Al-A'raf", start: 1, end: 11 },
  { page: 152, surah: "Al-A'raf", start: 12, end: 22 },
  { page: 153, surah: "Al-A'raf", start: 23, end: 30 },
  { page: 154, surah: "Al-A'raf", start: 31, end: 37 },
  { page: 155, surah: "Al-A'raf", start: 38, end: 43 },
  { page: 156, surah: "Al-A'raf", start: 44, end: 51 },
  { page: 157, surah: "Al-A'raf", start: 52, end: 57 },
  { page: 158, surah: "Al-A'raf", start: 58, end: 67 },
  { page: 159, surah: "Al-A'raf", start: 68, end: 73 },
  { page: 160, surah: "Al-A'raf", start: 74, end: 81 },
  { page: 161, surah: "Al-A'raf", start: 82, end: 87 },
  // Juz 9
  { page: 162, surah: "Al-A'raf", start: 88, end: 95 },
  { page: 163, surah: "Al-A'raf", start: 96, end: 104 },
  { page: 164, surah: "Al-A'raf", start: 105, end: 120 },
  { page: 165, surah: "Al-A'raf", start: 121, end: 130 },
  { page: 166, surah: "Al-A'raf", start: 131, end: 137 },
  { page: 167, surah: "Al-A'raf", start: 138, end: 143 },
  { page: 168, surah: "Al-A'raf", start: 144, end: 149 },
  { page: 169, surah: "Al-A'raf", start: 150, end: 155 },
  { page: 170, surah: "Al-A'raf", start: 156, end: 159 },
  { page: 171, surah: "Al-A'raf", start: 160, end: 163 },
  { page: 172, surah: "Al-A'raf", start: 164, end: 170 },
  { page: 173, surah: "Al-A'raf", start: 171, end: 178 },
  { page: 174, surah: "Al-A'raf", start: 179, end: 187 },
  { page: 175, surah: "Al-A'raf", start: 188, end: 195 },
  { page: 176, surah: "Al-A'raf", start: 196, end: 206 },
  { page: 177, surah: "Al-Anfal", start: 1, end: 8 },
  { page: 178, surah: "Al-Anfal", start: 9, end: 16 },
  { page: 179, surah: "Al-Anfal", start: 17, end: 25 },
  { page: 180, surah: "Al-Anfal", start: 26, end: 33 },
  { page: 181, surah: "Al-Anfal", start: 34, end: 40 },
  // Juz 10
  { page: 182, surah: "Al-Anfal", start: 41, end: 45 },
  { page: 183, surah: "Al-Anfal", start: 46, end: 52 },
  { page: 184, surah: "Al-Anfal", start: 53, end: 61 },
  { page: 185, surah: "Al-Anfal", start: 62, end: 69 },
  { page: 186, surah: "Al-Anfal", start: 70, end: 75 },
  { page: 187, surah: "At-Taubah", start: 1, end: 6 },
  { page: 188, surah: "At-Taubah", start: 7, end: 13 },
  { page: 189, surah: "At-Taubah", start: 14, end: 20 },
  { page: 190, surah: "At-Taubah", start: 21, end: 26 },
  { page: 191, surah: "At-Taubah", start: 27, end: 31 },
  { page: 192, surah: "At-Taubah", start: 32, end: 36 },
  { page: 193, surah: "At-Taubah", start: 37, end: 40 },
  { page: 194, surah: "At-Taubah", start: 41, end: 47 },
  { page: 195, surah: "At-Taubah", start: 48, end: 54 },
  { page: 196, surah: "At-Taubah", start: 55, end: 61 },
  { page: 197, surah: "At-Taubah", start: 62, end: 68 },
  { page: 198, surah: "At-Taubah", start: 69, end: 72 },
  { page: 199, surah: "At-Taubah", start: 73, end: 79 },
  { page: 200, surah: "At-Taubah", start: 80, end: 86 },
  { page: 201, surah: "At-Taubah", start: 87, end: 93 },
  // Juz 11
  { page: 202, surah: "At-Taubah", start: 94, end: 99 },
  { page: 203, surah: "At-Taubah", start: 100, end: 106 },
  { page: 204, surah: "At-Taubah", start: 107, end: 111 },
  { page: 205, surah: "At-Taubah", start: 112, end: 117 },
  { page: 206, surah: "At-Taubah", start: 118, end: 122 },
  { page: 207, surah: "At-Taubah", start: 123, end: 129 },
  { page: 208, surah: "Yunus", start: 1, end: 6 },
  { page: 209, surah: "Yunus", start: 7, end: 14 },
  { page: 210, surah: "Yunus", start: 15, end: 20 },
  { page: 211, surah: "Yunus", start: 21, end: 25 },
  { page: 212, surah: "Yunus", start: 26, end: 33 },
  { page: 213, surah: "Yunus", start: 34, end: 42 },
  { page: 214, surah: "Yunus", start: 43, end: 53 },
  { page: 215, surah: "Yunus", start: 54, end: 61 },
  { page: 216, surah: "Yunus", start: 62, end: 70 },
  { page: 217, surah: "Yunus", start: 71, end: 78 },
  { page: 218, surah: "Yunus", start: 79, end: 88 },
  { page: 219, surah: "Yunus", start: 89, end: 97 },
  { page: 220, surah: "Yunus", start: 98, end: 106 },
  { page: 221, surah: "Yunus", start: 107, end: 109 },
  { page: 221, surah: "Hud", start: 1, end: 5 },
  // Juz 12
  { page: 222, surah: "Hud", start: 6, end: 12 },
  { page: 223, surah: "Hud", start: 13, end: 19 },
  { page: 224, surah: "Hud", start: 20, end: 28 },
  { page: 225, surah: "Hud", start: 29, end: 37 },
  { page: 226, surah: "Hud", start: 38, end: 45 },
  { page: 227, surah: "Hud", start: 46, end: 53 },
  { page: 228, surah: "Hud", start: 54, end: 62 },
  { page: 229, surah: "Hud", start: 63, end: 71 },
  { page: 230, surah: "Hud", start: 72, end: 81 },
  { page: 231, surah: "Hud", start: 82, end: 88 },
  { page: 232, surah: "Hud", start: 89, end: 97 },
  { page: 233, surah: "Hud", start: 98, end: 108 },
  { page: 234, surah: "Hud", start: 109, end: 117 },
  { page: 235, surah: "Hud", start: 118, end: 123 },
  { page: 235, surah: "Yusuf", start: 1, end: 4 },
  { page: 236, surah: "Yusuf", start: 5, end: 14 },
  { page: 237, surah: "Yusuf", start: 15, end: 22 },
  { page: 238, surah: "Yusuf", start: 23, end: 30 },
  { page: 239, surah: "Yusuf", start: 31, end: 37 },
  { page: 240, surah: "Yusuf", start: 38, end: 43 },
  { page: 241, surah: "Yusuf", start: 44, end: 52 },
  // Juz 13
  { page: 242, surah: "Yusuf", start: 53, end: 63 },
  { page: 243, surah: "Yusuf", start: 64, end: 69 },
  { page: 244, surah: "Yusuf", start: 70, end: 78 },
  { page: 245, surah: "Yusuf", start: 79, end: 86 },
  { page: 246, surah: "Yusuf", start: 87, end: 95 },
  { page: 247, surah: "Yusuf", start: 96, end: 103 },
  { page: 248, surah: "Yusuf", start: 104, end: 111 },
  { page: 249, surah: "Ar-Ra'd", start: 1, end: 5 },
  { page: 250, surah: "Ar-Ra'd", start: 6, end: 13 },
  { page: 251, surah: "Ar-Ra'd", start: 14, end: 18 },
  { page: 252, surah: "Ar-Ra'd", start: 19, end: 28 },
  { page: 253, surah: "Ar-Ra'd", start: 29, end: 34 },
  { page: 254, surah: "Ar-Ra'd", start: 35, end: 42 },
  { page: 255, surah: "Ar-Ra'd", start: 43, end: 43 },
  { page: 255, surah: "Ibrahim", start: 1, end: 5 },
  { page: 256, surah: "Ibrahim", start: 6, end: 10 },
  { page: 257, surah: "Ibrahim", start: 11, end: 18 },
  { page: 258, surah: "Ibrahim", start: 19, end: 24 },
  { page: 259, surah: "Ibrahim", start: 25, end: 33 },
  { page: 260, surah: "Ibrahim", start: 34, end: 42 },
  { page: 261, surah: "Ibrahim", start: 43, end: 52 },
  // Juz 14
  { page: 262, surah: "Al-Hijr", start: 1, end: 15 },
  { page: 263, surah: "Al-Hijr", start: 16, end: 31 },
  { page: 264, surah: "Al-Hijr", start: 32, end: 51 },
  { page: 265, surah: "Al-Hijr", start: 52, end: 70 },
  { page: 266, surah: "Al-Hijr", start: 71, end: 90 },
  { page: 267, surah: "Al-Hijr", start: 91, end: 99 },
  { page: 267, surah: "An-Nahl", start: 1, end: 6 },
  { page: 268, surah: "An-Nahl", start: 7, end: 14 },
  { page: 269, surah: "An-Nahl", start: 15, end: 26 },
  { page: 270, surah: "An-Nahl", start: 27, end: 34 },
  { page: 271, surah: "An-Nahl", start: 35, end: 42 },
  { page: 272, surah: "An-Nahl", start: 43, end: 54 },
  { page: 273, surah: "An-Nahl", start: 55, end: 64 },
  { page: 274, surah: "An-Nahl", start: 65, end: 72 },
  { page: 275, surah: "An-Nahl", start: 73, end: 79 },
  { page: 276, surah: "An-Nahl", start: 80, end: 87 },
  { page: 277, surah: "An-Nahl", start: 88, end: 93 },
  { page: 278, surah: "An-Nahl", start: 94, end: 102 },
  { page: 279, surah: "An-Nahl", start: 103, end: 110 },
  { page: 280, surah: "An-Nahl", start: 111, end: 118 },
  { page: 281, surah: "An-Nahl", start: 119, end: 128 },
  // Juz 15
  { page: 282, surah: "Al-Isra'", start: 1, end: 7 },
  { page: 283, surah: "Al-Isra'", start: 8, end: 17 },
  { page: 284, surah: "Al-Isra'", start: 18, end: 27 },
  { page: 285, surah: "Al-Isra'", start: 28, end: 38 },
  { page: 286, surah: "Al-Isra'", start: 39, end: 49 },
  { page: 287, surah: "Al-Isra'", start: 50, end: 58 },
  { page: 288, surah: "Al-Isra'", start: 59, end: 66 },
  { page: 289, surah: "Al-Isra'", start: 67, end: 75 },
  { page: 290, surah: "Al-Isra'", start: 76, end: 86 },
  { page: 291, surah: "Al-Isra'", start: 87, end: 96 },
  { page: 292, surah: "Al-Isra'", start: 97, end: 104 },
  { page: 293, surah: "Al-Isra'", start: 105, end: 111 },
  { page: 293, surah: "Al-Kahf", start: 1, end: 4 },
  { page: 294, surah: "Al-Kahf", start: 5, end: 15 },
  { page: 295, surah: "Al-Kahf", start: 16, end: 20 },
  { page: 296, surah: "Al-Kahf", start: 21, end: 27 },
  { page: 297, surah: "Al-Kahf", start: 28, end: 34 },
  { page: 298, surah: "Al-Kahf", start: 35, end: 45 },
  { page: 299, surah: "Al-Kahf", start: 46, end: 53 },
  { page: 300, surah: "Al-Kahf", start: 54, end: 61 },
  { page: 301, surah: "Al-Kahf", start: 62, end: 74 },
  // Juz 16
  { page: 302, surah: "Al-Kahf", start: 75, end: 83 },
  { page: 303, surah: "Al-Kahf", start: 84, end: 97 },
  { page: 304, surah: "Al-Kahf", start: 98, end: 110 },
  { page: 305, surah: "Maryam", start: 1, end: 11 },
  { page: 306, surah: "Maryam", start: 12, end: 25 },
  { page: 307, surah: "Maryam", start: 26, end: 38 },
  { page: 308, surah: "Maryam", start: 39, end: 51 },
  { page: 309, surah: "Maryam", start: 52, end: 64 },
  { page: 310, surah: "Maryam", start: 65, end: 76 },
  { page: 311, surah: "Maryam", start: 77, end: 95 },
  { page: 312, surah: "Maryam", start: 96, end: 98 },
  { page: 312, surah: "Ta-Ha", start: 1, end: 12 },
  { page: 313, surah: "Ta-Ha", start: 13, end: 37 },
  { page: 314, surah: "Ta-Ha", start: 38, end: 51 },
  { page: 315, surah: "Ta-Ha", start: 52, end: 64 },
  { page: 316, surah: "Ta-Ha", start: 65, end: 76 },
  { page: 317, surah: "Ta-Ha", start: 77, end: 87 },
  { page: 318, surah: "Ta-Ha", start: 88, end: 98 },
  { page: 319, surah: "Ta-Ha", start: 99, end: 113 },
  { page: 320, surah: "Ta-Ha", start: 114, end: 125 },
  { page: 321, surah: "Ta-Ha", start: 126, end: 135 },
  // Juz 17
  { page: 322, surah: "Al-Anbiya'", start: 1, end: 10 },
  { page: 323, surah: "Al-Anbiya'", start: 11, end: 24 },
  { page: 324, surah: "Al-Anbiya'", start: 25, end: 35 },
  { page: 325, surah: "Al-Anbiya'", start: 36, end: 44 },
  { page: 326, surah: "Al-Anbiya'", start: 45, end: 57 },
  { page: 327, surah: "Al-Anbiya'", start: 58, end: 72 },
  { page: 328, surah: "Al-Anbiya'", start: 73, end: 81 },
  { page: 329, surah: "Al-Anbiya'", start: 82, end: 90 },
  { page: 330, surah: "Al-Anbiya'", start: 91, end: 101 },
  { page: 331, surah: "Al-Anbiya'", start: 102, end: 112 },
  { page: 332, surah: "Al-Hajj", start: 1, end: 5 },
  { page: 333, surah: "Al-Hajj", start: 6, end: 15 },
  { page: 334, surah: "Al-Hajj", start: 16, end: 23 },
  { page: 335, surah: "Al-Hajj", start: 24, end: 30 },
  { page: 336, surah: "Al-Hajj", start: 31, end: 38 },
  { page: 337, surah: "Al-Hajj", start: 39, end: 46 },
  { page: 338, surah: "Al-Hajj", start: 47, end: 55 },
  { page: 339, surah: "Al-Hajj", start: 56, end: 64 },
  { page: 340, surah: "Al-Hajj", start: 65, end: 72 },
  { page: 341, surah: "Al-Hajj", start: 73, end: 78 },
  // Juz 18
  { page: 342, surah: "Al-Mu'minun", start: 1, end: 17 },
  { page: 343, surah: "Al-Mu'minun", start: 18, end: 27 },
  { page: 344, surah: "Al-Mu'minun", start: 28, end: 42 },
  { page: 345, surah: "Al-Mu'minun", start: 43, end: 59 },
  { page: 346, surah: "Al-Mu'minun", start: 60, end: 74 },
  { page: 347, surah: "Al-Mu'minun", start: 75, end: 89 },
  { page: 348, surah: "Al-Mu'minun", start: 90, end: 104 },
  { page: 349, surah: "Al-Mu'minun", start: 105, end: 118 },
  { page: 350, surah: "An-Nur", start: 1, end: 10 },
  { page: 351, surah: "An-Nur", start: 11, end: 20 },
  { page: 352, surah: "An-Nur", start: 21, end: 27 },
  { page: 353, surah: "An-Nur", start: 28, end: 31 },
  { page: 354, surah: "An-Nur", start: 32, end: 36 },
  { page: 355, surah: "An-Nur", start: 37, end: 43 },
  { page: 356, surah: "An-Nur", start: 44, end: 53 },
  { page: 357, surah: "An-Nur", start: 54, end: 58 },
  { page: 358, surah: "An-Nur", start: 59, end: 61 },
  { page: 359, surah: "An-Nur", start: 62, end: 64 },
  { page: 359, surah: "Al-Furqan", start: 1, end: 2 },
  { page: 360, surah: "Al-Furqan", start: 3, end: 11 },
  { page: 361, surah: "Al-Furqan", start: 12, end: 20 },
  // Juz 19
  { page: 362, surah: "Al-Furqan", start: 21, end: 32 },
  { page: 363, surah: "Al-Furqan", start: 33, end: 43 },
  { page: 364, surah: "Al-Furqan", start: 44, end: 55 },
  { page: 365, surah: "Al-Furqan", start: 56, end: 67 },
  { page: 366, surah: "Al-Furqan", start: 68, end: 77 },
  { page: 367, surah: "Asy-Syu'ara'", start: 1, end: 19 },
  { page: 368, surah: "Asy-Syu'ara'", start: 20, end: 39 },
  { page: 369, surah: "Asy-Syu'ara'", start: 40, end: 60 },
  { page: 370, surah: "Asy-Syu'ara'", start: 61, end: 83 },
  { page: 371, surah: "Asy-Syu'ara'", start: 84, end: 111 },
  { page: 372, surah: "Asy-Syu'ara'", start: 112, end: 136 },
  { page: 373, surah: "Asy-Syu'ara'", start: 137, end: 159 },
  { page: 374, surah: "Asy-Syu'ara'", start: 160, end: 183 },
  { page: 375, surah: "Asy-Syu'ara'", start: 184, end: 206 },
  { page: 376, surah: "Asy-Syu'ara'", start: 207, end: 227 },
  { page: 377, surah: "An-Naml", start: 1, end: 13 },
  { page: 378, surah: "An-Naml", start: 14, end: 22 },
  { page: 379, surah: "An-Naml", start: 23, end: 35 },
  { page: 380, surah: "An-Naml", start: 36, end: 44 },
  { page: 381, surah: "An-Naml", start: 45, end: 55 },
  // Juz 20
  { page: 382, surah: "An-Naml", start: 56, end: 63 },
  { page: 383, surah: "An-Naml", start: 64, end: 76 },
  { page: 384, surah: "An-Naml", start: 77, end: 88 },
  { page: 385, surah: "An-Naml", start: 89, end: 93 },
  { page: 385, surah: "Al-Qasas", start: 1, end: 5 },
  { page: 386, surah: "Al-Qasas", start: 6, end: 13 },
  { page: 387, surah: "Al-Qasas", start: 14, end: 21 },
  { page: 388, surah: "Al-Qasas", start: 22, end: 28 },
  { page: 389, surah: "Al-Qasas", start: 29, end: 35 },
  { page: 390, surah: "Al-Qasas", start: 36, end: 43 },
  { page: 391, surah: "Al-Qasas", start: 44, end: 50 },
  { page: 392, surah: "Al-Qasas", start: 51, end: 59 },
  { page: 393, surah: "Al-Qasas", start: 60, end: 70 },
  { page: 394, surah: "Al-Qasas", start: 71, end: 77 },
  { page: 395, surah: "Al-Qasas", start: 78, end: 84 },
  { page: 396, surah: "Al-Qasas", start: 85, end: 88 },
  { page: 396, surah: "Al-'Ankabut", start: 1, end: 6 },
  { page: 397, surah: "Al-'Ankabut", start: 7, end: 14 },
  { page: 398, surah: "Al-'Ankabut", start: 15, end: 23 },
  { page: 399, surah: "Al-'Ankabut", start: 24, end: 30 },
  { page: 400, surah: "Al-'Ankabut", start: 31, end: 38 },
  { page: 401, surah: "Al-'Ankabut", start: 39, end: 45 },
  // Juz 21
  { page: 402, surah: "Al-'Ankabut", start: 46, end: 52 },
  { page: 403, surah: "Al-'Ankabut", start: 53, end: 63 },
  { page: 404, surah: "Al-'Ankabut", start: 64, end: 69 },
  { page: 404, surah: "Ar-Rum", start: 1, end: 5 },
  { page: 405, surah: "Ar-Rum", start: 6, end: 15 },
  { page: 406, surah: "Ar-Rum", start: 16, end: 24 },
  { page: 407, surah: "Ar-Rum", start: 25, end: 32 },
  { page: 408, surah: "Ar-Rum", start: 33, end: 41 },
  { page: 409, surah: "Ar-Rum", start: 42, end: 50 },
  { page: 410, surah: "Ar-Rum", start: 51, end: 60 },
  { page: 411, surah: "Luqman", start: 1, end: 11 },
  { page: 412, surah: "Luqman", start: 12, end: 19 },
  { page: 413, surah: "Luqman", start: 20, end: 28 },
  { page: 414, surah: "Luqman", start: 29, end: 34 },
  { page: 415, surah: "As-Sajdah", start: 1, end: 11 },
  { page: 416, surah: "As-Sajdah", start: 12, end: 20 },
  { page: 417, surah: "As-Sajdah", start: 21, end: 30 },
  { page: 418, surah: "Al-Ahzab", start: 1, end: 6 },
  { page: 419, surah: "Al-Ahzab", start: 7, end: 15 },
  { page: 420, surah: "Al-Ahzab", start: 16, end: 22 },
  { page: 421, surah: "Al-Ahzab", start: 23, end: 30 },
  // Juz 22
  { page: 422, surah: "Al-Ahzab", start: 31, end: 35 },
  { page: 423, surah: "Al-Ahzab", start: 36, end: 43 },
  { page: 424, surah: "Al-Ahzab", start: 44, end: 50 },
  { page: 425, surah: "Al-Ahzab", start: 51, end: 54 },
  { page: 426, surah: "Al-Ahzab", start: 55, end: 62 },
  { page: 427, surah: "Al-Ahzab", start: 63, end: 73 },
  { page: 428, surah: "Saba'", start: 1, end: 7 },
  { page: 429, surah: "Saba'", start: 8, end: 14 },
  { page: 430, surah: "Saba'", start: 15, end: 22 },
  { page: 431, surah: "Saba'", start: 23, end: 31 },
  { page: 432, surah: "Saba'", start: 32, end: 39 },
  { page: 433, surah: "Saba'", start: 40, end: 48 },
  { page: 434, surah: "Saba'", start: 49, end: 54 },
  { page: 434, surah: "Fatir", start: 1, end: 3 },
  { page: 435, surah: "Fatir", start: 4, end: 11 },
  { page: 436, surah: "Fatir", start: 12, end: 18 },
  { page: 437, surah: "Fatir", start: 19, end: 30 },
  { page: 438, surah: "Fatir", start: 31, end: 38 },
  { page: 439, surah: "Fatir", start: 39, end: 44 },
  { page: 440, surah: "Fatir", start: 45, end: 45 },
  { page: 440, surah: "Ya-Sin", start: 1, end: 12 },
  { page: 441, surah: "Ya-Sin", start: 13, end: 27 },
  // Juz 23
  { page: 442, surah: "Ya-Sin", start: 28, end: 40 },
  { page: 443, surah: "Ya-Sin", start: 41, end: 54 },
  { page: 444, surah: "Ya-Sin", start: 55, end: 70 },
  { page: 445, surah: "Ya-Sin", start: 71, end: 83 },
  { page: 446, surah: "As-Saffat", start: 1, end: 24 },
  { page: 447, surah: "As-Saffat", start: 25, end: 51 },
  { page: 448, surah: "As-Saffat", start: 52, end: 76 },
  { page: 449, surah: "As-Saffat", start: 77, end: 102 },
  { page: 450, surah: "As-Saffat", start: 103, end: 126 },
  { page: 451, surah: "As-Saffat", start: 127, end: 153 },
  { page: 452, surah: "As-Saffat", start: 154, end: 182 },
  { page: 453, surah: "Sad", start: 1, end: 16 },
  { page: 454, surah: "Sad", start: 17, end: 26 },
  { page: 455, surah: "Sad", start: 27, end: 42 },
  { page: 456, surah: "Sad", start: 43, end: 61 },
  { page: 457, surah: "Sad", start: 62, end: 83 },
  { page: 458, surah: "Sad", start: 84, end: 88 },
  { page: 458, surah: "Az-Zumar", start: 1, end: 5 },
  { page: 459, surah: "Az-Zumar", start: 6, end: 10 },
  { page: 460, surah: "Az-Zumar", start: 11, end: 21 },
  { page: 461, surah: "Az-Zumar", start: 22, end: 31 },
  // Juz 24
  { page: 462, surah: "Az-Zumar", start: 32, end: 40 },
  { page: 463, surah: "Az-Zumar", start: 41, end: 47 },
  { page: 464, surah: "Az-Zumar", start: 48, end: 56 },
  { page: 465, surah: "Az-Zumar", start: 57, end: 67 },
  { page: 466, surah: "Az-Zumar", start: 68, end: 74 },
  { page: 467, surah: "Az-Zumar", start: 75, end: 75 },
  { page: 467, surah: "Ghafir", start: 1, end: 7 },
  { page: 468, surah: "Ghafir", start: 8, end: 16 },
  { page: 469, surah: "Ghafir", start: 17, end: 25 },
  { page: 470, surah: "Ghafir", start: 26, end: 33 },
  { page: 471, surah: "Ghafir", start: 34, end: 40 },
  { page: 472, surah: "Ghafir", start: 41, end: 49 },
  { page: 473, surah: "Ghafir", start: 50, end: 58 },
  { page: 474, surah: "Ghafir", start: 59, end: 66 },
  { page: 475, surah: "Ghafir", start: 67, end: 77 },
  { page: 476, surah: "Ghafir", start: 78, end: 85 },
  { page: 477, surah: "Fussilat", start: 1, end: 11 },
  { page: 478, surah: "Fussilat", start: 12, end: 20 },
  { page: 479, surah: "Fussilat", start: 21, end: 29 },
  { page: 480, surah: "Fussilat", start: 30, end: 38 },
  { page: 481, surah: "Fussilat", start: 39, end: 46 },
  // Juz 25
  { page: 482, surah: "Fussilat", start: 47, end: 54 },
  { page: 483, surah: "Asy-Syura", start: 1, end: 10 },
  { page: 484, surah: "Asy-Syura", start: 11, end: 15 },
  { page: 485, surah: "Asy-Syura", start: 16, end: 22 },
  { page: 486, surah: "Asy-Syura", start: 23, end: 31 },
  { page: 487, surah: "Asy-Syura", start: 32, end: 44 },
  { page: 488, surah: "Asy-Syura", start: 45, end: 51 },
  { page: 489, surah: "Asy-Syura", start: 52, end: 53 },
  { page: 489, surah: "Az-Zukhruf", start: 1, end: 10 },
  { page: 490, surah: "Az-Zukhruf", start: 11, end: 22 },
  { page: 491, surah: "Az-Zukhruf", start: 23, end: 33 },
  { page: 492, surah: "Az-Zukhruf", start: 34, end: 47 },
  { page: 493, surah: "Az-Zukhruf", start: 48, end: 60 },
  { page: 494, surah: "Az-Zukhruf", start: 61, end: 73 },
  { page: 495, surah: "Az-Zukhruf", start: 74, end: 89 },
  { page: 496, surah: "Ad-Dukhan", start: 1, end: 18 },
  { page: 497, surah: "Ad-Dukhan", start: 19, end: 39 },
  { page: 498, surah: "Ad-Dukhan", start: 40, end: 59 },
  { page: 499, surah: "Al-Jasiyah", start: 1, end: 13 },
  { page: 500, surah: "Al-Jasiyah", start: 14, end: 22 },
  { page: 501, surah: "Al-Jasiyah", start: 23, end: 32 },
  { page: 502, surah: "Al-Jasiyah", start: 33, end: 37 },
  { page: 502, surah: "Al-Ahqaf", start: 1, end: 5 },
  // Juz 26
  { page: 503, surah: "Al-Ahqaf", start: 6, end: 14 },
  { page: 504, surah: "Al-Ahqaf", start: 15, end: 20 },
  { page: 505, surah: "Al-Ahqaf", start: 21, end: 28 },
  { page: 506, surah: "Al-Ahqaf", start: 29, end: 35 },
  { page: 507, surah: "Muhammad", start: 1, end: 11 },
  { page: 508, surah: "Muhammad", start: 12, end: 19 },
  { page: 509, surah: "Muhammad", start: 20, end: 29 },
  { page: 510, surah: "Muhammad", start: 30, end: 38 },
  { page: 511, surah: "Al-Fath", start: 1, end: 9 },
  { page: 512, surah: "Al-Fath", start: 11, end: 15 },
  { page: 513, surah: "Al-Fath", start: 16, end: 23 },
  { page: 514, surah: "Al-Fath", start: 24, end: 28 },
  { page: 515, surah: "Al-Fath", start: 29, end: 29 },
  { page: 515, surah: "Al-Hujurat", start: 1, end: 4 },
  { page: 516, surah: "Al-Hujurat", start: 5, end: 11 },
  { page: 517, surah: "Al-Hujurat", start: 12, end: 18 },
  { page: 518, surah: "Qaf", start: 1, end: 15 },
  { page: 519, surah: "Qaf", start: 16, end: 35 },
  { page: 520, surah: "Qaf", start: 36, end: 45 },
  { page: 520, surah: "Adz-Dzariyat", start: 1, end: 6 },
  { page: 521, surah: "Adz-Dzariyat", start: 7, end: 30 },
  // Juz 27
  { page: 522, surah: "Adz-Dzariyat", start: 31, end: 51 },
  { page: 523, surah: "Adz-Dzariyat", start: 52, end: 60 },
  { page: 523, surah: "At-Tur", start: 1, end: 14 },
  { page: 524, surah: "At-Tur", start: 15, end: 31 },
  { page: 525, surah: "At-Tur", start: 32, end: 49 },
  { page: 526, surah: "An-Najm", start: 1, end: 26 },
  { page: 527, surah: "An-Najm", start: 27, end: 44 },
  { page: 528, surah: "An-Najm", start: 45, end: 62 },
  { page: 528, surah: "Al-Qamar", start: 1, end: 6 },
  { page: 529, surah: "Al-Qamar", start: 7, end: 27 },
  { page: 530, surah: "Al-Qamar", start: 28, end: 49 },
  { page: 531, surah: "Al-Qamar", start: 50, end: 55 },
  { page: 531, surah: "Ar-Rahman", start: 1, end: 18 },
  { page: 532, surah: "Ar-Rahman", start: 19, end: 40 },
  { page: 533, surah: "Ar-Rahman", start: 41, end: 67 },
  { page: 534, surah: "Ar-Rahman", start: 68, end: 78 },
  { page: 534, surah: "Al-Waqi'ah", start: 1, end: 16 },
  { page: 535, surah: "Al-Waqi'ah", start: 17, end: 50 },
  { page: 536, surah: "Al-Waqi'ah", start: 51, end: 76 },
  { page: 537, surah: "Al-Waqi'ah", start: 77, end: 96 },
  { page: 537, surah: "Al-Hadid", start: 1, end: 3 },
  { page: 538, surah: "Al-Hadid", start: 5, end: 11 },
  { page: 539, surah: "Al-Hadid", start: 12, end: 18 },
  { page: 540, surah: "Al-Hadid", start: 19, end: 24 },
  { page: 541, surah: "Al-Hadid", start: 25, end: 29 },
  // Juz 28
  { page: 542, surah: "Al-Mujadilah", start: 1, end: 6 },
  { page: 543, surah: "Al-Mujadilah", start: 7, end: 11 },
  { page: 544, surah: "Al-Mujadilah", start: 12, end: 21 },
  { page: 545, surah: "Al-Mujadilah", start: 22, end: 22 },
  { page: 545, surah: "Al-Hasyr", start: 1, end: 3 },
  { page: 546, surah: "Al-Hasyr", start: 4, end: 9 },
  { page: 547, surah: "Al-Hasyr", start: 10, end: 16 },
  { page: 548, surah: "Al-Hasyr", start: 17, end: 24 },
  { page: 549, surah: "Al-Mumtahanah", start: 1, end: 5 },
  { page: 550, surah: "Al-Mumtahanah", start: 6, end: 11 },
  { page: 551, surah: "Al-Mumtahanah", start: 12, end: 13 },
  { page: 551, surah: "As-Saff", start: 1, end: 5 },
  { page: 552, surah: "As-Saff", start: 6, end: 14 },
  { page: 553, surah: "Al-Jumu'ah", start: 1, end: 8 },
  { page: 554, surah: "Al-Jumu'ah", start: 9, end: 11 },
  { page: 554, surah: "Al-Munafiqun", start: 1, end: 4 },
  { page: 555, surah: "Al-Munafiqun", start: 5, end: 11 },
  { page: 556, surah: "At-Taghabun", start: 1, end: 9 },
  { page: 557, surah: "At-Taghabun", start: 10, end: 18 },
  { page: 558, surah: "At-Talaq", start: 1, end: 5 },
  { page: 559, surah: "At-Talaq", start: 6, end: 12 },
  { page: 560, surah: "At-Tahrim", start: 1, end: 7 },
  { page: 561, surah: "At-Tahrim", start: 8, end: 12 },
  // Juz 29
  { page: 562, surah: "Al-Mulk", start: 1, end: 12 },
  { page: 563, surah: "Al-Mulk", start: 13, end: 26 },
  { page: 564, surah: "Al-Mulk", start: 27, end: 30 },
  { page: 564, surah: "Al-Qalam", start: 1, end: 15 },
  { page: 565, surah: "Al-Qalam", start: 16, end: 42 },
  { page: 566, surah: "Al-Qalam", start: 43, end: 52 },
  { page: 566, surah: "Al-Haqqah", start: 1, end: 8 },
  { page: 567, surah: "Al-Haqqah", start: 9, end: 34 },
  { page: 568, surah: "Al-Haqqah", start: 35, end: 52 },
  { page: 568, surah: "Al-Ma'arij", start: 1, end: 10 },
  { page: 569, surah: "Al-Ma'arij", start: 11, end: 39 },
  { page: 570, surah: "Al-Ma'arij", start: 40, end: 44 },
  { page: 570, surah: "Nuh", start: 1, end: 10 },
  { page: 571, surah: "Nuh", start: 11, end: 28 },
  { page: 572, surah: "Al-Jinn", start: 1, end: 13 },
  { page: 573, surah: "Al-Jinn", start: 14, end: 28 },
  { page: 574, surah: "Al-Muzzammil", start: 1, end: 19 },
  { page: 575, surah: "Al-Muzzammil", start: 20, end: 20 },
  { page: 575, surah: "Al-Muddassir", start: 1, end: 17 },
  { page: 576, surah: "Al-Muddassir", start: 18, end: 47 },
  { page: 577, surah: "Al-Muddassir", start: 48, end: 56 },
  { page: 577, surah: "Al-Qiyamah", start: 1, end: 19 },
  { page: 578, surah: "Al-Qiyamah", start: 20, end: 40 },
  { page: 578, surah: "Al-Insan", start: 1, end: 5 },
  { page: 579, surah: "Al-Insan", start: 6, end: 25 },
  { page: 580, surah: "Al-Insan", start: 26, end: 31 },
  { page: 580, surah: "Al-Mursalat", start: 1, end: 19 },
  { page: 581, surah: "Al-Mursalat", start: 20, end: 50 },
  // Juz 30
  { page: 582, surah: "An-Naba'", start: 1, end: 30 },
  { page: 583, surah: "An-Naba'", start: 31, end: 40 },
  { page: 583, surah: "An-Nazi'at", start: 1, end: 15 },
  { page: 584, surah: "An-Nazi'at", start: 16, end: 46 },
  { page: 585, surah: "'Abasa", start: 1, end: 42 },
  { page: 586, surah: "At-Takwir", start: 1, end: 29 },
  { page: 587, surah: "Al-Infitar", start: 1, end: 19 },
  { page: 587, surah: "Al-Muthaffifin", start: 1, end: 6 },
  { page: 588, surah: "Al-Muthaffifin", start: 7, end: 34 },
  { page: 589, surah: "Al-Muthaffifin", start: 35, end: 36 },
  { page: 589, surah: "Al-Insyiqaq", start: 1, end: 25 },
  { page: 590, surah: "Al-Buruj", start: 1, end: 22 },
  { page: 591, surah: "Ath-Thariq", start: 1, end: 17 },
  { page: 591, surah: "Al-A'la", start: 1, end: 15 },
  { page: 592, surah: "Al-A'la", start: 16, end: 19 },
  { page: 592, surah: "Al-Ghasyiyah", start: 1, end: 26 },
  { page: 593, surah: "Al-Fajr", start: 1, end: 23 },
  { page: 594, surah: "Al-Fajr", start: 24, end: 30 },
  { page: 594, surah: "Al-Balad", start: 1, end: 20 },
  { page: 595, surah: "Asy-Syams", start: 1, end: 15 },
  { page: 595, surah: "Al-Lail", start: 1, end: 14 },
  { page: 596, surah: "Al-Lail", start: 15, end: 21 },
  { page: 596, surah: "Ad-Duha", start: 1, end: 11 },
  { page: 596, surah: "Al-Insyirah", start: 1, end: 8 },
  { page: 597, surah: "At-Tin", start: 1, end: 8 },
  { page: 597, surah: "Al-'Alaq", start: 1, end: 19 },
  { page: 598, surah: "Al-Qadr", start: 1, end: 5 },
  { page: 598, surah: "Al-Bayyinah", start: 1, end: 7 },
  { page: 599, surah: "Al-Bayyinah", start: 8, end: 8 },
  { page: 599, surah: "Az-Zalzalah", start: 1, end: 8 },
  { page: 599, surah: "Al-'Adiyat", start: 1, end: 9 },
  { page: 600, surah: "Al-'Adiyat", start: 10, end: 11 },
  { page: 600, surah: "Al-Qari'ah", start: 1, end: 11 },
  { page: 600, surah: "At-Takatsur", start: 1, end: 8 },
  { page: 601, surah: "Al-'Asr", start: 1, end: 3 },
  { page: 601, surah: "Al-Humazah", start: 1, end: 9 },
  { page: 601, surah: "Al-Fil", start: 1, end: 5 },
  { page: 602, surah: "Quraisy", start: 1, end: 4 },
  { page: 602, surah: "Al-Ma'un", start: 1, end: 7 },
  { page: 602, surah: "Al-Kautsar", start: 1, end: 3 },
  { page: 603, surah: "Al-Kafirun", start: 1, end: 6 },
  { page: 603, surah: "An-Nasr", start: 1, end: 3 },
  { page: 603, surah: "Al-Lahab", start: 1, end: 5 },
  { page: 604, surah: "Al-Ikhlas", start: 1, end: 4 },
  { page: 604, surah: "Al-Falaq", start: 1, end: 5 },
  { page: 604, surah: "An-Nas", start: 1, end: 6 },
];

export const IQRA_MAPPING = [
  { volume: 1, pages: 31 },
  { volume: 2, pages: 30 },
  { volume: 3, pages: 30 },
  { volume: 4, pages: 30 },
  { volume: 5, pages: 30 },
  { volume: 6, pages: 31 },
];

// Helper to normalize strings for comparison (remove spaces, punctuation, lowercase)
const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

const getIqraVolume = (surahName: string): number | null => {
  const match = surahName.match(/iqra\s*'?\s*(\d+)/i);
  if (match) return parseInt(match[1]);
  return null;
};

// Calculate absolute page number for Iqra across volumes
const getIqraAbsolutePage = (volume: number, page: number): number => {
  let absolute = 0;
  for (let i = 0; i < volume - 1; i++) {
    absolute += IQRA_MAPPING[i].pages;
  }
  return absolute + page;
};

export const calculateHafalan = (
  fromSurah: string, 
  fromAyat: number, 
  toSurah: string, 
  toAyat: number
): { pages: number, lines: number } => {
  if (!fromSurah || !toSurah) return { pages: 0, lines: 0 };

  // --- IQRA LOGIC ---
  const fromIqraVol = getIqraVolume(fromSurah);
  const toIqraVol = getIqraVolume(toSurah);

  if (fromIqraVol !== null && toIqraVol !== null) {
    const startAbs = getIqraAbsolutePage(fromIqraVol, fromAyat); // "Ayat" here is Page for Iqra
    const endAbs = getIqraAbsolutePage(toIqraVol, toAyat);
    
    // Iqra is typically counted by pages, so we ignore lines logic
    // +1 because if I read from page 5 to page 5, I read 1 page.
    const diff = endAbs - startAbs + 1;
    return { pages: Math.max(0, diff), lines: 0 };
  }

  // --- QURAN LOGIC ---
  
  // Strip prefixes if present (e.g. "1. Al-Fatihah" -> "Al-Fatihah")
  const stripPrefix = (s: string) => s.replace(/^\d+\.\s*/, '').trim();
  const nFromSurah = normalize(stripPrefix(fromSurah));
  const nToSurah = normalize(stripPrefix(toSurah));

  // Find start and end page entries
  // We need to find the specific page entry that contains the verse.
  const startEntry = QURAN_MAPPING.find(entry => 
    normalize(entry.surah) === nFromSurah && fromAyat >= entry.start && fromAyat <= entry.end
  );
  
  const endEntry = QURAN_MAPPING.find(entry => 
    normalize(entry.surah) === nToSurah && toAyat >= entry.start && toAyat <= entry.end
  );

  if (!startEntry || !endEntry) {
    return { pages: 0, lines: 0 };
  }

  // Calculate Difference
  if (endEntry.page < startEntry.page) {
    return { pages: 0, lines: 0 }; // Invalid range
  }

  let totalLines = 0;

  if (startEntry.page === endEntry.page) {
    // Same page calculation
    const totalVersesOnPage = startEntry.end - startEntry.start + 1;
    const versesCovered = toAyat - fromAyat + 1;
    if (versesCovered > 0) {
      totalLines = (versesCovered / totalVersesOnPage) * 15;
    }
  } else {
    // Different pages
    
    // Lines on Start Page
    const startPageTotalVerses = startEntry.end - startEntry.start + 1;
    const startPageVersesCovered = startEntry.end - fromAyat + 1;
    const linesOnStart = (startPageVersesCovered / startPageTotalVerses) * 15;

    // Lines on End Page
    const endPageTotalVerses = endEntry.end - endEntry.start + 1;
    const endPageVersesCovered = toAyat - endEntry.start + 1;
    const linesOnEnd = (endPageVersesCovered / endPageTotalVerses) * 15;

    // Full Pages in between
    const fullPages = endEntry.page - startEntry.page - 1;
    const linesOnFullPages = Math.max(0, fullPages) * 15;

    totalLines = linesOnStart + linesOnEnd + linesOnFullPages;
  }
  
  const finalPages = Math.floor(totalLines / 15);
  const finalLines = Math.round(totalLines % 15);

  return { pages: finalPages, lines: finalLines };
};

export const calculateFromRangeString = (rangeStr: string): { pages: number, lines: number } => {
  // Format expected: "Surah: Start - Surah: End" 
  // We strictly look for " - " (space hyphen space) to avoid splitting hyphens inside Surah names (e.g. Al-Fatihah)
  if (!rangeStr || rangeStr.trim() === '-' || rangeStr.trim() === '') return { pages: 0, lines: 0 };

  // FIX: Split by " - " to preserve Surah names containing hyphens
  let parts = rangeStr.split(' - ').map(s => s.trim());
  
  // Fallback: If split by " - " failed (length 1), try splitting by "-" IF there are only 2 parts total
  // This is risky for "Al-Fatihah:1-Al-Fatihah:5", so we only do it if strict split failed.
  if (parts.length !== 2) {
      const strictParts = rangeStr.split('-');
      // Only use loose split if it results in exactly 2 parts (meaning no hyphen in Surah name)
      // e.g. "Yusuf:1-Yusuf:10" -> valid
      // e.g. "Al-Fatihah:1-Al-Fatihah:5" -> invalid (4 parts)
      if (strictParts.length === 2) {
          parts = strictParts.map(s => s.trim());
      } else {
          return { pages: 0, lines: 0 };
      }
  }

  const parseLocation = (s: string) => {
    // split by last space or colon
    // "Al-Baqarah: 1" -> ["Al-Baqarah", "1"]
    // "Ali 'Imran 10" -> ["Ali 'Imran", "10"]
    // "Iqra 5: 10" -> ["Iqra 5", "10"]
    // regex match greedy for name, specific for number at end
    const match = s.match(/^(.*?)[:\s]+(\d+)$/);
    if (match) {
      return { surah: match[1].trim(), ayat: parseInt(match[2]) };
    }
    return null;
  };

  const start = parseLocation(parts[0]);
  const end = parseLocation(parts[1]);

  if (start && end) {
    return calculateHafalan(start.surah, start.ayat, end.surah, end.ayat);
  }
  return { pages: 0, lines: 0 };
};
