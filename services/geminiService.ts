
import { GoogleGenAI, Type } from "@google/genai";
import { Student } from "../types";

/**
 * Service untuk menyempurnakan redaksi catatan wali kelas (Kelas 4-6).
 * AI bertindak sebagai editor bahasa agar lebih santun, profesional, dan membina.
 */
export const improveTeacherNotes = async (originalText: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  if (!originalText || originalText.trim().length < 5) {
    throw new Error("Catatan terlalu singkat untuk disempurnakan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  if (!process.env.API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  if (!originalText || originalText.trim().length < 5) {
    throw new Error("Teks terlalu singkat untuk disempurnakan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  if (!process.env.API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  if (!process.env.API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Hitung total halaman dari object totalHafalan untuk konteks AI
    const totalPages = (student.totalHafalan?.juz || 0) * 20 + (student.totalHafalan?.pages || 0);
    const totalJuz = (totalPages / 20).toFixed(1); // Konversi ke Juz desimal untuk logika

    const systemInstruction = `
      Anda adalah Pakar Evaluasi Al-Qur'an (SDQ). Tugas Anda adalah menyusun laporan naratif bulanan yang JUJUR, SANTUN, dan ADAPTIF.

      [BAGIAN 1: ADAB & KEHADIRAN]
      - Skor Adab <= 6: DILARANG MEMUJI. Gunakan narasi: "Ananda memerlukan perhatian khusus dan bimbingan lebih intensif terkait adab serta fokus di dalam halaqah."
      - Kehadiran < 80%: JANGAN sebut angka %. Gunakan redaksi: "Intensitas kehadiran Ananda di bulan ini perlu ditingkatkan kembali agar ritme interaksi dengan Al-Qur'an tetap terjaga dan konsisten."

      [BAGIAN 2: FORMAT HAFALAN]
      - Sebutkan posisi hafalan terbaru (Surah dan Ayat) atau Jilid Iqra.
      - Sebutkan total hafalan dalam satuan "Juz" (jika sudah Al-Qur'an).

      [BAGIAN 3: LOGIKA PROGRES ADAPTIF]
      - Jika Total Hafalan > 5 Juz (Siswa Senior): 
        Jika progres bulan ini rendah (atau stagnan), JANGAN gunakan nada menekan. Gunakan narasi: "Mengingat amanah hafalan Ananda yang sudah cukup banyak, fokus bulan ini tampaknya lebih diprioritaskan pada penguatan (murojaah) agar hafalan tetap mutqin. Namun, kami tetap memotivasi Ananda untuk mulai mencicil setoran baru secara perlahan."
        
      - Jika Total Hafalan <= 5 Juz (Siswa Junior):
        Jika progres bulan ini rendah, gunakan narasi: "Ananda perlu dorongan lebih agar ritme hafalan di awal semester ini terbangun dengan kuat demi mencapai target semesteran (10 halaman)."

      [BAGIAN 4: PENUTUP]
      - Gunakan sapaan hangat kepada Ayah/Bunda dan tutup dengan doa yang baik.
      
      ATURAN TAMBAHAN:
      - Gunakan kata "Siswa" atau "Ananda".
      - Gaya Bahasa: Santun, Islami, namun Objektif sesuai data.
    `;

    const userPrompt = `
      BUAT EVALUASI NARATIF PERSONAL:

      DATA INPUT:
      - Nama: ${student.name}
      - Kelas: ${student.className}
      - Posisi Hafalan Saat Ini: ${student.currentProgress}
      - Total Akumulasi Hafalan: ${totalJuz} Juz
      - Skor Adab: ${student.behaviorScore || 10}/10
      - Kehadiran: ${student.attendance || 100}%
      
      TUGAS KHUSUS:
      1. Cek Skor Adab (${student.behaviorScore}) dan Kehadiran (${student.attendance}%). Jika rendah, GUNAKAN REDAKSI WAJIB di Bagian 1.
      2. Cek Total Hafalan (${totalJuz} Juz). Tentukan apakah masuk kategori Senior (>5 Juz) atau Junior (<=5 Juz) dan terapkan logika Bagian 3.
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
