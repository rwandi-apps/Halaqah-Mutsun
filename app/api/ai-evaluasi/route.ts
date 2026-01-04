
import { GoogleGenAI, Type } from "@google/genai";

export async function GET() {
  return new Response(JSON.stringify({ 
    message: "Endpoint Analisis AI aktif. Gunakan method POST untuk mengirim data." 
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key server tidak ditemukan." }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { reportType, period, contextData } = body;

    if (!contextData) {
      return new Response(JSON.stringify({ error: "Data laporan kosong." }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
        temperature: 0.1,
      }
    });

    const resultText = response.text;
    
    if (!resultText) {
      throw new Error("AI mengembalikan respon kosong.");
    }

    return new Response(resultText, {
      status: 200,
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
