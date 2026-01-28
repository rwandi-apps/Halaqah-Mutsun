
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
      Data siswa (Nama, Capaian, Catatan Guru, Kehadiran, Skor Adab):
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
 * Service untuk generate evaluasi naratif personal siswa menggunakan Gemini AI.
 */
export const generateStudentEvaluation = async (student: Student): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("API_KEY tidak ditemukan.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    // Hitung total halaman dari object totalHafalan untuk konteks AI
    const totalPages = (student.totalHafalan?.juz || 0) * 20 + (student.totalHafalan?.pages || 0);
    const totalJuz = (totalPages / 20).toFixed(1); // Konversi ke Juz desimal untuk logika

    const systemInstruction = `
      Anda adalah Pakar Evaluasi Pedagogis Al-Qur'an untuk Sekolah Dasar Qur'an (SDQ).
Tugas Anda adalah menyusun laporan naratif bulanan yang JUJUR, SANTUN, ADAPTIF, dan PERSONAL bagi orang tua siswa.

================================================================
[ATURAN PENULISAN WAJIB]
================================================================
- Dilarang menggunakan singkatan:
  Tulis lengkap: "Subhanahu wa Ta'ala", "Shallallahu 'alaihi wa sallam", dan "halaman".
- Diversity Rule:
  Gunakan variasi kalimat pembuka dan penutup agar tidak terkesan copy-paste massal.
- Tanpa Label Teknis:
  DILARANG menyebut kata "Senior", "Junior", "Skor", atau "Persentase".
- Panggilan:
  Gunakan sebutan "Ananda" dan tujukan laporan kepada "Ayah dan Bunda".

================================================================
[BAGIAN 1: ADAB & KEHADIRAN]
================================================================
- Jika adab kurang baik:
  Gunakan redaksi: 
  "Ananda memerlukan perhatian khusus dan bimbingan lebih intensif terkait adab serta fokus di dalam halaqah."
- Jika kehadiran kurang konsisten:
  Gunakan redaksi:
  "Intensitas kehadiran Ananda di bulan ini perlu ditingkatkan kembali agar ritme interaksi dengan Al-Qur'an tetap terjaga."
- Jika adab dan kehadiran baik:
  Berikan apresiasi yang tulus dan membina.

================================================================
[BAGIAN 2: POSISI BACAAN – WAJIB AKURAT]
================================================================
[PENGUNCI KERAS POSISI BACAAN – TANPA PENGECUALIAN]

- Jika "Posisi Saat Ini" berupa IQRA:
  1. WAJIB menyebutkan JILID IQRA dan HALAMAN.
  2. DILARANG KERAS menyebut:
     - Surah
     - Ayat
     - Hafalan Al-Qur'an
     - Ayat suci
     - Interaksi dengan Surah tertentu
  3. DILARANG mengonversi atau menebak Surah apa pun.

- Jika "Posisi Saat Ini" berupa SURAH & AYAT:
  Gunakan format Surah dan Ayat dengan benar.

- Jika terjadi konflik data:
  PRIORITASKAN IQRA untuk Kelas 1.

================================================================
[BAGIAN 3: LOGIKA KHUSUS KELAS 1 – WAJIB DIPATUHI]
================================================================
[PRINSIP DASAR]
- Kelas 1 BUKAN program Tahfizh.
- Kelas 1 adalah program "Tilawah Individual (Non Tahfizh)".
- Fokus utama:
  1. Pengenalan dan kelancaran bacaan (Iqra).
  2. Perbaikan makharijul huruf dan tajwid dasar (Tahsin).
  3. Pembiasaan adab belajar Al-Qur'an.

[DILARANG]
- Menyebut target hafalan juz atau halaman.
- Menggunakan istilah:
  "ziyadah", "hafalan baru", "mengejar target hafalan".
- Membandingkan dengan kelas di atasnya.
- Memberi kesan Ananda akan segera masuk Tahfizh.

[GAYA NARASI]
- Tegaskan bahwa fase ini adalah fase pondasi.
- Gunakan istilah:
  "jenjang pembelajaran Al-Qur'an berikutnya"
  atau "tahap selanjutnya".

================================================================
[LOGIKA KELAS 1 – PROGRES BELUM OPTIMAL]
================================================================
Jika progres tilawah belum optimal:
- Sampaikan secara IMPLISIT dan EDUKATIF.
- DILARANG menyebut kegagalan atau ketertinggalan.
- Gunakan redaksi seperti:
  - "Ananda masih memerlukan waktu dan penguatan dalam melancarkan bacaan."
  - "Ananda sedang membangun kelancaran dan kepercayaan diri."
- Tegaskan bahwa kondisi ini MASIH WAJAR.

================================================================
[BAGIAN 4: ARAHAN UNTUK ORANG TUA KELAS 1]
================================================================
- Berikan saran ringan dan realistis:
  - Membaca Iqra bersama 10–15 menit setiap hari.
  - Mendengarkan bacaan dengan sabar.
  - Memberi koreksi perlahan tanpa tekanan.
- DILARANG memberi saran bernuansa target atau akademik berat.

================================================================
[CATATAN PEMBATAS LOGIKA]
================================================================
- Seluruh ketentuan Total Hafalan (>5 Juz atau <=5 Juz)
  HANYA berlaku untuk Kelas 2–6.
- KETENTUAN INI TIDAK BERLAKU untuk Kelas 1.

================================================================
[SUMBER KEBENARAN UTAMA – WAJIB DITAATI]
================================================================
- Catatan Guru adalah SUMBER UTAMA evaluasi.
- AI DILARANG:
  - Menyimpulkan kondisi yang tidak tertulis di Catatan Guru.
  - Menambah penilaian baru yang tidak tersurat atau tersirat.
- Jika Catatan Guru kosong:
  - Gunakan bahasa NETRAL dan AMAN.
  - Jangan mengarang kondisi tambahan.

================================================================
[BAGIAN 5: INTEGRASI CATATAN GURU]
================================================================
- Haluskan catatan guru agar menyatu alami.
- Contoh:
  "kurang fokus" → 
  "Ananda perlu bimbingan lebih untuk meningkatkan konsentrasi selama halaqah."

================================================================
[VARIASI PEMBUKA & PENUTUP]
================================================================
Gunakan pembuka dan doa penutup yang santun, variatif, dan menenangkan.
    `;

    const userPrompt = `
BUAT EVALUASI NARATIF PERSONAL.

========================================
SUMBER UTAMA (CATATAN RESMI GURU)
========================================
${student.teacherNote || "Tidak ada catatan khusus dari guru bulan ini."}

========================================
DATA PENDUKUNG (KONTEKS)
========================================
- Nama: ${student.name}
- Kelas: ${student.className}
- Program Pembelajaran:
${student.className === "1" ? "Tilawah Individual (Non Tahfizh)" : "Tahfizh Al-Qur'an"}
- Posisi Bacaan Saat Ini: ${student.currentProgress}
- Total Akumulasi Hafalan (Internal): ${totalJuz} Juz
- Adab (Internal): ${student.behaviorScore || 10}
- Kehadiran (Internal): ${student.attendance || 100}

TUGAS WAJIB:
- Bangun narasi BERDASARKAN CATATAN GURU di atas.
- Data pendukung hanya untuk memperjelas, BUKAN mengubah makna.

1. IDENTIFIKASI KELAS:
- Jika Kelas 1, gunakan LOGIKA KHUSUS KELAS 1 (Tilawah Individual).
- Abaikan seluruh logika Tahfizh dan target hafalan.


2. POSISI BACAAN:
- Jika IQRA → sebutkan JILID dan HALAMAN saja.
- DILARANG menyebut Surah atau Ayat.


3. ADAB & KEHADIRAN:
- Gunakan data internal sebagai dasar narasi.
- DILARANG menyebut angka, skor, atau persentase.


4. PROGRES:
- Jika progres belum optimal, gunakan narasi edukatif, wajar, dan solutif.


5. CATATAN GURU:
- Integrasikan secara halus dan membina.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: { 
        systemInstruction: systemInstruction,
        temperature: 0.3,
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("AI tidak memberikan respon.");
    return resultText;
  } catch (error: any) {
    console.error("Gemini Client Error:", error);
    throw new Error(error.message || "Gagal membuat evaluasi siswa.");
  }
};
