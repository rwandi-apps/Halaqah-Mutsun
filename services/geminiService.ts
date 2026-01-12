
import { GoogleGenAI, Type } from "@google/genai";
import { Student } from "../types";

/**
 * Service untuk menyempurnakan redaksi catatan wali kelas (Kelas 4-6).
 * AI bertindak sebagai editor bahasa agar lebih santun, profesional, dan membina.
 */
export const improveTeacherNotes = async (originalText: string): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  if (!originalText || originalText.trim().length < 5) {
    throw new Error("Catatan terlalu singkat untuk disempurnakan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    const systemInstruction = `
      Anda adalah AI Assistant yang bertugas sebagai EDITOR BAHASA untuk Catatan Rapor Siswa Kelas 4–6 SDQ.
      Tugas utama: Perbaiki redaksi agar lebih runtut, santun, jelas, dan profesional tanpa mengubah makna aslinya.
      
      GAYA BAHASA & ATURAN:
      1. Gunakan gaya bahasa santun, reflektif, membina, dan positif-konstruktif.
      2. Gunakan istilah: "Ananda", "perlu ditingkatkan", "menunjukkan perkembangan", "perlu konsistensi", "diharapkan dapat".
      3. HINDARI kata: "lemah", "buruk", "tidak mampu", "kurang serius".
      4. JANGAN mengubah makna, substansi penilaian, atau capaian siswa.
      
      OUTPUT:
      - Berupa 1 paragraf saja.
      - Hanya teks hasil perbaikan, tanpa penjelasan tambahan atau embel-embel AI.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Sempurnakan redaksi catatan guru berikut: "${originalText}"`,
      config: { 
        systemInstruction: systemInstruction,
        temperature: 0.3,
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("AI tidak memberikan respon.");

    return resultText.trim();
  } catch (error: any) {
    console.error("Gemini Notes Redaction Error:", error);
    throw new Error(error.message || "Gagal menyempurnakan catatan.");
  }
};

/**
 * Service untuk menyempurnakan redaksi bahasa rapor deskriptif (Kelas 1-3).
 * AI bertindak sebagai editor bahasa, bukan penilai.
 */
export const improveReportRedaction = async (originalText: string): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  if (!originalText || originalText.trim().length < 5) {
    throw new Error("Teks terlalu singkat untuk disempurnakan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    const systemInstruction = `
      Anda adalah AI Assistant untuk guru SD Al-Qur'an (SDQ) yang bertugas MEMPERBAIKI REDAKSI KALIMAT RAPOR DESKRIPSI.
      Tugas utama: Perbaiki tata bahasa, alur, kelembutan bahasa, dan kejelasan makna agar sesuai dengan standar rapor SDQ.
      
      BATASAN KERAS:
      1. JANGAN mengubah makna atau substansi penilaian.
      2. JANGAN menambah poin penilaian baru atau mengubah capaian siswa.
      3. Gunakan gaya bahasa santun, positif, edukatif, dan membina.
      4. Gunakan istilah: "Ananda", "menunjukkan", "perlu pendampingan", "terus dibimbing".
      
      OUTPUT:
      - Berupa 1 paragraf saja.
      - Hanya teks hasil perbaikan, tanpa penjelasan tambahan atau embel-embel AI.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Sempurnakan redaksi kalimat rapor berikut tanpa mengubah maknanya: "${originalText}"`,
      config: { 
        systemInstruction: systemInstruction,
        temperature: 0.3, // Rendah agar tetap setia pada teks asli
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("AI tidak memberikan respon.");

    return resultText.trim();
  } catch (error: any) {
    console.error("Gemini Redaction Error:", error);
    throw new Error(error.message || "Gagal menyempurnakan bahasa.");
  }
};

/**
 * Service untuk generate evaluasi kolektif Halaqah menggunakan Gemini AI (Client-Side).
 */
export const generateEvaluasiAI = async (reportType: string, period: string, contextData: string) => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    const systemInstruction = `
      Anda adalah pakar Supervisor Pendidikan Al-Qur'an (Koordinator Tahfizh).
      Tugas Anda adalah menganalisis data laporan halaqah dan memberikan evaluasi strategis untuk guru.
      Gaya Bahasa: Formal, Profesional, Memotivasi, dan Islami.
    `;

    const userPrompt = `
      ANALISIS DATA BERIKUT:
      Tipe Laporan: ${reportType}
      Periode: ${period}
      Data siswa (Nama, Capaian, Catatan Guru, Kehadiran, Skor Adab):
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
    return JSON.parse(resultText);
  } catch (error: any) {
    console.error("Gemini Client Error:", error);
    throw new Error(error.message || "Gagal menghubungi AI Gemini.");
  }
};

/**
 * Service untuk generate evaluasi naratif personal siswa menggunakan Gemini AI.
 */
export const generateStudentEvaluation = async (student: Student): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    const systemInstruction = `
      Anda adalah seorang Guru Al-Qur'an (Musyrif Halaqah) yang bijaksana.
      Tugas Anda adalah memberikan evaluasi naratif yang mendalam, memotivasi, dan Islami untuk seorang siswa berdasarkan capaiannya.
    `;

    const userPrompt = `
      BUAT EVALUASI NARATIF UNTUK siswa BERIKUT:
      Nama: ${student.name}
      Kelas: ${student.className}
      Target: ${student.memorizationTarget}
      Capaian Saat Ini: ${student.currentProgress}
      Kehadiran: ${student.attendance}% (Skala 0-100)
      Skor Adab: ${student.behaviorScore}/10 (10=Sangat Baik, 8=Baik, 6=Perlu Pembinaan)
      
      Evaluasi harus mencakup apresiasi atas usahanya, evaluasi kedisiplinan & adab, serta saran perbaikan yang membangun.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: { 
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("AI tidak memberikan respon.");
    return resultText;
  } catch (error: any) {
    console.error("Gemini Client Error:", error);
    throw new Error(error.message || "Gagal membuat evaluasi siswa.");
  }
};
