
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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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
const SYSTEM_INSTRUCTION_CORE = `
Anda adalah Pakar Evaluasi Pedagogis Al-Qur'an untuk Sekolah Dasar Qur'an (SDQ).
Tugas Anda menyusun laporan naratif bulanan yang santun, jujur, membina, dan personal
untuk orang tua siswa (Ayah dan Bunda).

ATURAN WAJIB:
- Gunakan bahasa santun, reflektif, dan positif-konstruktif.
- Gunakan sebutan "Ananda".
- DILARANG menyebut: skor, angka, persentase, istilah teknis penilaian.
- DILARANG menggunakan singkatan:
  Tulis lengkap "Subhanahu wa Ta'ala", "Shallallahu 'alaihi wa sallam", dan "halaman".
- Catatan Guru adalah SUMBER KEBENARAN UTAMA.
- Jika Catatan Guru kosong, gunakan bahasa netral dan aman.
- Jangan menambah penilaian baru di luar Catatan Guru.

Gunakan variasi kalimat pembuka dan penutup agar tidak terkesan laporan massal.
`;
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    // ================================
    // HITUNG KONTEKS INTERNAL (AI)
    // ================================
    const totalPages =
      (student.totalHafalan?.juz || 0) * 20 +
      (student.totalHafalan?.pages || 0);

    const totalJuz = totalPages > 0 ? (totalPages / 20).toFixed(1) : "0";

    const currentProgress =
      student.className.trim().startsWith("1")
        ? student.tilawah?.individual || "-"
        : student.currentProgress || "-";

    // ================================
    // MAPPING FINAL UNTUK AI
    // ================================
    const aiStudentContext = {
      name: student.name,
      className: student.className,
      teacherNote: student.teacherNote || "",
      currentProgress,
      totalJuz,
      behavior: student.behavior || "Baik",
      attendance: student.attendance || "Baik",
    };

    // ================================
    // USER PROMPT (BERSIH)
    // ================================
    const userPrompt = `
BUAT EVALUASI NARATIF PERSONAL.

========================================
SUMBER UTAMA (CATATAN RESMI GURU)
========================================
${aiStudentContext.teacherNote || "Tidak ada catatan khusus dari guru bulan ini."}

========================================
DATA PENDUKUNG (KONTEKS)
========================================
- Nama: ${aiStudentContext.name}
- Kelas: ${aiStudentContext.className}
- Program Pembelajaran:
${aiStudentContext.className === "1"
  ? "Tilawah Individual (Non Tahfizh)"
  : "Tahfizh Al-Qur'an"}
- Posisi Bacaan Saat Ini: ${aiStudentContext.currentProgress}
- Total Akumulasi Hafalan (Internal): ${aiStudentContext.totalJuz} Juz
- Adab (Internal): ${aiStudentContext.behavior}
- Kehadiran (Internal): ${aiStudentContext.attendance}

========================================
ATURAN KHUSUS (WAJIB DIPATUHI)
========================================

[LOGIKA KELAS 1]
- Kelas 1 BUKAN program Tahfizh.
- Fokus pada kelancaran bacaan (Iqra) dan adab belajar.
- Jika posisi berupa IQRA:
  - WAJIB sebut JILID dan HALAMAN.
  - DILARANG menyebut Surah, Ayat, atau hafalan.
- DILARANG menyebut target juz atau halaman hafalan.
- Seluruh ketentuan hafalan TIDAK BERLAKU untuk Kelas 1.

[LOGIKA KELAS 2–6]
- Gunakan data hafalan hanya sebagai konteks, bukan target kaku.
- Jika progres belum optimal, sampaikan secara edukatif dan solutif.

[ADAB & KEHADIRAN]
- Jangan menyebut angka atau persentase.
- Jika perlu perbaikan, sampaikan dengan bahasa halus dan membina.
- Jika baik, berikan apresiasi wajar.

[TUGAS UTAMA]
- Bangun narasi berdasarkan Catatan Guru.
- Data pendukung hanya untuk memperjelas, bukan mengubah makna.
`;

    const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: userPrompt,
  config: {
    systemInstruction: SYSTEM_INSTRUCTION_CORE,
    temperature: 0.3,
  },
});

if (!response.text) {
  throw new Error("AI tidak memberikan respon.");
}

return response.text.trim();