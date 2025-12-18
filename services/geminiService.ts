import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

// Initialize Gemini API client correctly using process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStudentEvaluation = async (student: Student): Promise<string> => {
  try {
    const prompt = `
      You are an expert Quranic teacher and mentor at an Islamic school (SDQ).
      Please write a supportive, encouraging, and constructive evaluation report for a student.
      Use a formal yet warm tone (Bahasa Indonesia).

      Student Data:
      - Name: ${student.name}
      - Class: ${student.className}
      - Target: ${student.memorizationTarget}
      - Current Progress: ${student.currentProgress}
      - Attendance: ${student.attendance}%
      - Behavior Score: ${student.behaviorScore}/10

      Structure the report with:
      1. Overall Performance (Pencapaian Umum)
      2. Strengths (Kelebihan)
      3. Areas for Improvement (Area yang Perlu Ditingkatkan)
      4. Message for Parents (Pesan untuk Orang Tua)

      Keep it concise (under 200 words).
    `;

    // Fix: Updated model to gemini-3-flash-preview for Basic Text Tasks as per instructions
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Mohon maaf, evaluasi tidak dapat dibuat saat ini.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Terjadi kesalahan saat menghubungi layanan AI. Silakan coba lagi.";
  }
};