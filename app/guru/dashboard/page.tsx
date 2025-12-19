"use client";

import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Trophy, Sparkles } from "lucide-react";

import { Button } from "@/components/Button";
import {
  subscribeToStudentsByTeacher,
  subscribeToReportsByTeacher,
} from "@/services/firestoreService";
import { calculateSDQProgress } from "@/services/sdqTargets";
import { generateStudentEvaluation } from "@/services/geminiService";

import { Student, Report, User } from "@/types";

/* ================= TYPES ================= */

interface StudentWithProgress extends Student {
  progressStats: ReturnType<typeof calculateSDQProgress>;
}

/* ================= PAGE ================= */

export default function GuruDashboardPage() {
  /* ===== USER DARI LAYOUT ===== */
  const { user } = useOutletContext<{ user: User }>();

  /* ===== STATE ===== */
  const [students, setStudents] = useState<Student[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<StudentWithProgress | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  /* ===== REALTIME FIRESTORE ===== */
  useEffect(() => {
    if (!user?.teacherId) return;

    const unsubStudents = subscribeToStudentsByTeacher(
      user.teacherId,
      setStudents
    );

    const unsubReports = subscribeToReportsByTeacher(
      user.teacherId,
      setReports
    );

    return () => {
      unsubStudents();
      unsubReports();
    };
  }, [user?.teacherId]);

  /* ===== STUDENT + PROGRESS ===== */
  const studentsWithProgress = useMemo(() => {
    return students
      .map((student) => {
        const latestReport = reports
          .filter((r) => r.studentId === student.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

        const safeStudent: Student = {
          ...student,
          totalHafalan: latestReport?.totalHafalan ?? {
            juz: 0,
            pages: 0,
            lines: 0,
          },
          currentProgress:
            latestReport?.tahfizh?.individual?.split(" - ")[1],
        };

        return {
          ...student,
          progressStats: calculateSDQProgress(safeStudent),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, reports]);

  /* ===== STATISTICS ===== */
  const stats = useMemo(() => {
    const total = studentsWithProgress.length;
    const completed = studentsWithProgress.filter(
      (s) => s.progressStats.percentage >= 100
    ).length;
    const onTrack = studentsWithProgress.filter(
      (s) =>
        s.progressStats.percentage >= 80 &&
        s.progressStats.percentage < 100
    ).length;
    const needAttention = studentsWithProgress.filter(
      (s) => s.progressStats.percentage < 50
    ).length;

    return { total, completed, onTrack, needAttention };
  }, [studentsWithProgress]);

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
            Data siswa berdasarkan halaqah Anda
          </p>
        </div>

        <Button>+ Input Laporan</Button>
      </header>

      {/* ===== STAT CARDS ===== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Siswa" value={stats.total} />
        <StatCard title="Target Tercapai" value={stats.completed} color="green" />
        <StatCard title="On Track" value={stats.onTrack} color="blue" />
        <StatCard
          title="Perlu Perhatian"
          value={stats.needAttention}
          color="red"
        />
      </section>

      {/* ===== CAPAIAN TARGET ===== */}
      <section className="bg-white rounded-2xl border shadow-sm">
        <div className="px-6 py-4 flex items-center gap-2 border-b bg-gray-50 rounded-t-2xl">
          <Trophy size={18} className="text-yellow-500" />
          <h3 className="font-semibold text-gray-800">
            Capaian Target Kelas
          </h3>
        </div>

        <div className="p-6 space-y-4">
          {studentsWithProgress.length === 0 && (
            <p className="text-center text-gray-400 py-10">
              Belum ada siswa di halaqah ini
            </p>
          )}

          {studentsWithProgress.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                setSelected(s);
                setAiText(null);
              }}
              className="cursor-pointer rounded-xl p-4 border hover:shadow-sm transition"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-semibold text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-500">
                    Target: {s.progressStats.target}{" "}
                    {s.progressStats.unit}
                  </p>
                </div>

                <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {s.progressStats.percentage}%
                </span>
              </div>

              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
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

      {/* ===== MODAL EVALUASI ===== */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-4">
              Evaluasi {selected.name}
            </h3>

            {!aiText ? (
              <Button
                isLoading={loadingAI}
                onClick={async () => {
                  setLoadingAI(true);
                  const result = await generateStudentEvaluation(selected);
                  setAiText(result);
                  setLoadingAI(false);
                }}
              >
                <Sparkles size={16} className="mr-2" />
                Generate Evaluasi
              </Button>
            ) : (
              <div className="bg-gray-50 border rounded-lg p-4 text-sm whitespace-pre-wrap">
                {aiText}
              </div>
            )}

            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => setSelected(null)}
            >
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= SMALL COMPONENT ================= */

function StatCard({
  title,
  value,
  color = "gray",
}: {
  title: string;
  value: number;
  color?: "gray" | "green" | "blue" | "red";
}) {
  const colors = {
    gray: "text-gray-800",
    green: "text-green-600",
    blue: "text-blue-600",
    red: "text-red-600",
  };

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm text-center">
      <p className="text-xs font-semibold text-gray-400 uppercase">
        {title}
      </p>
      <p className={`text-3xl font-bold mt-1 ${colors[color]}`}>
        {value}
      </p>
    </div>
  );
}
