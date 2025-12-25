
import React, { useEffect, useState, useMemo } from 'react';
import { 
  subscribeToStudentsByTeacher, 
  subscribeToReportsByTeacher 
} from '../../../services/firestoreService';
import { calculateSDQProgress } from '../../../services/sdqTargets';
import { Student, Report } from '../../../types';

interface GuruDashboardProps {
  teacherId?: string;
}

/**
 * PixarStyleProgressWidget
 * A standalone UI widget following strict 3D Pixar-style design guidelines.
 */
const PixarStyleProgressWidget = ({ percentage }: { percentage: number }) => {
  const getWidgetColor = (p: number) => {
    if (p >= 90) return '#22c55e'; // Green
    if (p >= 75) return '#a3e635'; // Yellow-green
    if (p >= 50) return '#facc15'; // Yellow
    if (p >= 25) return '#f97316'; // Orange
    return '#f87171'; // Soft red
  };

  const activeColor = getWidgetColor(percentage);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-10 py-12 px-6 w-full max-w-sm mx-auto">
      {/* 1) Circular Progress Indicator */}
      <div className="relative w-48 h-48 flex items-center justify-center group">
        {/* Soft 3D Plastic Base */}
        <div className="absolute inset-0 rounded-full bg-white shadow-[0_15px_35px_rgba(0,0,0,0.08),inset_0_-6px_10px_rgba(0,0,0,0.1)] border-[6px] border-white"></div>
        
        {/* SVG Ring with Studio Lighting Feel */}
        <svg className="w-full h-full transform -rotate-90 relative z-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
          {/* Track */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="#f0f2f5"
            strokeWidth="14"
            fill="transparent"
          />
          {/* Progress (3D Plastic/Glossy) */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke={activeColor}
            strokeWidth="14"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Inner Percentage Content (Plastic Surface) */}
        <div className="absolute inset-6 rounded-full bg-white flex items-center justify-center shadow-[inset_0_4px_12px_rgba(0,0,0,0.04),0_10px_25px_rgba(0,0,0,0.02)] z-20 border border-gray-50">
          <span className="text-5xl font-black tracking-tighter transition-colors duration-500" style={{ color: activeColor }}>
            {percentage}<span className="text-2xl ml-0.5 opacity-80">%</span>
          </span>
        </div>
      </div>

      {/* 2) Horizontal Linear Progress Bar */}
      <div className="w-full h-8 bg-white rounded-full p-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.06),0_2px_4px_rgba(255,255,255,0.9)] border border-gray-100 relative overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 relative shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
          style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: activeColor }}
        >
          {/* 3D Glossy/Plastic Effects (Pixar Style) */}
          {/* Top High-Gloss Shine */}
          <div className="absolute top-[10%] left-[2%] right-[2%] h-[25%] bg-gradient-to-b from-white/40 to-transparent rounded-full blur-[0.5px]"></div>
          
          {/* Bottom Depth Shadow */}
          <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-black/10 rounded-b-full"></div>
          
          {/* Central Glow Surface */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default function GuruDashboard({ teacherId }: GuruDashboardProps) {
  const [rawStudents, setRawStudents] = useState<Student[]>([]);
  const [rawReports, setRawReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!teacherId) return;
    const unsubStudents = subscribeToStudentsByTeacher(teacherId, setRawStudents);
    const unsubReports = subscribeToReportsByTeacher(teacherId, setRawReports);
    return () => {
      unsubStudents();
      unsubReports();
    };
  }, [teacherId]);

  const classAverage = useMemo(() => {
    if (rawStudents.length === 0) return 0;
    const progressList = rawStudents.map(student => {
      const studentReports = rawReports.filter(r => r.studentId === student.id);
      studentReports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const latestReport = studentReports[0];

      const effectiveData = {
        ...student,
        totalHafalan: latestReport?.totalHafalan || { juz: 0, pages: 0, lines: 0 },
        currentProgress: latestReport?.tahfizh?.individual?.split(' - ')[1] || "-"
      };

      return calculateSDQProgress(effectiveData).percentage;
    });

    return Math.round(progressList.reduce((acc, p) => acc + p, 0) / progressList.length);
  }, [rawStudents, rawReports]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Widget Container - Plain, clean, neutral background */}
      <div className="w-full max-w-xl">
        <PixarStyleProgressWidget percentage={classAverage} />
      </div>
    </div>
  );
}
