import { Student } from "../types";

/**
 * Service untuk generate evaluasi kolektif Halaqah (digunakan di Workspace Analisis AI Koordinator).
 */
export const generateEvaluasiAI = async (reportType: string, period: string, contextData: string) => {
  try {
    const res = await fetch("/api/ai-evaluasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportType, period, contextData })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}: Gagal memproses AI.`);
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error("generateEvaluasiAI error:", error);
    throw new Error(error.message || "Gagal menghasilkan analisis AI.");
  }
};

/**
 * Service Utama: Generate Evaluasi Naratif Personal Siswa (Triggered from Dashboard).
 */
export const generateStudentEvaluation = async (student: Student, teacherNotes?: string): Promise<string> => {
  try {
    const res = await fetch("/api/ai-student-eval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student, teacherNotes })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}: Gagal memproses evaluasi siswa.`);
    }

    const data = await res.json();
    return data.result || "Evaluasi berhasil dibuat.";
  } catch (error: any) {
    console.error("generateStudentEvaluation error:", error);
    throw new Error(error.message || "Gagal membuat evaluasi siswa.");
  }
};

/**
 * Service untuk menyempurnakan redaksi catatan wali kelas (Kelas 4-6).
 */
export const improveTeacherNotes = async (originalText: string): Promise<string> => {
  if (!originalText || originalText.trim().length < 5) {
    throw new Error("Catatan terlalu singkat untuk disempurnakan.");
  }

  try {
    const res = await fetch("/api/ai-improve-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: originalText, mode: "notes" })
    });

    if (!res.ok) {
      return originalText;
    }

    const data = await res.json();
    return data.result || originalText;
  } catch (error) {
    console.error("improveTeacherNotes error:", error);
    return originalText;
  }
};

/**
 * Service untuk menyempurnakan redaksi bahasa rapor deskriptif (Kelas 1-3).
 */
export const improveReportRedaction = async (originalText: string): Promise<string> => {
  try {
    const res = await fetch("/api/ai-improve-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: originalText, mode: "report" })
    });

    if (!res.ok) {
      return originalText;
    }

    const data = await res.json();
    return data.result || originalText;
  } catch (error) {
    console.error("improveReportRedaction error:", error);
    return originalText;
  }
};
