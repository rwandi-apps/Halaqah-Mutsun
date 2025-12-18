import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

/**
 * Inisialisasi Gemini Client menggunakan import.meta.env standar Vite.
 * Pastikan VITE_GEMINI_API_KEY sudah diset di Vercel Dashboard.
 */
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Check VITE_GEMINI_API_KEY in environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateStudentEvaluation = async (student: Student): Promise<string> => {
  try {
    const ai = getAiClient();
    
    const prompt = `
      Anda adalah pakar pendidik Al-Qur'an.
      Buatlah evaluasi naratif yang mendukung untuk siswa berikut:
      Nama: ${student.name}
      Kelas: ${student.className}
      Target: ${student.memorizationTarget}
      Progres: ${student.currentProgress}
      
      Berikan masukan konstruktif dalam Bahasa Indonesia yang hangat.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Evaluasi tidak dapat dibuat saat ini.";
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return "Gagal menghubungi layanan AI. Pastikan API Key valid.";
  }
};