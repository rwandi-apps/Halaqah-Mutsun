import React, { useEffect, useState, useMemo } from 'react';
import { Student, SetoranSabak, User } from '../../../types';
import { getStudentGender, extractClassLevel } from '../../../services/sdqTargets';
import { 
  getAllTeachers, 
  subscribeToAllStudents, 
  subscribeToAllSetoranSabak 
} from '../../../services/firestoreService';
import { 
  Search, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Users, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  History, 
  X, 
  Clock,
  Filter,
  Trophy,
  TrendingUp,
  TrendingDown,
  Star,
  MessageSquareQuote,
  Edit3,
  Save,
  Target,
  Sparkles,
  Minus,
  RotateCcw
} from 'lucide-react';

const getCurrentAcademicYear = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11
  if (month >= 6) { // July or later
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

const INITIAL_AY = getCurrentAcademicYear();
const ACADEMIC_YEARS = ["2024/2025", "2025/2026", "2026/2027"];
if (!ACADEMIC_YEARS.includes(INITIAL_AY)) {
  ACADEMIC_YEARS.push(INITIAL_AY);
}

// --- WEEK RANGE HELPERS ---

const getWeekNumber = (d: Date): number => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

interface WeekOption {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

const getWeeksForAcademicYear = (academicYear: string): WeekOption[] => {
  const [startYearStr, endYearStr] = academicYear.split('/');
  const startYear = parseInt(startYearStr) || 2025;
  const endYear = parseInt(endYearStr) || 2026;
  
  const weeks: WeekOption[] = [];
  let current = new Date(startYear, 6, 1); // July 1st
  const endLimit = new Date(endYear, 5, 30, 23, 59, 59); // June 30th
  
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current.setDate(diff);
  current.setHours(0, 0, 0, 0);
  
  let weekNum = 1;
  while (current <= endLimit) {
    const start = new Date(current);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    const startStr = start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const endStr = end.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    
    weeks.push({
      id: `${start.getFullYear()}-W${getWeekNumber(start)}`,
      label: `Pekan ${weekNum} (${startStr} - ${endStr})`,
      startDate: start,
      endDate: end
    });
    
    current.setDate(current.getDate() + 7);
    weekNum++;
  }
  
  return weeks;
};

const isDateInWeek = (dateStr: string, startDate: Date, endDate: Date): boolean => {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day, 12, 0, 0);
  const t = d.getTime();
  return t >= startDate.getTime() && t <= endDate.getTime();
};

const getDefaultWeek = (weeks: WeekOption[]): WeekOption | null => {
  if (weeks.length === 0) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const t = today.getTime();
  const found = weeks.find(w => t >= w.startDate.getTime() && t <= w.endDate.getTime());
  if (found) return found;
  
  if (t > weeks[weeks.length - 1].endDate.getTime()) {
    return weeks[weeks.length - 1];
  }
  return weeks[0];
};

const DEFAULT_COORDINATOR_NOTE = "Alhamdulillah terdapat peningkatan setoran pada beberapa halaqah kelas 3. Jazakumullahu khairan kepada seluruh guru yang telah konsisten melakukan mutabaah dan pendampingan. Mari bersama-sama membantu halaqah yang masih memerlukan dukungan agar seluruh ananda mendapatkan layanan terbaik.";

export const MonitoringSetoranSabak: React.FC = () => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sabakRecords, setSabakRecords] = useState<SetoranSabak[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedYear, setSelectedYear] = useState(INITIAL_AY);
  const [selectedWeek, setSelectedWeek] = useState<WeekOption | null>(null);
  const [selectedGender, setSelectedGender] = useState('Semua');
  const [selectedClass, setSelectedClass] = useState('Semua');
  const [selectedTeacher, setSelectedTeacher] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  // Target Sekolah (%)
  const TARGET_SEKOLAH_PERCENT = 80;

  // Coordinator Note state
  const [customNotesByWeek, setCustomNotesByWeek] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sdq_koordinator_custom_notes');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState('');

  // Accordion open/close states (grouped by class name)
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  // Expanded halaqahs inside expanded classes
  const [expandedHalaqahs, setExpandedHalaqahs] = useState<Record<string, boolean>>({});

  // History modal state
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [historyRecords, setHistoryRecords] = useState<SetoranSabak[]>([]);

  // Page index state for paginating students in a selected halaqah
  const [halaqahPage, setHalaqahPage] = useState<Record<string, number>>({});

  // 1. Initial Load of Teachers
  useEffect(() => {
    getAllTeachers().then(data => {
      setTeachers(data.filter(u => u.role === 'GURU'));
    });
  }, []);

  // 2. Real-time Subscriptions to Students and Sabak Records
  useEffect(() => {
    setIsLoading(true);
    const unsubStudents = subscribeToAllStudents((data) => {
      setStudents(data);
    });

    const unsubSabak = subscribeToAllSetoranSabak((data) => {
      setSabakRecords(data);
      setIsLoading(false);
    });

    return () => {
      unsubStudents();
      unsubSabak();
    };
  }, []);

  // 3. Dynamically compute weeks when Selected Academic Year changes
  const weekOptions = useMemo(() => {
    return getWeeksForAcademicYear(selectedYear);
  }, [selectedYear]);

  // Update selected week default when academic year changes
  useEffect(() => {
    if (weekOptions.length > 0) {
      const def = getDefaultWeek(weekOptions);
      setSelectedWeek(def);
    }
  }, [weekOptions]);

  // Index of current selected week
  const selectedWeekIndex = useMemo(() => {
    if (!selectedWeek) return -1;
    return weekOptions.findIndex(w => w.id === selectedWeek.id);
  }, [selectedWeek, weekOptions]);

  // Previous Week Option
  const previousWeekOption = useMemo(() => {
    if (selectedWeekIndex > 0) {
      return weekOptions[selectedWeekIndex - 1];
    }
    return null;
  }, [selectedWeekIndex, weekOptions]);

  // 4. Resolve Filters
  const uniqueClasses = useMemo(() => {
    const list = students.map(s => s.className).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [students]);

  const teacherMap = useMemo(() => {
    const map: Record<string, string> = {};
    teachers.forEach(t => {
      map[t.id] = t.nickname || t.name;
    });
    return map;
  }, [teachers]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesYear = student.className !== "Lulus / Alumni";
      const matchesGender = selectedGender === 'Semua' || 
        (selectedGender === 'Ikhwan' && getStudentGender(student) === 'L') || 
        (selectedGender === 'Akhwat' && getStudentGender(student) === 'P');
      const matchesClass = selectedClass === 'Semua' || student.className === selectedClass;
      const matchesTeacher = selectedTeacher === 'Semua' || student.teacherId === selectedTeacher;
      const matchesSearch = searchTerm === '' || student.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesYear && matchesGender && matchesClass && matchesTeacher && matchesSearch;
    });
  }, [students, selectedGender, selectedClass, selectedTeacher, searchTerm]);

  // Map of Student ID -> array of setoran_sabak records in the selected week
  const sabakInSelectedWeekByStudent = useMemo(() => {
    const map: Record<string, SetoranSabak[]> = {};
    if (!selectedWeek) return map;

    sabakRecords.forEach(rec => {
      if (isDateInWeek(rec.tanggal, selectedWeek.startDate, selectedWeek.endDate)) {
        if (!map[rec.siswaId]) {
          map[rec.siswaId] = [];
        }
        map[rec.siswaId].push(rec);
      }
    });
    return map;
  }, [sabakRecords, selectedWeek]);

  // Map of Student ID -> array of setoran_sabak records in the previous week
  const sabakInPreviousWeekByStudent = useMemo(() => {
    const map: Record<string, SetoranSabak[]> = {};
    if (!previousWeekOption) return map;

    sabakRecords.forEach(rec => {
      if (isDateInWeek(rec.tanggal, previousWeekOption.startDate, previousWeekOption.endDate)) {
        if (!map[rec.siswaId]) {
          map[rec.siswaId] = [];
        }
        map[rec.siswaId].push(rec);
      }
    });
    return map;
  }, [sabakRecords, previousWeekOption]);

  // Map of Student ID -> latest setoran_sabak record (entire history)
  const latestSabakByStudent = useMemo(() => {
    const map: Record<string, SetoranSabak> = {};
    sabakRecords.forEach(rec => {
      if (!map[rec.siswaId]) {
        map[rec.siswaId] = rec;
      }
    });
    return map;
  }, [sabakRecords]);

  // Grouped Data: Kelas -> Halaqah (Teacher) -> Students
  const hierarchicalData = useMemo(() => {
    const groups: Record<string, {
      className: string;
      halaqahs: Record<string, {
        teacherId: string;
        teacherName: string;
        students: Student[];
        alreadyDepositedCount: number;
        notYetDepositedCount: number;
      }>;
    }> = {};

    filteredStudents.forEach(student => {
      const cls = student.className;
      const tId = student.teacherId;
      const tName = teacherMap[tId] || 'Guru Tidak Teridentifikasi';

      // Exclusion rule: Eric in Ubay & Zubair in Muadz
      const isEricInUbay = cls?.toLowerCase().includes("ubay") && tName?.toLowerCase().includes("eric");
      const isZubairInMuadz = cls?.toLowerCase().includes("muadz") && tName?.toLowerCase().includes("zubair");

      if (isEricInUbay || isZubairInMuadz) {
        return;
      }

      if (!groups[cls]) {
        groups[cls] = { className: cls, halaqahs: {} };
      }

      if (!groups[cls].halaqahs[tId]) {
        groups[cls].halaqahs[tId] = {
          teacherId: tId,
          teacherName: tName,
          students: [],
          alreadyDepositedCount: 0,
          notYetDepositedCount: 0
        };
      }

      groups[cls].halaqahs[tId].students.push(student);

      const weeklySetorans = sabakInSelectedWeekByStudent[student.id] || [];
      if (weeklySetorans.length > 0) {
        groups[cls].halaqahs[tId].alreadyDepositedCount++;
      } else {
        groups[cls].halaqahs[tId].notYetDepositedCount++;
      }
    });

    return Object.values(groups)
      .map(g => ({
        className: g.className,
        halaqahs: Object.values(g.halaqahs).sort((a, b) => a.teacherName.localeCompare(b.teacherName))
      }))
      .sort((a, b) => a.className.localeCompare(b.className));
  }, [filteredStudents, teacherMap, sabakInSelectedWeekByStudent]);

  // Summary Metrics for Header
  const metrics = useMemo(() => {
    const sabaqTargetStudents = filteredStudents.filter(s => extractClassLevel(s.className) !== 1);
    const grade1Students = filteredStudents.filter(s => extractClassLevel(s.className) === 1);

    const isOnlyGrade1Selected = selectedClass !== 'Semua' && extractClassLevel(selectedClass) === 1;
    const activeTargetList = isOnlyGrade1Selected ? grade1Students : sabaqTargetStudents;

    let totalStudents = filteredStudents.length;
    let totalSetoransThisWeek = 0;
    let studentsDepositedCount = 0;

    filteredStudents.forEach(s => {
      const weekly = sabakInSelectedWeekByStudent[s.id] || [];
      totalSetoransThisWeek += weekly.length;
    });

    activeTargetList.forEach(s => {
      const weekly = sabakInSelectedWeekByStudent[s.id] || [];
      if (weekly.length > 0) {
        studentsDepositedCount++;
      }
    });

    const targetStudentCount = activeTargetList.length;
    const percentageSchool = targetStudentCount > 0 ? Math.round((studentsDepositedCount / targetStudentCount) * 100) : 0;

    return {
      totalStudents,
      sabaqTargetStudentsCount: sabaqTargetStudents.length,
      grade1StudentsCount: grade1Students.length,
      targetStudentCount,
      totalSetoransThisWeek,
      studentsDepositedCount,
      studentsNotYetDepositedCount: targetStudentCount - studentsDepositedCount,
      percentageSchool,
      isOnlyGrade1Selected
    };
  }, [filteredStudents, sabakInSelectedWeekByStudent, selectedClass]);

  // Previous Week Metrics for Weekly Trend
  const previousMetrics = useMemo(() => {
    let studentsDepositedPrev = 0;
    const sabaqTargetStudents = filteredStudents.filter(s => extractClassLevel(s.className) !== 1);
    const isOnlyGrade1Selected = selectedClass !== 'Semua' && extractClassLevel(selectedClass) === 1;
    const activeTargetList = isOnlyGrade1Selected 
      ? filteredStudents.filter(s => extractClassLevel(s.className) === 1) 
      : sabaqTargetStudents;

    activeTargetList.forEach(s => {
      const prevWeekly = sabakInPreviousWeekByStudent[s.id] || [];
      if (prevWeekly.length > 0) {
        studentsDepositedPrev++;
      }
    });

    return {
      studentsDepositedCount: studentsDepositedPrev
    };
  }, [filteredStudents, sabakInPreviousWeekByStudent, selectedClass]);

  // Trend Calculations
  const trendData = useMemo(() => {
    const current = metrics.studentsDepositedCount;
    const prev = previousMetrics.studentsDepositedCount;
    const diff = current - prev;
    
    let pct = 0;
    if (prev > 0) {
      pct = Math.round((Math.abs(diff) / prev) * 100);
    } else if (current > 0) {
      pct = 100;
    }

    let status: 'up' | 'down' | 'stable' = 'stable';
    if (diff > 0) status = 'up';
    else if (diff < 0) status = 'down';

    return {
      current,
      prev,
      diff,
      pct,
      status
    };
  }, [metrics.studentsDepositedCount, previousMetrics.studentsDepositedCount]);

  // Section 1: Appreciation Cards Computations
  const appreciationCards = useMemo(() => {
    interface HalaqahPerf {
      className: string;
      teacherId: string;
      teacherName: string;
      totalStudents: number;
      alreadyCount: number;
      prevAlreadyCount: number;
      pct: number;
      prevPct: number;
      diffPct: number;

      // INTENSITAS SETORAN (Target ideal 5 hari KBM = 5 kali setoran per siswa per pekan)
      totalSetorans: number;
      prevTotalSetorans: number;
      targetSetorans: number; // totalStudents * 5
      avgSetoranPerStudent: number;
      prevAvgSetoranPerStudent: number;
      intensityPct: number; // Math.min(100, Math.round((totalSetorans / targetSetorans) * 100))
      prevIntensityPct: number;

      // SCORE GABUNGAN (35% Partisipasi Siswa + 65% Intensitas Setoran 5 Hari KBM)
      combinedScore: number;
      prevCombinedScore: number;
      diffCombinedScore: number;
      diffAvgSetoran: number;
      diffIntensityPct: number;
    }

    const perfList: HalaqahPerf[] = [];

    hierarchicalData.forEach(clsGroup => {
      // Kelas 1 berada pada tahap Pra-Sabaq / Iqra, sehingga tidak diikutsertakan dalam kompetisi ranking Sabaq
      if (extractClassLevel(clsGroup.className) === 1) return;

      clsGroup.halaqahs.forEach(hal => {
        if (hal.students.length === 0) return;

        let totalSetorans = 0;
        let prevTotalSetorans = 0;
        let prevAlready = 0;

        hal.students.forEach(s => {
          const currentWeekly = sabakInSelectedWeekByStudent[s.id] || [];
          totalSetorans += currentWeekly.length;

          const prevWeekly = sabakInPreviousWeekByStudent[s.id] || [];
          prevTotalSetorans += prevWeekly.length;
          if (prevWeekly.length > 0) {
            prevAlready++;
          }
        });

        const totalStudents = hal.students.length;
        const targetSetorans = totalStudents * 5; // Ideal 5 hari KBM

        // Current week metrics
        const pct = Math.round((hal.alreadyDepositedCount / totalStudents) * 100);
        const avgSetoranPerStudent = totalStudents > 0 ? (totalSetorans / totalStudents) : 0;
        const intensityPct = targetSetorans > 0 ? Math.min(100, Math.round((totalSetorans / targetSetorans) * 100)) : 0;
        const combinedScore = Math.round((pct * 0.35) + (intensityPct * 0.65));

        // Previous week metrics
        const prevPct = Math.round((prevAlready / totalStudents) * 100);
        const prevAvgSetoranPerStudent = totalStudents > 0 ? (prevTotalSetorans / totalStudents) : 0;
        const prevIntensityPct = targetSetorans > 0 ? Math.min(100, Math.round((prevTotalSetorans / targetSetorans) * 100)) : 0;
        const prevCombinedScore = Math.round((prevPct * 0.35) + (prevIntensityPct * 0.65));

        // Differences
        const diffPct = pct - prevPct;
        const diffAvgSetoran = avgSetoranPerStudent - prevAvgSetoranPerStudent;
        const diffIntensityPct = intensityPct - prevIntensityPct;
        const diffCombinedScore = combinedScore - prevCombinedScore;

        perfList.push({
          className: clsGroup.className,
          teacherId: hal.teacherId,
          teacherName: hal.teacherName,
          totalStudents,
          alreadyCount: hal.alreadyDepositedCount,
          prevAlreadyCount: prevAlready,
          pct,
          prevPct,
          diffPct,
          totalSetorans,
          prevTotalSetorans,
          targetSetorans,
          avgSetoranPerStudent,
          prevAvgSetoranPerStudent,
          intensityPct,
          prevIntensityPct,
          combinedScore,
          prevCombinedScore,
          diffCombinedScore,
          diffAvgSetoran,
          diffIntensityPct
        });
      });
    });

    // 1. Halaqah Terbaik Pekan Ini (Memperhitungkan persentase partisipasi & intensitas setoran 5 hari KBM)
    const sortedByScore = [...perfList].sort((a, b) => 
      b.combinedScore - a.combinedScore || 
      b.intensityPct - a.intensityPct || 
      b.avgSetoranPerStudent - a.avgSetoranPerStudent || 
      b.pct - a.pct
    );
    const topHalaqah = sortedByScore[0] || null;

    // 2. Peningkatan Terbaik (Memperhitungkan pertumbuhan intensitas setoran per siswa dibanding pekan lalu)
    const sortedByGrowth = [...perfList].sort((a, b) => 
      b.diffCombinedScore - a.diffCombinedScore || 
      b.diffIntensityPct - a.diffIntensityPct || 
      b.diffAvgSetoran - a.diffAvgSetoran || 
      b.diffPct - a.diffPct
    );
    const topGrowth = sortedByGrowth[0] || null;

    // 3. Konsistensi Terbaik (Kestabilan intensitas setoran mendekati/mencapai target 5 hari KBM)
    const highIntensityList = perfList.filter(h => h.intensityPct >= 75 || h.avgSetoranPerStudent >= 3.8);
    const sortedByConsistency = (highIntensityList.length > 0 ? highIntensityList : sortedByScore).sort((a, b) => 
      (b.intensityPct + b.prevIntensityPct) - (a.intensityPct + a.prevIntensityPct) ||
      b.combinedScore - a.combinedScore
    );
    const topConsistency = sortedByConsistency[0] || null;

    return {
      topHalaqah,
      topGrowth,
      topConsistency
    };
  }, [hierarchicalData, sabakInSelectedWeekByStudent, sabakInPreviousWeekByStudent]);

  // Generator Otomatis Pesan Koordinator berdasarkan Data Pekan Ini
  const autoGeneratedNote = useMemo(() => {
    if (!selectedWeek) {
      return "Alhamdulillah, mari terus tingkatkan semangat pendampingan setoran sabaq ananda di seluruh halaqah.";
    }

    const weekLabel = selectedWeek.label;
    const { targetStudentCount, studentsDepositedCount, percentageSchool } = metrics;
    const { topHalaqah, topGrowth } = appreciationCards;

    let sentence = `Alhamdulillah, pada ${weekLabel}, sebanyak ${studentsDepositedCount} dari ${targetStudentCount} siswa target Sabaq (${percentageSchool}%) telah aktif menyetorkan sabaq. `;

    if (percentageSchool >= TARGET_SEKOLAH_PERCENT) {
      sentence += `Capaian sekolah telah berhasil mencapai target ${TARGET_SEKOLAH_PERCENT}%. Barakallahu fiikum! `;
    } else {
      const gap = TARGET_SEKOLAH_PERCENT - percentageSchool;
      sentence += `Tersisa selisih ${gap}% lagi menuju target sekolah (${TARGET_SEKOLAH_PERCENT}%). `;
    }

    if (topHalaqah && topHalaqah.alreadyCount > 0) {
      sentence += `Apresiasi setinggi-tingginya kepada Halaqah ${topHalaqah.teacherName} (${topHalaqah.className}) dengan partisipasi siswa ${topHalaqah.pct}% dan rata-rata intensitas setoran ${topHalaqah.avgSetoranPerStudent.toFixed(1)}x/pekan dari target 5 hari KBM (${topHalaqah.intensityPct}%). `;
    }

    if (topGrowth && topGrowth.diffAvgSetoran > 0) {
      sentence += `Juga puji syukur atas peningkatan signifikan pada Halaqah ${topGrowth.teacherName} (naik +${topGrowth.diffAvgSetoran.toFixed(1)}x setoran/siswa dibanding pekan lalu). `;
    }

    sentence += `Jazakumullahu khairan kepada seluruh ustadz dan ustadzah atas istiqamah bimbingannya. Mari bersama-sama menguatkan dan merangkul ananda agar seluruhnya mendapatkan pendampingan terbaik.`;

    return sentence;
  }, [selectedWeek, metrics, appreciationCards]);

  const activeNote = useMemo(() => {
    if (selectedWeek && customNotesByWeek[selectedWeek.id]) {
      return customNotesByWeek[selectedWeek.id];
    }
    return autoGeneratedNote;
  }, [selectedWeek, customNotesByWeek, autoGeneratedNote]);

  const isCustomNote = useMemo(() => {
    return !!(selectedWeek && customNotesByWeek[selectedWeek.id]);
  }, [selectedWeek, customNotesByWeek]);

  // Note Handlers
  const handleStartEditNote = () => {
    setTempNote(activeNote);
    setIsEditingNote(true);
  };

  const handleSaveNote = () => {
    if (!selectedWeek) return;
    const updated = {
      ...customNotesByWeek,
      [selectedWeek.id]: tempNote
    };
    setCustomNotesByWeek(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sdq_koordinator_custom_notes', JSON.stringify(updated));
    }
    setIsEditingNote(false);
  };

  const handleResetToAutoNote = () => {
    if (!selectedWeek) return;
    const updated = { ...customNotesByWeek };
    delete updated[selectedWeek.id];
    setCustomNotesByWeek(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sdq_koordinator_custom_notes', JSON.stringify(updated));
    }
    setTempNote(autoGeneratedNote);
  };

  const handleUseAutoTextInEditor = () => {
    setTempNote(autoGeneratedNote);
  };

  // Handle open student history modal
  const handleOpenHistory = (student: Student) => {
    setHistoryStudent(student);
    const history = sabakRecords.filter(r => r.siswaId === student.id);
    setHistoryRecords(history);
  };

  const handleCloseHistory = () => {
    setHistoryStudent(null);
    setHistoryRecords([]);
  };

  const toggleClass = (className: string) => {
    setExpandedClasses(prev => ({
      ...prev,
      [className]: !prev[className]
    }));
  };

  const toggleHalaqah = (halaqahKey: string) => {
    setExpandedHalaqahs(prev => ({
      ...prev,
      [halaqahKey]: !prev[halaqahKey]
    }));
    setHalaqahPage(prev => ({
      ...prev,
      [halaqahKey]: 1
    }));
  };

  return (
    <div className="space-y-6">
      {/* BANNER HEADER */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white p-6 sm:p-8 rounded-[2rem] shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Trophy size={240} />
        </div>
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles size={14} className="text-amber-300" />
            <span>Dashboard Apresiasi & Monitoring</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pantauan Setoran Sabaq Pekanan
          </h1>
          <p className="text-emerald-100 text-sm font-medium leading-relaxed">
            Media kolaborasi untuk apresiasi, motivasi, dan saling belajar antar halaqah. Fokus utama kita adalah mendorong pertumbuhan hafalan ananda dalam suasana yang saling mendukung.
          </p>
        </div>
      </div>

      {/* Notice Banner Target Sabaq Kelas 1 */}
      <div className="bg-sky-50 border border-sky-200/90 text-sky-950 px-5 py-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-sky-700 text-white font-black text-[10px] uppercase tracking-wider shrink-0">
            Target Sabaq SDQ
          </span>
          <span className="text-sky-900 leading-relaxed">
            {metrics.isOnlyGrade1Selected ? (
              <strong>Siswa Kelas 1 berada pada tahap Pra-Sabaq / Iqra (Belum wajib target Sabaq Pekanan). Catatan setoran bersifat opsional / pengayaan.</strong>
            ) : (
              <span>
                Persentase Target Sabaq ({TARGET_SEKOLAH_PERCENT}%) difokuskan untuk <strong>Kelas 2 - 6 ({metrics.sabaqTargetStudentsCount} siswa)</strong>. Kelas 1 ({metrics.grade1StudentsCount} siswa) berada pada tahap Pra-Sabaq / Iqra.
              </span>
            )}
          </span>
        </div>
      </div>

      {/* TAMPILAN HEADER : KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">
              {metrics.isOnlyGrade1Selected ? 'Total Siswa (Kelas 1)' : 'Siswa Target Sabaq (K2-K6)'}
            </p>
            <p className="text-2xl font-black text-gray-800 leading-none">{metrics.targetStudentCount} <span className="text-xs text-gray-400 font-bold">Ananda</span></p>
          </div>
        </div>

        {/* Total Setoran Pekan Ini */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Total Setoran Pekan Ini</p>
            <p className="text-2xl font-black text-indigo-900 leading-none">{metrics.totalSetoransThisWeek} <span className="text-xs text-gray-400 font-bold">Kali Setor</span></p>
          </div>
        </div>

        {/* Sudah Setor & Persentase Sekolah */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-100/80 shadow-sm flex items-center gap-4 bg-gradient-to-br from-white to-emerald-50/20">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Sudah Setor</p>
              <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {metrics.percentageSchool}%
              </span>
            </div>
            <p className="text-xl font-black text-emerald-700 leading-none">
              {metrics.studentsDepositedCount} <span className="text-xs text-gray-400 font-medium">dari {metrics.targetStudentCount} siswa</span>
            </p>
          </div>
        </div>

        {/* Target Sekolah */}
        <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center gap-4 bg-gradient-to-br from-white to-amber-50/20">
          <div className="w-12 h-12 rounded-2xl bg-amber-100/70 flex items-center justify-center text-amber-700 shrink-0">
            <Target size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Target Sekolah</p>
              <span className="text-[11px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {TARGET_SEKOLAH_PERCENT}%
              </span>
            </div>
            <p className="text-xl font-black text-amber-800 leading-none">
              {metrics.percentageSchool >= TARGET_SEKOLAH_PERCENT ? 'Tercapai 🎉' : 'Selisih ' + (TARGET_SEKOLAH_PERCENT - metrics.percentageSchool) + '%'}
            </p>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">
              Belum setor: {metrics.studentsNotYetDepositedCount} siswa ({metrics.targetStudentCount > 0 ? Math.round((metrics.studentsNotYetDepositedCount / metrics.targetStudentCount) * 100) : 0}%)
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4 : PESAN KOORDINATOR */}
      <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-sm space-y-3 relative overflow-hidden bg-gradient-to-r from-emerald-50/40 via-white to-teal-50/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-100/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
              <MessageSquareQuote size={18} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black text-gray-800 tracking-tight">Catatan Koordinator Pekan Ini</h3>
                {isCustomNote ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    ✍️ Catatan Kustom
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <Sparkles size={11} className="text-emerald-600" />
                    Otomatis Berdasarkan Data Pekan Ini
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Apresiasi & Arahan Pembina Tahfizh</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isCustomNote && !isEditingNote && (
              <button
                type="button"
                onClick={handleResetToAutoNote}
                className="px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-sm"
                title="Atur ulang kalimat kembali ke data otomatis pekan ini"
              >
                <RotateCcw size={13} />
                <span>Reset ke Otomatis</span>
              </button>
            )}

            {!isEditingNote ? (
              <button
                type="button"
                onClick={handleStartEditNote}
                className="px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Edit3 size={14} />
                <span>Ubah Catatan</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseAutoTextInEditor}
                  className="px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Isi teks dengan rangkuman data otomatis pekan ini"
                >
                  <Sparkles size={13} />
                  <span>Ambil Kalimat Otomatis</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Save size={14} />
                  <span>Simpan Catatan</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditingNote ? (
          <div className="space-y-2">
            <textarea
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              rows={4}
              className="w-full p-3.5 border border-emerald-200 rounded-2xl text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-inner leading-relaxed"
              placeholder="Tuliskan pesan motivasi atau catatan evaluasi pekanan koordinator..."
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleUseAutoTextInEditor}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 underline"
              >
                <Sparkles size={13} />
                Isi Otomatis Berdasarkan Data Pekan Ini
              </button>
              <div className="flex gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsEditingNote(false)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Simpan Catatan
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed italic bg-white/80 p-4 rounded-2xl border border-emerald-100/60 shadow-sm">
            "{activeNote}"
          </p>
        )}
      </div>

      {/* SECTION 1 : APRESIASI PEKAN INI (3 KARTU HORIZONTAL) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Apresiasi Pekan Ini</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Halaqah Terbaik Pekan Ini */}
          <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-b from-amber-50/30 to-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">🏆 Halaqah Terbaik Pekan Ini</p>
                <h4 className="text-sm font-black text-gray-800 truncate">
                  {appreciationCards.topHalaqah ? appreciationCards.topHalaqah.teacherName : 'Belum Ada Data'}
                </h4>
              </div>
            </div>

            {appreciationCards.topHalaqah ? (
              <div className="bg-white/90 p-3.5 rounded-2xl border border-amber-100 space-y-2">
                <p className="text-xs font-bold text-gray-700">{appreciationCards.topHalaqah.className}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Intensitas Setoran:</span>
                  <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                    ⚡ {appreciationCards.topHalaqah.avgSetoranPerStudent.toFixed(1)}x / 5 Hari KBM ({appreciationCards.topHalaqah.intensityPct}%)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Partisipasi Siswa:</span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {appreciationCards.topHalaqah.pct}% ({appreciationCards.topHalaqah.alreadyCount}/{appreciationCards.topHalaqah.totalStudents} Siswa)
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic font-medium p-3">Data setoran pekan ini sedang dihimpun...</p>
            )}
          </div>

          {/* Card 2: Peningkatan Terbaik */}
          <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-b from-blue-50/30 to-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider">📈 Peningkatan Terbaik</p>
                <h4 className="text-sm font-black text-gray-800 truncate">
                  {appreciationCards.topGrowth ? appreciationCards.topGrowth.teacherName : 'Belum Ada Data'}
                </h4>
              </div>
            </div>

            {appreciationCards.topGrowth ? (
              <div className="bg-white/90 p-3.5 rounded-2xl border border-blue-100 space-y-2">
                <p className="text-xs font-bold text-gray-700">{appreciationCards.topGrowth.className}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Kenaikan Intensitas:</span>
                  <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                    📈 {appreciationCards.topGrowth.diffAvgSetoran >= 0 ? `+${appreciationCards.topGrowth.diffAvgSetoran.toFixed(1)}x` : `${appreciationCards.topGrowth.diffAvgSetoran.toFixed(1)}x`} / siswa ({appreciationCards.topGrowth.diffIntensityPct >= 0 ? `+${appreciationCards.topGrowth.diffIntensityPct}%` : `${appreciationCards.topGrowth.diffIntensityPct}%`})
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Rata-rata Pekan Ini:</span>
                  <span className="font-extrabold text-gray-700">
                    {appreciationCards.topGrowth.avgSetoranPerStudent.toFixed(1)}x / 5 Hari KBM
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic font-medium p-3">Data perbandingan pekanan belum tersedia...</p>
            )}
          </div>

          {/* Card 3: Konsistensi Terbaik */}
          <div className="bg-white p-5 rounded-3xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-b from-purple-50/30 to-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20 shrink-0">
                <Star size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider">⭐ Konsistensi Terbaik</p>
                <h4 className="text-sm font-black text-gray-800 truncate">
                  {appreciationCards.topConsistency ? appreciationCards.topConsistency.teacherName : 'Belum Ada Data'}
                </h4>
              </div>
            </div>

            {appreciationCards.topConsistency ? (
              <div className="bg-white/90 p-3.5 rounded-2xl border border-purple-100 space-y-2">
                <p className="text-xs font-bold text-gray-700">{appreciationCards.topConsistency.className}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Intensitas Setoran:</span>
                  <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                    ⭐ {appreciationCards.topConsistency.avgSetoranPerStudent.toFixed(1)}x / 5 Hari KBM ({appreciationCards.topConsistency.intensityPct}%)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Status Keaktifan:</span>
                  <span className="font-extrabold text-purple-800">
                    {appreciationCards.topConsistency.avgSetoranPerStudent >= 4.5 ? 'Istiqamah Optimal (5 Hari KBM)' : 'Istiqamah Tinggi'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic font-medium p-3">Memuat riwayat konsistensi halaqah...</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3 : TREN PEKANAN & FILTER PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SECTION 3 : TREN PEKANAN WIDGET */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} className="text-emerald-600" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Tren Pekanan Setoran</h3>
            </div>
            <p className="text-xs text-gray-400 font-medium">Perbandingan keaktifan siswa menyetor pekan lalu & pekan ini.</p>
          </div>

          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-bold">Pekan Lalu:</span>
              <span className="font-extrabold text-gray-800">{trendData.prev} Siswa</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-bold">Pekan Ini:</span>
              <span className="font-extrabold text-emerald-700">{trendData.current} Siswa</span>
            </div>

            <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Indikator Tren:</span>
              {trendData.status === 'up' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <TrendingUp size={14} />
                  ⬆️ Naik {trendData.pct}%
                </span>
              )}
              {trendData.status === 'down' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                  <TrendingDown size={14} />
                  ⬇️ Turun {trendData.pct}%
                </span>
              )}
              {trendData.status === 'stable' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700 border border-gray-200">
                  <Minus size={14} />
                  ➡️ Stabil
                </span>
              )}
            </div>
          </div>
        </div>

        {/* FILTER TOOLBAR */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">Filter Data Monitor</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Tahun Ajaran */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Tahun Ajaran</label>
              <select 
                value={selectedYear} 
                onChange={e => setSelectedYear(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Pekan Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Pekan Berjalan</label>
              <select 
                value={selectedWeek ? selectedWeek.id : ''} 
                onChange={e => {
                  const found = weekOptions.find(w => w.id === e.target.value);
                  if (found) setSelectedWeek(found);
                }} 
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {weekOptions.length === 0 && <option value="">Membuat pekan...</option>}
                {weekOptions.map(w => (
                  <option key={w.id} value={w.id}>{w.label}</option>
                ))}
              </select>
            </div>

            {/* Jenis Kelamin */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Kategori Guru / Siswa</label>
              <select 
                value={selectedGender} 
                onChange={e => setSelectedGender(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Semua">Semua (Ikhwan & Akhwat)</option>
                <option value="Ikhwan">Ikhwan (L)</option>
                <option value="Akhwat">Akhwat (P)</option>
              </select>
            </div>

            {/* Kelas */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Kelas</label>
              <select 
                value={selectedClass} 
                onChange={e => setSelectedClass(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Semua">Semua Kelas</option>
                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Guru Pengampu */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Guru Pengampu</label>
              <select 
                value={selectedTeacher} 
                onChange={e => setSelectedTeacher(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Semua">Semua Guru</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.nickname || t.name}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Cari Nama Siswa</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Ketik nama siswa..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 : RINGKASAN PER KELAS & ACCORDION VIEW */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-700" />
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Ringkasan Setoran Per Kelas</h3>
          </div>
          <span className="text-xs font-bold text-gray-400">
            {hierarchicalData.length} Kelas Terdaftar
          </span>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-[2rem] p-16 border border-gray-100 text-center shadow-sm">
            <Loader2 size={36} className="text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Memuat Data Setoran Class & Halaqah...</p>
          </div>
        ) : hierarchicalData.length > 0 ? (
          <div className="space-y-4">
            {hierarchicalData.map((classGroup) => {
              const isClassExpanded = !!expandedClasses[classGroup.className];
              const isGrade1 = extractClassLevel(classGroup.className) === 1;
              const classStudentsCount = classGroup.halaqahs.reduce((sum, h) => sum + h.students.length, 0);
              const classAlreadyCount = classGroup.halaqahs.reduce((sum, h) => sum + h.alreadyDepositedCount, 0);
              const classPct = classStudentsCount > 0 ? Math.round((classAlreadyCount / classStudentsCount) * 100) : 0;

              // Progress bar color rules: Hijau >= 80%, Kuning 50-79%, Merah < 50%
              let progressBarColor = "bg-rose-500";
              let badgeBgColor = "bg-rose-50 text-rose-700 border-rose-200";
              if (isGrade1) {
                progressBarColor = "bg-sky-500";
                badgeBgColor = "bg-sky-50 text-sky-800 border-sky-200";
              } else if (classPct >= 80) {
                progressBarColor = "bg-emerald-500";
                badgeBgColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
              } else if (classPct >= 50) {
                progressBarColor = "bg-amber-500";
                badgeBgColor = "bg-amber-50 text-amber-800 border-amber-200";
              }

              return (
                <div 
                  key={classGroup.className}
                  className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:border-emerald-100"
                >
                  {/* Class Card Header */}
                  <div
                    onClick={() => toggleClass(classGroup.className)}
                    className="p-5 sm:p-6 cursor-pointer hover:bg-gray-50/60 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                          isGrade1 ? 'bg-sky-100/80 text-sky-800' : 'bg-emerald-100/70 text-emerald-800'
                        }`}>
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-gray-900 tracking-tight">{classGroup.className}</h3>
                            {isGrade1 && (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                                Pra-Sabaq / Iqra
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-bold text-gray-400">
                            {classGroup.halaqahs.length} Halaqah • {classStudentsCount} Siswa
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                        <div className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${badgeBgColor}`}>
                          {isGrade1 ? (
                            <span>Pra-Sabaq • {classAlreadyCount}/{classStudentsCount} siswa setor opsional</span>
                          ) : (
                            <span>{classAlreadyCount} dari {classStudentsCount} siswa sudah setor ({classPct}%)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                        >
                          {isClassExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Visual Percentage Indicator */}
                    <div className="space-y-1">
                      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full transition-all duration-500 ${progressBarColor}`} 
                          style={{ width: `${Math.min(100, classPct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                        <span>{isGrade1 ? 'Aktivitas Setoran Opsional' : 'Progress Setoran Kelas'}</span>
                        <span className="font-extrabold text-gray-700">{classPct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Class Accordion Body (Halaqah List) */}
                  {isClassExpanded && (
                    <div className="p-5 sm:p-6 bg-gray-50/40 border-t border-gray-100 space-y-4">
                      {isGrade1 && (
                        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 text-xs text-sky-950 font-medium flex items-center gap-2.5 shadow-2xs">
                          <span className="px-2.5 py-1 rounded-lg bg-sky-700 text-white font-bold text-[10px] uppercase shrink-0">Tahap Pra-Sabaq</span>
                          <span>Ananda Kelas 1 berfokus pada kelancaran Iqra & Tilawah. Belum ada target wajib Setoran Sabaq Pekanan. Pencatatan Sabaq di bawah bersifat opsional/pengayaan.</span>
                        </div>
                      )}

                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Daftar Halaqah dalam {classGroup.className}:
                      </p>

                      {classGroup.halaqahs.map((halaqah) => {
                        const halaqahKey = `${classGroup.className}-${halaqah.teacherId}`;
                        const isHalaqahExpanded = !!expandedHalaqahs[halaqahKey];
                        const halPct = halaqah.students.length > 0 
                          ? Math.round((halaqah.alreadyDepositedCount / halaqah.students.length) * 100) 
                          : 0;

                        const halTotalSetorans = halaqah.students.reduce((sum, s) => sum + (sabakInSelectedWeekByStudent[s.id] || []).length, 0);
                        const halAvgSetoran = halaqah.students.length > 0 ? (halTotalSetorans / halaqah.students.length) : 0;
                        const halIntensityPct = halaqah.students.length > 0 ? Math.min(100, Math.round((halTotalSetorans / (halaqah.students.length * 5)) * 100)) : 0;

                        let halBarColor = isGrade1 ? "bg-sky-500" : "bg-rose-500";
                        if (!isGrade1) {
                          if (halPct >= 80) halBarColor = "bg-emerald-500";
                          else if (halPct >= 50) halBarColor = "bg-amber-500";
                        }

                        return (
                          <div 
                            key={halaqah.teacherId}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                          >
                            {/* Halaqah Item Summary */}
                            <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-50">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={isGrade1 ? "text-sky-600 font-bold" : "text-emerald-600 font-bold"}>▶</span>
                                  <h4 className="text-sm font-black text-gray-800">
                                    Halaqah {halaqah.teacherName}
                                  </h4>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-gray-600 pl-5">
                                  <span>{isGrade1 ? 'Partisipasi (Opsional):' : 'Partisipasi:'} {halaqah.alreadyDepositedCount}/{halaqah.students.length} siswa ({halPct}%)</span>
                                  <span className="text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded border border-emerald-100 font-extrabold text-[11px]">
                                    ⚡ Intensitas: {halAvgSetoran.toFixed(1)}x / 5 hari KBM ({halIntensityPct}%)
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between w-full sm:w-auto">
                                <div className="w-28 bg-gray-100 h-2 rounded-full overflow-hidden hidden md:block">
                                  <div 
                                    className={`h-full ${halBarColor}`} 
                                    style={{ width: `${Math.min(100, halPct)}%` }} 
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleHalaqah(halaqahKey)}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                                    isHalaqahExpanded 
                                      ? 'bg-gray-100 text-gray-700 border-gray-200' 
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {isHalaqahExpanded ? 'Sembunyikan' : 'Lihat Detail Siswa'}
                                  {isHalaqahExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                              </div>
                            </div>

                            {/* Student Table (Halaqah Expanded Details) */}
                            {isHalaqahExpanded && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                                      <th className="px-5 py-3 w-10 text-center">No</th>
                                      <th className="px-5 py-3">Nama Siswa</th>
                                      <th className="px-5 py-3">Sedang Menghafal</th>
                                      <th className="px-5 py-3 text-center">Setoran Terakhir</th>
                                      <th className="px-5 py-3 text-center">Tanggal Terakhir</th>
                                      <th className="px-5 py-3 text-center">Setoran Pekan Ini</th>
                                      <th className="px-5 py-3 text-center">Riwayat</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                                    {(() => {
                                      const page = halaqahPage[halaqahKey] || 1;
                                      const pageSize = 10;
                                      const startIndex = (page - 1) * pageSize;
                                      const paginatedStudents = halaqah.students.slice(startIndex, startIndex + pageSize);
                                      const totalPages = Math.ceil(halaqah.students.length / pageSize);

                                      return (
                                        <>
                                          {paginatedStudents.map((student, idx) => {
                                            const weeklySetorans = sabakInSelectedWeekByStudent[student.id] || [];
                                            const isDepositedThisWeek = weeklySetorans.length > 0;
                                            const latest = latestSabakByStudent[student.id];

                                            return (
                                              <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-5 py-3 text-center font-bold text-gray-400">
                                                  {startIndex + idx + 1}
                                                </td>
                                                <td className="px-5 py-3">
                                                  <div className="flex items-center gap-2">
                                                    {isDepositedThisWeek ? (
                                                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" title="Sudah setor minggu ini" />
                                                    ) : (
                                                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isGrade1 ? 'bg-sky-400' : 'bg-rose-400'}`} title={isGrade1 ? 'Tahap Pra-Sabaq' : 'Belum setor minggu ini'} />
                                                    )}
                                                    <span className="font-bold text-gray-900 uppercase">{student.name}</span>
                                                    
                                                    {!isDepositedThisWeek && (
                                                      isGrade1 ? (
                                                        <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                                                          Pra-Sabaq
                                                        </span>
                                                      ) : (
                                                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100">
                                                          Belum Setor
                                                        </span>
                                                      )
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-5 py-3 font-medium text-gray-600">
                                                  {student.currentProgress || '-'}
                                                </td>
                                                <td className="px-5 py-3 text-center font-bold text-teal-700">
                                                  {latest ? (
                                                    <span className="bg-teal-50 px-2.5 py-1 rounded-lg">
                                                      {latest.surah}: {latest.ayatDari}-{latest.ayatSampai}
                                                    </span>
                                                  ) : (
                                                    <span className="text-gray-300">-</span>
                                                  )}
                                                </td>
                                                <td className="px-5 py-3 text-center text-gray-500">
                                                  {latest ? (
                                                    new Date(latest.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                                  ) : (
                                                    '-'
                                                  )}
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                  <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                                    isDepositedThisWeek 
                                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                  }`}>
                                                    {weeklySetorans.length} Setoran
                                                  </span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleOpenHistory(student)}
                                                    className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-700 hover:text-emerald-900 transition-colors inline-flex items-center gap-1 font-bold text-[10px] uppercase"
                                                    title="Lihat Riwayat"
                                                  >
                                                    <History size={14} />
                                                    <span>Riwayat</span>
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}

                                          {/* Pagination */}
                                          {totalPages > 1 && (
                                            <tr>
                                              <td colSpan={7} className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                                                <div className="flex justify-between items-center text-xs text-gray-500">
                                                  <span>Menampilkan {paginatedStudents.length} dari {halaqah.students.length} siswa</span>
                                                  <div className="flex gap-2">
                                                    <button
                                                      type="button"
                                                      disabled={page === 1}
                                                      onClick={() => setHalaqahPage(prev => ({ ...prev, [halaqahKey]: page - 1 }))}
                                                      className="px-3 py-1 border border-gray-200 rounded-lg bg-white font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                      Previous
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={page === totalPages}
                                                      onClick={() => setHalaqahPage(prev => ({ ...prev, [halaqahKey]: page + 1 }))}
                                                      className="px-3 py-1 border border-gray-200 rounded-lg bg-white font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                      Next
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-20 border border-gray-100 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Filter size={32} />
            </div>
            <h3 className="text-base font-black text-gray-800 mb-1">DATA TIDAK DITEMUKAN</h3>
            <p className="text-xs text-gray-400 font-medium">Sesuaikan filter atau pencarian Anda untuk menampilkan data setoran sabaq.</p>
          </div>
        )}
      </div>

      {/* HISTORY MODAL */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-emerald-800 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black tracking-tight uppercase">Riwayat Setoran Sabak</h3>
                <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider">{historyStudent.name} • {historyStudent.className}</p>
              </div>
              <button 
                type="button"
                onClick={handleCloseHistory}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 gap-2">
                <div className="text-xs font-bold text-emerald-900">
                  <span className="text-gray-400 font-medium mr-1 uppercase">Sedang Menghafal:</span>
                  <span className="bg-emerald-100 px-2.5 py-1 rounded-lg uppercase">{historyStudent.currentProgress || 'Belum Ada'}</span>
                </div>
                <div className="text-xs font-bold text-teal-900">
                  <span className="text-gray-400 font-medium mr-1 uppercase">Total Setoran Sabak:</span>
                  <span className="bg-teal-100 px-2.5 py-1 rounded-lg uppercase text-teal-800">{historyRecords.length} Catatan</span>
                </div>
              </div>

              {historyRecords.length > 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        <th className="px-5 py-3 w-10 text-center">No</th>
                        <th className="px-5 py-3">Tanggal</th>
                        <th className="px-5 py-3">Surah</th>
                        <th className="px-5 py-3 text-center">Ayat</th>
                        <th className="px-5 py-3 text-center">Status</th>
                        <th className="px-5 py-3">Catatan</th>
                        <th className="px-5 py-3">Guru Penginput</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {historyRecords.map((rec, idx) => (
                        <tr key={rec.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-5 py-3.5 text-center font-bold text-gray-400">{idx + 1}</td>
                          <td className="px-5 py-3.5 font-bold text-gray-700">
                            {new Date(rec.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5 font-black text-emerald-700 uppercase">{rec.surah}</td>
                          <td className="px-5 py-3.5 text-center font-bold">
                            <span className="bg-gray-100 px-2.5 py-1 rounded-lg text-gray-700">
                              {rec.ayatDari} - {rec.ayatSampai}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                              rec.status === 'Tuntas' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 italic max-w-[200px] truncate" title={rec.catatan}>
                            {rec.catatan || '-'}
                          </td>
                          <td className="px-5 py-3.5 text-gray-600 font-medium uppercase">
                            {rec.guruNama || 'Guru'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-400 italic font-bold uppercase tracking-wider">
                  Belum ada riwayat setoran sabak untuk siswa ini
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={handleCloseHistory}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
