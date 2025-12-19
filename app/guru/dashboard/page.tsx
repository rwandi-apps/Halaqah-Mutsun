"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Sparkles, Trophy } from "lucide-react";
import {
  subscribeToStudentsByTeacher,
  subscribeToReportsByTeacher,
} from "@/services/firestoreService";
import { generateStudentEvaluation } from "@/services/geminiService";
import { calculateSDQProgress } from "@/services/sdqTargets";
import { Student, Report } from "@/types";
import { listenAuth } from "@/services/authService";

interface StudentWithProgress extends Student {
  progressStats: ReturnType<typeof calculateSDQProgress>;
}

export default function GuruDashboardPage() {
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<StudentWithProgress | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = listenAuth(setTeacherId);
    return () => unsub();
  }, []);

  /* ================= REALTIME ================= */
  useEffect(() => {
    if (!teacherId) return;

    const unsubStudents = subscribeToStudentsByTeacher(
      teacherId,
      setStudents
    );
    const unsubReports = subscribeToReportsByTeacher(
      teacherId,
      setReports
    );

    return () => {
      unsubStudents();
      unsubReports();
    };
  }, [teacherId]);

  /* ============ DERIVED (ANTI DATA HANTU) ============ */
  const studentsWithProgress = useMemo(() => {
    return students
      .map((student) => {
        const latest = reports
          .filter((r) => r.studentId === student.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

        const safeStudent: Student = {
          ...student,
          totalHafalan: latest
            ? latest.totalHafalan
            : { juz: 0, pages: 0, lines: 0 },
          currentProgress: latest
            ? latest.tahfizh?.individual?.split(" - ")[1]
            : undefined,
        };

        return {
          ...student,
          progressStats: calculateSDQProgress(safeStudent),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, reports]);

  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ===== HEADER ===== */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Halaqah
          </h1>
          <p className="text-sm text-gray-500">
            Data realtime dari Firebase
          </p>
        </div>
        <Button>+ Input Laporan</Button>
      </header>

      {/* ===== CAPAIAN TARGET ===== */}
      <section className="bg-white rounded-2xl border shadow-sm">
        <div className="px-6 py-4 flex items-center gap-2 border-b bg-gray-50 rounded-t-2xl">
          <Trophy size={18} className="text-yellow-500" />
          <h3 className="font-semibold text-gray-800">
            Capaian Target Kelas
          </h3>
        </div>

        <div className="p-6 space-y-5">
          {studentsWithProgress.length === 0 && (
            <p className="text-center text-gray-400 py-10">
              Belum ada data siswa
            </p>
          )}

          {studentsWithProgress.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelected(s)}
              className="group cursor-pointer rounded-xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition"
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="font-semibold text-gray-800">
                    {s.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Target: {s.progressStats.target}{" "}
                    {s.progressStats.unit}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      s.progressStats.percentage >= 100
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {s.progressStats.p
