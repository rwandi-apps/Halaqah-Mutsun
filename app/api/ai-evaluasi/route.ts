
import { GoogleGenAI } from "@google/genai";

// Endpoint ini berjalan di Server (Node.js), sehingga process.env.API_KEY aman & tersedia.
export async function POST(req: Request) {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key tidak terkonfigurasi di server." }), { status: 500 });
    }

    const { reportType, period, contextData } = await req.json();

    const ai = new GoogleGenAI({ apiKey });
    
    const internalPrompt = `
      TUGAS: Analisis Laporan Halaqah ${reportType} periode ${period}.
      DATA DATA LAPORAN:
      ${contextData}

      INSTRUKSI:
      1. Berikan analisis kolektif performa halaqah.
      2. Gunakan bahasa pembinaan Islami yang formal.
      3. Output HARUS dalam format JSON valid dengan key: 
         insightUtama, kendalaTerindikasi, tindakLanjut, targetBulanDepan.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: internalPrompt,
      config: { 
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const text = response.text;
    return new Response(text, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Gagal menghubungi AI" }), { status: 500 });
  }
}
