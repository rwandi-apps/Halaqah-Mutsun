
import { GoogleGenAI, Type } from "@google/genai";
import { Student } from "../types";

/**
 * Service untuk menyempurnakan redaksi catatan wali kelas (Kelas 4-6).
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
      - Hanya teks hasil perbaikan, tanpa penjelasan tambahan.
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
    return resultText?.trim() || originalText;
  } catch (error: any) {
    console.error("Gemini Notes Redaction Error:", error);
    return originalText;
  }
};

/**
 * Service untuk menyempurnakan redaksi bahasa rapor deskriptif (Kelas 1-3).
 */
export const improveReportRedaction = async (originalText: string): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const systemInstruction = `Anda adalah EDITOR BAHASA Rapor Deskripsi SDQ. Perbaiki tata bahasa menjadi santun dan membina tanpa mengubah makna.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Sempurnakan: "${originalText}"`,
      config: { systemInstruction: systemInstruction, temperature: 0.3 }
    });
    return response.text?.trim() || originalText;
  } catch (error) {
    return originalText;
  }
};

/**
 * Service untuk generate evaluasi kolektif Halaqah.
 */
export const generateEvaluasiAI = async (reportType: string, period: string, contextData: string) => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analis data halaqah periode ${period}: ${contextData}`,
    config: { 
      systemInstruction: "Anda adalah Supervisor Tahfizh. Berikan evaluasi strategis dalam format JSON.",
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
  return JSON.parse(response.text || "{}");
};

/**
 * Service Utama: Generate Evaluasi Naratif Personal Santri (Triggered from Dashboard).
 */
export const generateStudentEvaluation = async (student: Student, teacherNotes?: string): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    // Hitung akumulasi untuk membantu AI (Desimal tetap dikirim tapi AI dilarang menuliskannya)
    const totalPagesRaw = (student.totalHafalan?.juz || 0) * 20 + (student.totalHafalan?.pages || 0);
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

🧩 [BAGIAN 1: ADAB & KEHADIRAN]
- Jika adab <= 6: DILARANG memuji. Gunakan redaksi: "Ananda memerlukan perhatian khusus dan bimbingan lebih intensif terkait adab serta fokus di dalam halaqah."
- Jika kehadiran < 80%: DILARANG menyebut angka/persen. Gunakan redaksi: "Intensitas kehadiran Ananda di bulan ini perlu ditingkatkan kembali agar ritme interaksi dengan Al-Qur'an tetap terjaga dan konsisten."
- Jika baik: Berikan apresiasi yang tulus dan proporsional.

📖 [BAGIAN 2: FORMAT CAPAIAN]
- Sebutkan posisi terakhir (Iqra jilid/halaman atau Surah/Ayat).
- Akumulasi hafalan (Al-Qur'an): Konversi desimal ke "X Juz Y halaman" (0.1 Juz = 2 halaman). DILARANG menulis angka desimal.

🎯 [BAGIAN 3: LOGIKA PROGRES ADAPTIF]
- KHUSUS KELAS 1: Fokus pada pengenalan huruf, kelancaran Iqra (Smt 1 target Iqra 6 hal 31) atau Tahsin (Smt 2). Dilarang menuntut target Juz atau menyebut "ziyadah".
- KELAS 2–6 (> 5 Juz): Fokus pada penguatan murojaah. Menjaga hafalan banyak adalah prestasi besar.
- KELAS 2–6 (<= 5 Juz): Fokus pada pembentukan ritme dan motivasi menambah hafalan baru.

🏠 [BAGIAN 4: SINERGI ORANG TUA]
Berikan arahan spesifik sesuai kondisi (Adab, Kehadiran, atau tipe hafalan) agar Ayah Bunda dapat mendampingi di rumah.

📝 [BAGIAN 5: INTEGRASI CATATAN GURU]
Olah catatan guru menjadi narasi halus dan membangun. Jangan copy-paste mentah.
    `;

    const userPrompt = `
BUAT EVALUASI NARATIF PERSONAL SISWA:

DATA INPUT:
- Nama: ${student.name}
- Kelas: ${student.className}
- Posisi Saat Ini: ${student.currentProgress}
- Total Akumulasi (Desimal): ${decimalJuz} Juz
- Nilai Adab: ${student.behaviorScore}/10
- Kehadiran: ${student.attendance}%
- Catatan Guru: ${teacherNotes || 'Nihil'}

TUGAS:
1. Identifikasi kelas (Kelas 1 atau 2-6) dan terapkan logika yang sesuai.
2. Terapkan aturan ketat Adab/Kehadiran jika di bawah ambang batas.
3. Gunakan variasi pembuka seperti "Alhamdulillah...", "salam hangat...", atau "Bismillah...".
4. Gunakan doa penutup yang indah seperti "Semoga Allah Subhanahu wa Ta'ala senantiasa..." atau "Barakallahu fiikum...".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: { 
        systemInstruction: systemInstruction,
        temperature: 0.8, // Sedikit lebih tinggi untuk variasi kalimat (Diversity Rule)
      }
    });

    return response.text?.trim() || "Gagal menghasilkan evaluasi.";
  } catch (error: any) {
    console.error("Gemini Student Eval Error:", error);
    throw new Error("Gagal membuat evaluasi santri.");
  }
};
