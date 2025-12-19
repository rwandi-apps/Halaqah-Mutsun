import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

// ✅ WAJIB pakai import.meta.env (Vite)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ✅ Guard biar app TIDAK crash
if (!apiKey) {
  console.error("❌ VITE_GEMINI_API_KEY tidak ditemukan");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateStudentEvaluation = async (
  student: Student
): Promise<string> => {
  if (!ai) {
    return "Fitur AI belum aktif. API Key belum dikonfigurasi.";
  }

  try {
    const prompt = `
Anda adalah ustadz pembimbing Al-Qur’an di SDQ.
Buatkan laporan evaluasi murid dengan bahasa Indonesia yang sopan dan hangat.

Nama: ${student.name}
Kelas: ${student.className}
Target Hafalan: ${student.memorizationTarget}
Progres Saat Ini: ${student.currentProgress}
Kehadiran: ${student.attendance}%
Perilaku: ${student.behaviorScore}/10

Susun dengan:
1. Pencapaian Umum
2. Kelebihan
3. Area Perbaikan
4. Pesan untuk Orang Tua

Maksimal 200 kata.
`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    return response.text ?? "Evaluasi belum tersedia.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Terjadi kesalahan saat menghasilkan evaluasi.";
  }
};
