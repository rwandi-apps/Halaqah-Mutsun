import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Helper to initialize Gemini SDK safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY / API_KEY tidak ditemukan di environment server.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // API 1: Coordinator Workspace Analisis AI (/api/ai-evaluasi)
  app.post("/api/ai-evaluasi", async (req, res) => {
    try {
      const { reportType, period, contextData } = req.body;

      if (!contextData) {
        return res.status(400).json({ error: "Data laporan / konteks siswa tidak boleh kosong." });
      }

      const ai = getGeminiClient();

      const systemInstruction = `
        Anda adalah pakar Supervisor & Koordinator Tahfizh Pendidikan Al-Qur'an (SDQ).
        Tugas Anda adalah menganalisis data laporan halaqah / data progres siswa dan memberikan evaluasi strategis untuk guru dan koordinator.
        
        Sajikan respon Anda dengan struktur yang jelas, ringkas, membina, dan aplikatif.
        - insightUtama: Rangkuman tren capaian, antusiasme, dan dinamika halaqah.
        - kendalaTerindikasi: Hambatan dalam halafan/murajaah/adab/kehadiran yang terdeteksi.
        - tindakLanjut: Solusi konkrit dan saran pembinaan untuk guru/siswa.
        - targetBulanDepan: Target spesifik yang realistis untuk dicapai periode berikutnya.
      `;

      const userPrompt = `
        ANALISIS DATA HALAQAH BERIKUT:
        Tipe Laporan: ${reportType || 'Laporan Bulanan'}
        Periode: ${period || 'Bulan Ini'}
        
        DATA LATIHAN / PERFORMA SISWA:
        ${contextData}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
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
      if (!resultText) {
        throw new Error("Respon AI kosong.");
      }

      const parsed = JSON.parse(resultText);
      res.json(parsed);
    } catch (error: any) {
      console.error("Error /api/ai-evaluasi:", error);
      res.status(500).json({ error: error.message || "Gagal memproses Analisis AI." });
    }
  });

  // API 2: Evaluasi Naratif Personal Siswa (/api/ai-student-eval)
  app.post("/api/ai-student-eval", async (req, res) => {
    try {
      const { student, teacherNotes } = req.body;
      if (!student) {
        return res.status(400).json({ error: "Data siswa diperlukan." });
      }

      const ai = getGeminiClient();
      const totalPagesRaw = ((student.totalHafalan?.juz || 0) * 20) + (student.totalHafalan?.pages || 0);
      const decimalJuz = totalPagesRaw / 20;

      const systemInstruction = `
        Anda adalah Pakar Evaluasi Pedagogis Al-Qur'an untuk Sekolah Dasar Qur'an (SDQ).
        Tugas Anda adalah menyusun laporan evaluasi naratif yang JUJUR, SANTUN, ADAPTIF, dan PERSONAL bagi Ayah dan Bunda.

        📌 [ATURAN PENULISAN WAJIB]
        1. Dilarang Menggunakan Singkatan: 
           - Wajib ditulis lengkap: "Subhanahu wa Ta'ala", "Shallallahu 'alaihi wa sallam", dan "halaman". 
           - Dilarang keras "SWT", "SAW", "hal".
        2. Diversity Rule: Gunakan variasi kalimat pembuka dan penutup. Jangan monoton antar siswa.
        3. Tanpa Label Teknis: DILARANG menyebut kata "Senior", "Junior", "Skor", atau "Persentase".
        4. Panggilan: Gunakan sebutan "Ananda". Tujuan laporan adalah "Ayah dan Bunda".
      `;

      const userPrompt = `
        BUAT EVALUASI NARATIF PERSONAL SISWA:
        - Nama: ${student.name}
        - Kelas: ${student.className}
        - Posisi Saat Ini: ${student.currentProgress || student.sabaqDisplay || '-'}
        - Total Akumulasi: ${decimalJuz} Juz
        - Nilai Adab: ${student.behaviorScore || 8}/10
        - Kehadiran: ${student.attendance || 100}%
        - Catatan Guru: ${teacherNotes || 'Nihil'}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ result: response.text?.trim() || "Gagal menghasilkan evaluasi." });
    } catch (error: any) {
      console.error("Error /api/ai-student-eval:", error);
      res.status(500).json({ error: error.message || "Gagal memproses evaluasi siswa." });
    }
  });

  // API 3: Improve Redaction / Notes (/api/ai-improve-notes)
  app.post("/api/ai-improve-notes", async (req, res) => {
    try {
      const { text, mode } = req.body;
      if (!text || text.trim().length < 3) {
        return res.status(400).json({ error: "Teks terlalu singkat untuk disempurnakan." });
      }

      const ai = getGeminiClient();
      const systemInstruction = mode === 'report' 
        ? `Anda adalah EDITOR BAHASA Rapor Deskripsi SDQ. Perbaiki tata bahasa menjadi santun dan membina tanpa mengubah makna.`
        : `Anda adalah EDITOR BAHASA Catatan Guru SDQ. Perbaiki tata bahasa menjadi santun, positif, membina, dan jelas dalam 1-2 kalimat.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Sempurnakan redaksi teks berikut: "${text}"`,
        config: {
          systemInstruction,
          temperature: 0.3,
        }
      });

      res.json({ result: response.text?.trim() || text });
    } catch (error: any) {
      console.error("Error /api/ai-improve-notes:", error);
      res.status(500).json({ error: error.message || "Gagal menyempurnakan redaksi." });
    }
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
