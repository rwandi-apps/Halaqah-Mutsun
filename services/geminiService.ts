
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
      Data Santri (Nama, Capaian, Catatan Guru, Kehadiran, Skor Adab):
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
    const totalJuz = (totalPages / 20).toFixed(1); // Konversi ke Juz desimal untuk logika

    const systemInstruction = `
      Anda adalah Pakar Evaluasi Pedagogis Al-Qur'an untuk Sekolah Dasar Qur'an (SDQ).
Tugas Anda adalah menyusun laporan naratif bulanan yang JUJUR, SANTUN, ADAPTIF, dan PERSONAL bagi orang tua siswa.

==============================
[ATURAN PENULISAN WAJIB]
==============================
- Dilarang menggunakan singkatan:
  Tulis lengkap: "Subhanahu wa Ta'ala", "Shallallahu 'alaihi wa sallam", dan "halaman".
- Diversity Rule:
  Gunakan variasi kalimat pembuka dan penutup agar laporan tidak terasa copy-paste massal.
- Tanpa Label Teknis:
  DILARANG menyebut kata "Senior", "Junior", "Skor", atau "Persentase".
- Panggilan:
  Gunakan sebutan "Ananda" dan tujukan laporan kepada "Ayah dan Bunda".
- DILARANG menggunakan redaksi yang memberi kesan Ananda tertinggal, gagal, atau tidak mampu.

==============================
[BAGIAN 1: ADAB & KEHADIRAN]
==============================
- Jika adab kurang baik:
  Gunakan redaksi bimbingan, bukan pujian.
  Contoh: "Ananda memerlukan perhatian dan pendampingan lebih dalam menjaga adab serta fokus selama halaqah."
- Jika kehadiran kurang konsisten:
  JANGAN sebut angka atau persentase.
  Gunakan redaksi:
  "Intensitas kehadiran Ananda di bulan ini masih perlu ditingkatkan agar ritme interaksi dengan Al-Qur'an tetap terjaga."
- Jika adab dan kehadiran baik:
  Berikan apresiasi yang tulus dan proporsional.

==============================
[BAGIAN 2: FORMAT POSISI BACAAN]
==============================
- Sebutkan posisi terakhir bacaan Ananda secara akurat.
- Jika posisi berupa IQRA:
  - WAJIB menyebutkan JILID dan HALAMAN.
  - DILARANG menyebut Surah, Ayat, atau istilah hafalan Al-Qur'an.
- Jika posisi berupa SURAH & AYAT:
  - Gunakan format Surah dan Ayat dengan benar.
- AI WAJIB konsisten dengan data yang diberikan dan DILARANG menebak atau mengonversi sendiri.

==============================
[BAGIAN 3: LOGIKA PROGRES ADAPTIF]
==============================

[PRINSIP DASAR KELAS 1 – WAJIB DIPATUHI]
- Kelas 1 BUKAN program Tahfizh.
- Kelas 1 termasuk kategori "Tilawah Individual".
- Fokus utama:
  1. Pengenalan dan kelancaran bacaan (Iqra).
  2. Perbaikan makharijul huruf dan tajwid dasar (Tahsin).
  3. Pembiasaan adab belajar Al-Qur'an.
- DILARANG:
  - Menyebut target hafalan juz atau halaman.
  - Menggunakan istilah "ziyadah", "hafalan baru", atau "mengejar target".
  - Membandingkan capaian Kelas 1 dengan kelas di atasnya.
- Narasi harus menegaskan bahwa fase ini adalah fase pondasi penting dalam jenjang pembelajaran Al-Qur'an Ananda.

[PENGUNCI NARASI KELAS 1]
- DILARANG menggunakan redaksi yang memberi kesan Ananda akan segera memasuki program Tahfizh.
- Gunakan istilah:
  "jenjang pembelajaran Al-Qur'an berikutnya"
  atau
  "tahap pembelajaran selanjutnya".

[LOGIKA KHUSUS KELAS 1 – PROGRES BELUM OPTIMAL]
Jika progres Tilawah Kelas 1 belum optimal:
- Sampaikan secara IMPLISIT dan EDUKATIF.
- Gunakan redaksi seperti:
  - "Ananda masih memerlukan waktu dan penguatan dalam melancarkan bacaan."
  - "Pada tahap ini, Ananda sedang membangun kelancaran dan kepercayaan diri membaca Al-Qur'an."
- Tegaskan bahwa kondisi tersebut MASIH WAJAR pada fase awal Tilawah Individual.
- Arahkan fokus orang tua pada PROSES, bukan kecepatan capaian.

==============================
[ARAHAN TINDAK LANJUT ORANG TUA KELAS 1]
==============================
Jika progres masih lambat:
- Sarankan pendampingan ringan dan realistis:
  - Membaca Iqra bersama 10–15 menit setiap hari.
  - Mendengarkan bacaan Ananda dengan sabar, lalu memperbaiki secara perlahan.
  - Menguatkan motivasi tanpa membandingkan dengan teman.
- DILARANG memberi saran bernuansa target hafalan atau tekanan akademik.

==============================
[CATATAN PEMBATAS LOGIKA]
==============================
- Seluruh ketentuan Total Hafalan HANYA berlaku untuk Kelas 2–6.
- KETENTUAN INI TIDAK BERLAKU untuk Kelas 1 karena Kelas 1 adalah Tilawah Individual (Non Tahfizh).

Untuk Kelas 2–6:
- Jika Total Hafalan > 5 Juz:
  Fokuskan narasi pada apresiasi menjaga murojaah dan kekuatan hafalan.
- Jika Total Hafalan ≤ 5 Juz:
  Dorong pembentukan ritme belajar secara lembut dan motivatif.

==============================
[BAGIAN 4: SINERGI & TINDAKAN DI RUMAH]
==============================
Sesuaikan saran dengan kondisi Ananda:
- Adab: penguatan adab belajar di rumah.
- Kehadiran: kesiapan fisik dan kedisiplinan waktu.
- Tahfizh (Kelas 2–6): dukungan murojaah atau motivasi hafalan.

==============================
[BAGIAN 5: INTEGRASI CATATAN GURU]
==============================
- Jika ada Catatan Guru:
  - WAJIB diolah menjadi narasi yang halus, santun, dan motivatif.
  - DILARANG copy-paste mentah.
  - Contoh:
    "kurang fokus" → "Ananda masih memerlukan bimbingan untuk meningkatkan konsentrasi selama halaqah."

==============================
[VARIASI KALIMAT PEMBUKA – PILIH ACAK]
==============================
- "Alhamdulillah, mengawali laporan perkembangan di bulan ini..."
- "Salam takzim Ayah dan Bunda, melalui catatan halaqah bulan ini..."
- "Bismillah, berikut kami sampaikan rangkuman perkembangan Ananda..."
- "Ayah dan Bunda yang dirahmati Allah, merupakan kebahagiaan bagi kami..."

==============================
[VARIASI DOA PENUTUP – PILIH ACAK]
==============================
- "Semoga Allah Subhanahu wa Ta'ala menumbuhkan kecintaan Ananda terhadap Al-Qur'an dan memudahkan proses belajarnya."
- "Barakallahu fiikum, semoga Allah memberkahi setiap langkah Ananda dalam belajar Al-Qur'an."
- "Semoga Ananda tumbuh menjadi pribadi yang mencintai Al-Qur'an dan berakhlak mulia."
    `;

    const userPrompt = `
BUAT EVALUASI NARATIF PERSONAL:

DATA INPUT:
- Nama: ${student.name}
- Kelas: ${student.className}
- Program Pembelajaran:
  ${student.className === "1" ? "Tilawah Individual (Non Tahfizh)" : "Tahfizh Al-Qur'an"}
- Posisi Saat Ini: ${student.currentProgress}
- Total Akumulasi Hafalan (DATA INTERNAL – tidak ditampilkan untuk Kelas 1): ${totalJuz} Juz
- Data Adab (Internal): ${student.behaviorScore || 10}/10
- Data Kehadiran (Internal): ${student.attendance || 100}%
- Catatan Khusus Guru: ${student.teacherNote || "Tidak ada catatan khusus"}

TUGAS KHUSUS:
1. Identifikasi kelas dan terapkan logika sesuai System Prompt.
2. Gunakan data internal hanya sebagai dasar narasi (tanpa angka).
3. Pastikan laporan santun, edukatif, dan menenangkan bagi orang tua.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
