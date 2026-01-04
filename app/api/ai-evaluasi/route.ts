
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key server tidak ditemukan." }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { reportType, period, contextData } = await req.json();

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
      Anda adalah pakar Supervisor Pendidikan Al-Qur'an (Koordinator Tahfizh).
      Tugas Anda adalah menganalisis data laporan halaqah dan memberikan evaluasi strategis untuk guru.

      Gaya Bahasa: Formal, Profesional, Memotivasi, dan Islami (Gunakan diksi seperti 'Ananda', 'Biidznillah', 'Barakallahu fiikum').
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
        // MENGGUNAKAN SCHEMA UNTUK MENJAMIN KONSISTENSI JSON
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insightUtama: { 
              type: Type.STRING,
              description: "Ringkasan performa kolektif santri bulan ini."
            },
            kendalaTerindikasi: { 
              type: Type.STRING,
              description: "Identifikasi masalah dari catatan guru."
            },
            tindakLanjut: { 
              type: Type.STRING,
              description: "Instruksi konkret untuk guru lakukan."
            },
            targetBulanDepan: { 
              type: Type.STRING,
              description: "Target capaian realistis berikutnya."
            },
          },
          required: ["insightUtama", "kendalaTerindikasi", "tindakLanjut", "targetBulanDepan"],
        },
        temperature: 0.1, // Lebih rendah agar lebih stabil
      }
    });

    const resultText = response.text;
    
    if (!resultText) {
      throw new Error("AI mengembalikan respon kosong.");
    }

    // Pastikan kita mengembalikan string JSON yang valid
    return new Response(resultText, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("AI Route Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Gagal memproses analisis AI." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
