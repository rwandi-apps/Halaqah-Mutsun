
import { GoogleGenAI } from "@google/genai";
import { Student } from "../../../types";

// Initialize Gemini API client using correct configuration
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function POST(student: Student) {
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

    // Using recommended model for Basic Text Tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Directly accessing .text property as per guidelines
    return response.text || "Mohon maaf, evaluasi tidak dapat dibuat saat ini.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Terjadi kesalahan saat menghubungi layanan AI.");
  }
}
