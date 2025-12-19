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

interface StudentWithProgress extends Student {
  progressStats: ReturnType<typeof calculateSDQProgress>;
}

export default function GuruDashboardPage() {
  const teacherId = "CURRENT_TEACHER_ID"; // ambil dari auth/context kamu

  const [students, setStudents] = useState<Student[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<StudentWithProgress | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

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
    return students.map((student) => {
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
    });
  }, [students, reports]);

  /* ================= UI ================= */
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Halaqah</h1>
          <p className="text-gray-500 text-sm">
            Data realtime dari Firebase
          </p>
        </div>
        <Button>+ Input Laporan</Button>
      </header>

      <section className="bg-white rounded-xl border">
        <div className="p-6 flex items-center gap-2 border-b bg-gray-50">
          <Trophy className="text-yellow-500" size={18} />
          <h3 className="font-bold">Capaian Target Kelas</h3>
        </div>

        <div className="p-6 space-y-4">
          {studentsWithProgress.length === 0 && (
            <p className="text-center text-gray-400">
              Belum ada data siswa
            </p>
          )}

          {studentsWithProgress.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelected(s)}
              className="cursor-pointer p-3 rounded-lg hover:bg-gray-50"
            >
              <div className="flex justify-between mb-2">
                <strong>{s.name}</strong>
                <span>{s.progressStats.percentage}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded">
                <div
                  className={`h-full ${s.progressStats.colorClass}`}
                  style={{
                    width: `${Math.min(
                      s.progressStats.percentage,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h3 className="font-bold mb-4">
              Evaluasi {selected.name}
            </h3>

            {!aiText ? (
              <Button
                isLoading={loadingAI}
                onClick={async () => {
                  setLoadingAI(true);
                  setAiText(
                    await generateStudentEvaluation(selected)
                  );
                  setLoadingAI(false);
                }}
              >
                <Sparkles className="mr-2" /> Generate Evaluasi
              </Button>
            ) : (
              <pre className="text-sm whitespace-pre-wrap">
                {aiText}
              </pre>
            )}

            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => {
                setSelected(null);
                setAiText(null);
              }}
            >
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
