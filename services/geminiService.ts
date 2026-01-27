
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

    // Hitung total halaman dari object totalHafalan untuk konteks AI
    const totalPages = (student.totalHafalan?.juz || 0) * 20 + (student.totalHafalan?.pages || 0);

    const systemInstruction = `
      Anda adalah Pakar Evaluasi Pedagogis SD Al-Qur'an (SDQ). Tugas Anda adalah menganalisis DATA INPUT TERBARU yang diberikan guru dan mengubahnya menjadi laporan naratif bulanan untuk orang tua.

      LOGIKA EVALUASI (WAJIB DIPATUHI):

      1. PRIORITAS DATA TERBARU:
         - Evaluasi Anda WAJIB didasarkan pada angka dan catatan terbaru yang diberikan. JANGAN menggunakan asumsi umum bahwa siswa selalu berprestasi jika datanya menunjukkan sebaliknya.

      2. ANALISIS ADAB (SANGAT KETAT):
         - Jika Skor Adab <= 6 atau berisi status "Butuh Perhatian": Dilarang keras menggunakan kata "Sempurna", "Luar Biasa", "Istimewa", atau "Sangat Baik".
         - NARASI WAJIB jika skor rendah: Sampaikan secara jujur namun santun bahwa "Bulan ini Ananda memerlukan perhatian khusus dan bimbingan lebih intensif terkait adab serta fokus di dalam halaqah."
         - Ajak orang tua untuk bersinergi membimbing perilaku Ananda di rumah agar kembali stabil.

      3. ANALISIS PROGRES (Target Bulanan 2 Hal & Semester 10 Hal):
         - Karena ini Laporan Januari (Awal Semester Genap):
           - Jika capaian < 2 halaman (atau progres lambat): Gunakan kalimat: "Ananda perlu dorongan lebih agar ritme hafalan di awal semester ini terbangun dengan kuat demi mencapai target semester (10 halaman)."
           - Tetap berikan semangat, namun tunjukkan bahwa progres saat ini masih di bawah target bulanan.

      4. LOGIKA KEHADIRAN:
         - JANGAN menyebutkan angka persentase kehadiran (misal: "60%" atau "75%").
         - Jika Kehadiran < 80%: Gunakan redaksi bahwa "intensitas kehadiran Ananda di bulan ini perlu ditingkatkan kembali agar ritme interaksi dengan Al-Qur'an tetap terjaga dan konsisten."
         - Hubungkan ketidakhadiran tersebut sebagai faktor yang memengaruhi kemudahan Ananda dalam menambah hafalan baru.

      5. FORMAT PENYEBUTAN TOTAL HAFALAN:
         - JANGAN hanya menyebutkan total dalam satuan "Halaman" (misal: "80 halaman").
         - KONVERSI total halaman tersebut ke dalam satuan Juz dan Halaman (1 Juz = 20 Halaman).
         - Contoh: Jika data total adalah 80 halaman, tuliskan "4 Juz". Jika 85 halaman, tuliskan "4 Juz 5 Halaman".
         - Gunakan kalimat yang hangat, seperti: "Hingga saat ini, total hafalan yang telah dijaga oleh Ananda adalah sebanyak [X] Juz [Y] Halaman."

      6. STRUKTUR NARASI (Output dalam bentuk paragraf naratif):
         - Paragraf 1: Kabar Adab & Kehadiran (Sesuaikan dengan skor terbaru).
         - Paragraf 2: Capaian Progres (Iqra/Juz saat ini).
         - Paragraf 3: Evaluasi & Motivasi (Gunakan logika "Perlu dorongan lebih" jika progres melambat).
         - Paragraf 4: Sinergi Rumah (Tips praktis berdasarkan kendala di Catatan Guru).

      ATURAN BAHASA:
      - Sapaan: Ayah/Bunda Ananda ${student.name}.
      - Gunakan "Siswa" (bukan Santri).
      - JANGAN menyebut angka kekurangan (Contoh: JANGAN tulis "kurang 8 hal lagi").
      - Gaya Bahasa: Santun, Islami, namun sangat Objektif mengikuti angka input guru.
    `;

    const userPrompt = `
      BUAT EVALUASI NARATIF PERSONAL:

      DATA INPUT:
      - Nama: ${student.name}
      - Kelas: ${student.className}
      - Posisi Hafalan Saat Ini: ${student.currentProgress}
      - Total Akumulasi Hafalan: ${totalPages} halaman
      - Skor Adab: ${student.behaviorScore || 10}/10
      - Kehadiran: ${student.attendance || 100}%
      
      TUGAS KHUSUS:
      1. Hubungkan "Capaian" dengan target bulanan (2 hal).
      2. Hubungkan "Total Capaian" dengan target semester (10 hal). Jika kurang, gunakan kalimat "Perlu dorongan lebih".
      3. Pastikan narasi Adab sinkron dengan skor ${student.behaviorScore || 10}.
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
