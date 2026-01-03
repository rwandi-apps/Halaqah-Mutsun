
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key server tidak ditemukan." }), { status: 500 });
    }

    const { reportType, period, contextData } = await req.json();

    const ai = new GoogleGenAI({ apiKey });
    
    // Prompt yang dioptimasi untuk stabilitas JSON dan tone pembinaan
    const systemInstruction = `
      Anda adalah pakar Supervisor Pendidikan Al-Qur'an (Koordinator Tahfizh).
      Tugas Anda adalah menganalisis data laporan halaqah dan memberikan evaluasi strategis untuk guru.

      KRITERIA ANALISIS:
      1. insightUtama: Ringkasan performa kolektif santri (misal: 80% lancar, tren positif, atau butuh penguatan).
      2. kendalaTerindikasi: Identifikasi masalah dari catatan guru (misal: makhraj, konsistensi murojaah, atau kehadiran).
      3. tindakLanjut: Instruksi konkret untuk guru lakukan kepada santri (misal: metode privat, pengulangan sabaq, atau komunikasi ortu).
      4. targetBulanDepan: Target capaian realistis berikutnya (misal: Menyelesaikan Juz 30, atau penguatan Mutqin).

      Gaya Bahasa: Formal, Profesional, Memotivasi, dan Islami (Gunakan diksi seperti 'Ananda', 'Biidznillah', 'Barakallahu fiikum').

      FORMAT OUTPUT:
      Wajib mengembalikan JSON valid dengan key: insightUtama, kendalaTerindikasi, tindakLanjut, targetBulanDepan.
      Dilarang memberikan teks pembuka atau penutup. Hanya JSON.
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
        responseMimeType: "application/json", // Memaksa output menjadi JSON murni
        temperature: 0.2, // Rendah agar konsisten/tidak ngawur
      }
    });

    const resultText = response.text;
    
    // Proteksi tambahan: bersihkan karakter non-JSON jika ada (double safety)
    const cleanJson = resultText.replace(/```json|```/g, "").trim();

    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("AI Route Error:", error);
    return new Response(JSON.stringify({ error: "Gagal memproses analisis AI." }), { status: 500 });
  }
}
