
import { GoogleGenAI, Type } from "@google/genai";
import { Student } from "../types";

/**
 * Service untuk generate evaluasi kolektif Halaqah menggunakan Gemini AI (Client-Side).
 */
export const generateEvaluasiAI = async (reportType: string, period: string, contextData: string) => {
  // Fix: Obtained exclusively from process.env.API_KEY as per @google/genai guidelines
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
      Anda adalah pakar Supervisor Pendidikan Al-Qur'an (Koordinator Tahfizh).
      Tugas Anda adalah menganalisis data laporan halaqah dan memberikan evaluasi strategis untuk guru.
      Gaya Bahasa: Formal, Profesional, Memotivasi, dan Islami.
    `;

    const userPrompt = `
      ANALISIS DATA BERIKUT:
      Tipe Laporan: ${reportType}
      Periode: ${period}
      Data Santri:
      ${contextData}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: { 
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insightUtama: { type: Type.STRING },
            kendalaTerindikasi: { type: Type.STRING },
            tindakLanjut: { type: Type.STRING },
            targetBulanDepan: { type: Type.STRING },
          },
          required: ["insightUtama", "kendalaTerindikasi", "tindakLanjut", "targetBulanDepan"],
        },
        temperature: 0.2,
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("AI tidak memberikan respon.");

    // Parse JSON string ke object JavaScript
    return JSON.parse(resultText);

  } catch (error: any) {
    console.error("Gemini Client Error:", error);
    throw new Error(error.message || "Gagal menghubungi AI Gemini.");
  }
};

/**
 * Fix: Added missing exported member 'generateStudentEvaluation' used in GuruDashboard components.
 * Service untuk generate evaluasi naratif personal santri menggunakan Gemini AI.
 */
export const generateStudentEvaluation = async (student: Student): Promise<string> => {
  // Fix: Obtained exclusively from process.env.API_KEY as per @google/genai guidelines
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
      Anda adalah seorang Guru Al-Qur'an (Musyrif Halaqah) yang bijaksana.
      Tugas Anda adalah memberikan evaluasi naratif yang mendalam, memotivasi, dan Islami untuk seorang santri berdasarkan capaiannya.
    `;

    const userPrompt = `
      BUAT EVALUASI NARATIF UNTUK SANTRI BERIKUT:
      Nama: ${student.name}
      Kelas: ${student.className}
      Target: ${student.memorizationTarget}
      Capaian Saat Ini: ${student.currentProgress}
      Kehadiran: ${student.attendance}%
      Nilai Perilaku: ${student.behaviorScore}
      
      Evaluasi harus mencakup apresiasi atas usahanya dan saran perbaikan yang membangun.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userPrompt,
      config: { 
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    // Fix: Access .text property directly as per @google/genai guidelines
    const resultText = response.text;
    if (!resultText) throw new Error("AI tidak memberikan respon.");

    return resultText;
  } catch (error: any) {
    console.error("Gemini Client Error:", error);
    throw new Error(error.message || "Gagal membuat evaluasi santri.");
  }
};
