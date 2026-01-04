
import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

/**
 * Menghasilkan evaluasi naratif untuk siswa menggunakan Gemini AI.
 * Fungsi ini dirancang aman: tidak akan crash jika API Key kosong.
 */
export const generateStudentEvaluation = async (student: Student): Promise<string> => {
  // Ambil API Key dari environment variable sesuai standar SDK
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features are disabled.");
    return "Layanan AI tidak tersedia karena konfigurasi belum lengkap. Silakan hubungi admin.";
  }

  try {
    // Inisialisasi client hanya saat fungsi dipanggil (on-demand)
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Anda adalah pakar pendidik Al-Qur'an di sekolah Islam (SDQ).
      Buatlah evaluasi naratif yang mendukung, hangat, dan konstruktif untuk siswa berikut:
      Nama: ${student.name}
      Kelas: ${student.className}
      Target: ${student.memorizationTarget}
      Progres Terakhir: ${student.currentProgress}
      Kehadiran: ${student.attendance || 0}%
      Nilai Perilaku: ${student.behaviorScore || 0}/10
      
      Struktur laporan:
      1. Pencapaian Umum
      2. Kelebihan
      3. Area Pengembangan
      4. Pesan untuk Orang Tua
      
      Gunakan Bahasa Indonesia yang santun. Maksimal 200 kata.
    `;

    // Gunakan model gemini-3-flash-preview untuk tugas teks ringan/cepat
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Akses properti .text secara langsung (bukan method) sesuai dokumentasi SDK terbaru
    return response.text || "Maaf, sistem tidak dapat menghasilkan narasi evaluasi saat ini.";

  } catch (error) {
    console.error("Gemini Service Error:", error);
    // Return pesan fallback yang aman alih-alih melempar error ke UI
    return "Terjadi kendala teknis saat menghubungi layanan AI. Silakan coba beberapa saat lagi.";
  }
};
