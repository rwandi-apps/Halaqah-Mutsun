
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
      Data Santri (Nama, Capaian, Catatan Guru, Kehadiran, Skor Adab):
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
 * Service untuk generate evaluasi naratif personal santri menggunakan Gemini AI.
 */
export const generateStudentEvaluation = async (student: Student): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    const systemInstruction = `
      Anda adalah Asisten Pedagogis untuk Guru Al-Qur'an (Ustadz/Ustadzah). Tugas Anda adalah membuat Laporan Perkembangan Bulanan personal untuk orang tua siswa.

      PRINSIP PENULISAN:
      1. TERMINOLOGI: Gunakan kata "Siswa" dan sapaan hangat "Ayah/Bunda Ananda ${student.name}".
      2. GAYA BAHASA: Santun, Islami, menyejukkan hati, dan bersifat kerjasama.
      3. ANTI-BEBAN: JANGAN menyebutkan sisa target halaman atau angka kekurangan (Contoh: Hindari "kurang 4 halaman lagi"). Fokuslah pada proses dan kualitas.
      4. LOGIKA TARGET (Internal AI): 
         - Kelas 1 (Target Baru): Selesai Iqra 6.
         - Kelas 2 (Target Baru): Juz 30.
         - Kelas 3-6 (Target Lama): Minimal 1 Juz per tahun (0.5 Juz/10 hal per semester).
         - Target Bulanan: Minimal progres 2 halaman (tahfizh).

      STRUKTUR LAPORAN WAJIB (Output dalam bentuk paragraf naratif yang indah):
      1. APRESIASI: Puji Adab, Kehadiran, atau karakter positif siswa.
      2. KELEBIHAN: Jelaskan kekuatan siswa dalam membaca/menghafal Al-Qur'an.
      3. HAL YANG DITINGKATKAN: Masukkan kendala dari catatan guru dengan bahasa yang halus (ajakan memperbaiki bersama).
      4. SINERGI DI RUMAH: Tips praktis untuk orang tua berdasarkan kendala spesifik siswa di sekolah (misal: jam tidur, latihan huruf tertentu, atau murojaah rutin).
    `;

    const userPrompt = `
      BUAT EVALUASI NARATIF UNTUK SISWA BERIKUT:
      Nama: ${student.name}
      Kelas: ${student.className}
      Target Hafalan: ${student.memorizationTarget}
      Capaian Saat Ini: ${student.currentProgress}
      Kehadiran: ${student.attendance || 100}% (Evaluasi kedisiplinan)
      Skor Adab: ${student.behaviorScore || 10}/10 (Evaluasi karakter/adab)
      
      Buatlah surat evaluasi yang menyentuh hati orang tua namun tetap objektif mengenai perkembangannya.
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
    throw new Error(error.message || "Gagal membuat evaluasi santri.");
  }
};
