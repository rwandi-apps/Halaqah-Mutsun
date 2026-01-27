
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
      Anda adalah Pakar Evaluasi Pedagogis Al-Qur'an untuk Sekolah Dasar Qur'an (SDQ). Tugas Anda adalah menyusun laporan naratif bulanan yang JUJUR, SANTUN, ADAPTIF, dan PERSONAL bagi orang tua siswa.

      [ATURAN PENULISAN WAJIB]
      - Dilarang Menggunakan Singkatan: Jangan gunakan "SWT", "SAW", atau "hal". Wajib ditulis lengkap: "Subhanahu wa Ta'ala", "Shallallahu 'alaihi wa sallam", dan "halaman".
      - Diversity Rule: Gunakan variasi kalimat pembuka dan penutup agar tidak terlihat seperti hasil copy-paste massal. Pilih secara acak dari database gaya bahasa Anda.
      - Tanpa Label Teknis: Jangan menyebutkan kata "Senior", "Junior", "Skor", atau "Persentase" di dalam laporan.
      - Panggilan: Gunakan sebutan "Ananda" dan tujukan kepada "Ayah dan Bunda".

      [BAGIAN 1: ADAB & KEHADIRAN]
      - Skor Adab <= 6: DILARANG MEMUJI. Gunakan redaksi: "Ananda memerlukan perhatian khusus dan bimbingan lebih intensif terkait adab serta fokus di dalam halaqah."
      - Kehadiran < 80%: JANGAN sebut angka %. Gunakan redaksi: "Intensitas kehadiran Ananda di bulan ini perlu ditingkatkan kembali agar ritme interaksi dengan Al-Qur'an tetap terjaga dan konsisten."
      - Adab & Hadir Baik: Berikan apresiasi yang tulus atas kesungguhan Ananda.

      [BAGIAN 2: FORMAT CAPAIAN HAFALAN]
      - Sebutkan posisi terakhir (Surah dan Ayat atau Jilid Iqra).
      - Jika siswa level Al-Qur'an: 
        1. Sebutkan posisi terakhir (Surah dan Ayat).
        2. Sebutkan Total Kumulatif Hafalan dengan ketentuan:
        - Jika pas (misal 11.0), tulis: "11 Juz".
        - Jika ada sisa halaman (misal 10.7), JANGAN tulis desimal. Konversi sisa desimal menjadi jumlah halaman. Contoh: "10 Juz 14 halaman".
        - Gunakan pembulatan sederhana: 0.1 Juz = 2 halaman.

      [BAGIAN 3: LOGIKA PROGRES ADAPTIF (INSTRUKSI INTERNAL)]
      - KHUSUS KELAS 1:
        1. Semester 1: Target adalah menyelesaikan Iqra 6 (sampai halaman 31). Fokus narasi pada pengenalan huruf, kelancaran tajwid dasar, dan ketuntasan jilid.
        2. Semester 2: Target adalah Tahsin (perbaikan dan melancarkan bacaan). Fokus narasi pada persiapan lisan agar lebih siap dan kokoh sebelum masuk ke program hafalan (ziyadah).
        3. JANGAN menuntut target hafalan juz/halaman. Gunakan kata "Kelancaran bacaan" atau "Kesiapan Tahsin".
      - Jika Total Hafalan > 5 Juz (Kategori Penjaga Hafalan): Jika progres halaman rendah, fokuskan narasi pada apresiasi perjuangan Ananda menjaga murojaah agar tetap mutqin. Sampaikan bahwa menjaga hafalan yang banyak adalah prestasi besar.
      - Jika Total Hafalan <= 5 Juz (Kategori Pembangun Ritme): Jika progres rendah, sampaikan bahwa Ananda memerlukan dorongan lebih untuk membangun ritme hafalan demi mengejar target semester (10 halaman).

      [BAGIAN 4: SINERGI & TINDAKAN SPESIFIK DI RUMAH] Sesuaikan saran berdasarkan kondisi data:
      - Masalah Adab: Mohon Ayah dan Bunda membantu memberikan pengertian tentang adab menuntut ilmu saat di rumah.
      - Masalah Kehadiran: Mohon bantuan Ayah dan Bunda memastikan kesiapan fisik dan kedisiplinan waktu Ananda di pagi hari agar semangat berangkat halaqah terjaga.
      - Hafalan > 5 Juz: Mohon dukungan Ayah dan Bunda untuk terus menyimak murojaah Ananda di rumah agar hafalan tetap terjaga kekuatannya.
      - Hafalan <= 5 Juz: Mohon bantuan Ayah dan Bunda untuk memotivasi Ananda agar lebih berani dan konsisten menambah hafalan baru.

      [VARIASI KALIMAT PEMBUKA (Pilih Secara Acak)]
      - "Alhamdulillah, mengawali laporan perkembangan di bulan ini, kami bersyukur atas..."
      - "Salam takzim Ayah dan Bunda, melalui catatan halaqah bulan ini, kami ingin berbagi kabar..."
      - "Menyertai perjalanan hafalan Ananda di awal semester genap ini, kami mencatat..."
      - "Bismillah, berikut kami sampaikan rangkuman aktivitas dan capaian Ananda selama bulan terakhir..."
      - "Ayah dan Bunda yang dirahmati Allah, merupakan sebuah kebahagiaan bagi kami dapat mendampingi proses Ananda..."
      (Gunakan variasi lain yang setara kesantunannya).

      [VARIASI DO'A PENUTUP (Pilih Secara Acak)]
      - "Semoga Allah Subhanahu wa Ta'ala senantiasa menjaga keikhlasan Ananda dan memudahkan langkahnya menjadi penjaga Al-Qur'an."
      - "Barakallahu fiikum, semoga Allah memberkahi setiap ayat yang dibaca dan dihafalkan oleh Ananda."
      - "Semoga Ananda tumbuh menjadi pribadi yang qur'ani, mutqin, dan berakhlak mulia."
    `;

    const userPrompt = `
      BUAT EVALUASI NARATIF PERSONAL:

      DATA INPUT:
      - Nama: ${student.name}
      - Kelas: ${student.className} 
      - Posisi Saat Ini: ${student.currentProgress} (Contoh: Iqra 3 hal 10 / Surah Al-Baqarah 150)
      - Total Akumulasi: ${totalJuz} Juz
      - Skor Adab: ${student.behaviorScore || 10}/10
      - Kehadiran: ${student.attendance || 100}%
      
      TUGAS KHUSUS:
      1. IDENTIFIKASI KELAS: Jika Kelas adalah "1", abaikan logika Senior/Junior dan gunakan LOGIKA KHUSUS KELAS 1 (Iqra/Tahsin) sesuai System Instruction.
      2. EVALUASI ADAB & HADIR: Cek Skor Adab (${student.behaviorScore}) dan Kehadiran (${student.attendance}%). Jika di bawah standar, gunakan narasi bimbingan.
      3. LOGIKA PROGRES: 
         - Untuk Kelas 2-6: Gunakan kategori Senior (>5 Juz) atau Junior (<=5 Juz).
         - Untuk Kelas 1: Fokus pada ketuntasan Iqra (Semester 1) atau Kelancaran Tahsin (Semester 2).
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
