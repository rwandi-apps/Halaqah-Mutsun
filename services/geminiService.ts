
import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

// Initialize Gemini API client as per guidelines using process.env.API_KEY
// The SDK instance is created once at the top level for reuse
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStudentEvaluation = async (student: Student): Promise<string> => {
  try {
    const prompt = `
      Anda adalah pakar pendidik Al-Qur'an.
      Buatlah evaluasi naratif yang mendukung untuk siswa berikut:
      Nama: ${student.name}
      Kelas: ${student.className}
      Target: ${student.memorizationTarget}
      Progres: ${student.currentProgress}
      
      Berikan masukan konstruktif dalam Bahasa Indonesia yang hangat.
    `;

    // Using recommended model 'gemini-3-flash-preview' for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Directly accessing .text property (not a method) as per guidelines
    return response.text || "Evaluasi tidak dapat dibuat saat ini.";
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return "Gagal menghubungi layanan AI. Silakan coba lagi nanti.";
  }
};
