
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
      Anda adalah Asisten Pedagogis untuk Guru Al-Qur'an (Ustadz/Ustadzah). Tugas Anda adalah membuat Laporan Perkembangan Bulanan personal untuk orang tua siswa.

      PRINSIP PENULISAN:
      1. TERMINOLOGI: Gunakan kata "Siswa" dan sapaan hangat "Ayah/Bunda Ananda ${student.name}".
      2. GAYA BAHASA: Santun, Islami, menyejukkan hati, dan bersifat kerjasama (partnership).
      3. ANTI-BEBAN (CRITICAL): JANGAN PERNAH menyebutkan angka kekurangan target atau sisa halaman (Contoh: DILARANG tulis "kurang 4 halaman lagi" atau "tertinggal 2 juz"). Fokuslah pada *progress yang sudah diraih* dan *kualitas bacaan*. Gunakan kalimat seperti "Perlu istiqomah", "Mari kita dukung", bukan "Anak anda kurang".
      4. LOGIKA TARGET (Internal Knowledge untuk Context, jangan disebut eksplisit angkanya jika kurang): 
         - Kelas 1: Fokus penyelesaian Iqra.
         - Kelas 2: Fokus Juz 30.
         - Kelas 3-6: Target ~10 halaman/semester.
         - Target Bulanan: Idealnya bertambah 2 halaman.

      STRUKTUR LAPORAN WAJIB (Output dalam bentuk paragraf naratif yang indah, jangan pakai bullet point kaku):
      1. PEMBUKAAN & APRESIASI: Sapaan hangat, lalu puji aspek Adab (${student.behaviorScore}/10) atau Kehadiran (${student.attendance}%). Jika nilai bagus, puji keteladanan. Jika kurang, puji potensinya.
      2. KELEBIHAN (PROGRESS): Jelaskan total capaian hafalan saat ini (${student.currentProgress} / Total ${totalPages} Hal) dengan nada positif.
      3. HAL YANG DITINGKATKAN: Berikan masukan halus. Jika capaian rendah (<2 hal/bulan), gunakan bahasa "Perlu dorongan semangat" atau "Perlu waktu khusus". Jangan menghakimi.
      4. SINERGI DI RUMAH: Berikan 1-2 tips praktis konkret untuk orang tua berdasarkan kendala (misal: menyimak hafalan 5 menit sebelum tidur, memutar audio murottal, atau sekadar mendoakan).
      5. PENUTUP: Doa tulus untuk Ananda.
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
      1. Hubungkan "Capaian" dengan target bulanan/semester secara implisit (tanpa menyebut angka defisit).
      2. Jika Total Capaian (${totalPages} hal) dirasa kurang untuk kelasnya, gunakan kalimat motivasi "Perlu dorongan lebih".
      3. Pastikan narasi Adab sinkron dengan skor (10=Sangat Baik/Teladan, 8-9=Baik, <8=Perlu Bimbingan).
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
