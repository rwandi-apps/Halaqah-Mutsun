import React, { useEffect, useState, useMemo } from 'react';
import { Student, SetoranSabak, User } from '../../../types';
import { getStudentGender } from '../../../services/sdqTargets';
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
  Check, 
  Clock,
  Filter
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
  // Academic year runs from July 1st of startYear to June 30th of endYear
  let current = new Date(startYear, 6, 1); // July 1st
  const endLimit = new Date(endYear, 5, 30, 23, 59, 59); // June 30th
  
  // Align current to the Monday of that week
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
  const d = new Date(year, month, day, 12, 0, 0); // avoid timezone shifts
  const t = d.getTime();
  return t >= startDate.getTime() && t <= endDate.getTime();
};

const getDefaultWeek = (weeks: WeekOption[]): WeekOption | null => {
  if (weeks.length === 0) return null;
  const today = new Date();
  const t = today.getTime();
  const found = weeks.find(w => t >= w.startDate.getTime() && t <= w.endDate.getTime());
  if (found) return found;
  
  // If today is after the entire academic year, return the last week
  if (t > weeks[weeks.length - 1].endDate.getTime()) {
    return weeks[weeks.length - 1];
  }
  return weeks[0];
};

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
      const matchesYear = student.className !== "Lulus / Alumni"; // we already subscribe to active students, but verify
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

  // Map of Student ID -> latest setoran_sabak record (entire history)
  const latestSabakByStudent = useMemo(() => {
    const map: Record<string, SetoranSabak> = {};
    // Sabak records are already sorted descending by date
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

    // Convert to sorted arrays
    return Object.values(groups)
      .map(g => ({
        className: g.className,
        halaqahs: Object.values(g.halaqahs).sort((a, b) => a.teacherName.localeCompare(b.teacherName))
      }))
      .sort((a, b) => a.className.localeCompare(b.className));
  }, [filteredStudents, teacherMap, sabakInSelectedWeekByStudent]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalStudents = filteredStudents.length;
    let totalSetoransThisWeek = 0;
    let studentsDepositedCount = 0;

    filteredStudents.forEach(s => {
      const weekly = sabakInSelectedWeekByStudent[s.id] || [];
      totalSetoransThisWeek += weekly.length;
      if (weekly.length > 0) {
        studentsDepositedCount++;
      }
    });

    return {
      totalStudents,
      totalSetoransThisWeek,
      studentsDepositedCount,
      studentsNotYetDepositedCount: totalStudents - studentsDepositedCount
    };
  }, [filteredStudents, sabakInSelectedWeekByStudent]);

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
    // Reset page on toggle
    setHalaqahPage(prev => ({
      ...prev,
      [halaqahKey]: 1
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. FILTER PANEL */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Tahun Ajaran */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tahun Ajaran</label>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)} 
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500"
          >
            {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Pekan Dropdown */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pekan Berjalan</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
            <select 
              value={selectedWeek ? selectedWeek.id : ''} 
              onChange={e => {
                const found = weekOptions.find(w => w.id === e.target.value);
                if (found) setSelectedWeek(found);
              }} 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              {weekOptions.length === 0 && <option value="">Membuat pekan...</option>}
              {weekOptions.map(w => (
                <option key={w.id} value={w.id}>{w.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Jenis Kelamin */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jenis Kelamin</label>
          <select 
            value={selectedGender} 
            onChange={e => setSelectedGender(e.target.value)} 
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Semua">Semua</option>
            <option value="Ikhwan">Ikhwan (L)</option>
            <option value="Akhwat">Akhwat (P)</option>
          </select>
        </div>

        {/* Kelas */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kelas</label>
          <select 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)} 
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Semua">Semua Kelas</option>
            {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Guru Pengampu */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Guru Pengampu</label>
          <select 
            value={selectedTeacher} 
            onChange={e => setSelectedTeacher(e.target.value)} 
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Semua">Semua Guru</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.nickname || t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SEARCH AND TEXT */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari nama siswa..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none" 
          />
        </div>
        {selectedWeek && (
          <div className="flex items-center gap-1.5 text-[10px] font-black text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full uppercase tracking-wider self-stretch sm:self-auto justify-center">
            <Clock size={12} />
            <span>Pekan: {selectedWeek.startDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} - {selectedWeek.endDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* 2. METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Total Siswa</p>
            <p className="text-xl font-black text-gray-800 leading-none">{metrics.totalStudents} <span className="text-xs text-gray-400 font-bold">Ananda</span></p>
          </div>
        </div>

        {/* Total Setoran */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Setoran Pekan Ini</p>
            <p className="text-xl font-black text-gray-800 leading-none">{metrics.totalSetoransThisWeek} <span className="text-xs text-gray-400 font-bold">Kali</span></p>
          </div>
        </div>

        {/* Sudah Setor */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Sudah Setor</p>
            <p className="text-xl font-black text-emerald-600 leading-none">
              {metrics.studentsDepositedCount} 
              <span className="text-xs text-gray-400 font-bold ml-1">
                ({metrics.totalStudents > 0 ? Math.round((metrics.studentsDepositedCount / metrics.totalStudents) * 100) : 0}%)
              </span>
            </p>
          </div>
        </div>

        {/* Belum Setor */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
            <AlertCircle size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Belum Setor</p>
            <p className="text-xl font-black text-rose-500 leading-none">
              {metrics.studentsNotYetDepositedCount} 
              <span className="text-xs text-gray-400 font-bold ml-1">
                ({metrics.totalStudents > 0 ? Math.round((metrics.studentsNotYetDepositedCount / metrics.totalStudents) * 100) : 0}%)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. ACCORDION VIEW */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-20 border border-gray-100 text-center shadow-sm">
          <Loader2 size={36} className="text-primary-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Memuat Data Monitoring...</p>
        </div>
      ) : hierarchicalData.length > 0 ? (
        <div className="space-y-4">
          {hierarchicalData.map((classGroup) => {
            const isClassExpanded = !!expandedClasses[classGroup.className];
            const classStudentsCount = classGroup.halaqahs.reduce((sum, h) => sum + h.students.length, 0);
            const classAlreadyCount = classGroup.halaqahs.reduce((sum, h) => sum + h.alreadyDepositedCount, 0);

            return (
              <div 
                key={classGroup.className}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* Class Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleClass(classGroup.className)}
                  className="w-full px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50/50 transition-colors text-left border-b border-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary-50 text-primary-600">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-800 tracking-tight">{classGroup.className}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{classGroup.halaqahs.length} Halaqah • {classStudentsCount} Siswa</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                    <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
                      ✅ {classAlreadyCount} / {classStudentsCount} Sudah Setor
                    </span>
                    {isClassExpanded ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Class Accordion Body (Halaqah List) */}
                {isClassExpanded && (
                  <div className="p-6 bg-gray-50/30 space-y-4">
                    {classGroup.halaqahs.map((halaqah) => {
                      const halaqahKey = `${classGroup.className}-${halaqah.teacherId}`;
                      const isHalaqahExpanded = !!expandedHalaqahs[halaqahKey];
                      const allDone = halaqah.notYetDepositedCount === 0 && halaqah.students.length > 0;

                      return (
                        <div 
                          key={halaqah.teacherId}
                          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                        >
                          {/* Halaqah Item Header */}
                          <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50">
                            <div className="space-y-1.5">
                              <h4 className="text-sm font-black text-gray-800 tracking-tight">Halaqah {halaqah.teacherName}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <span>{halaqah.students.length} Siswa</span>
                                <span>•</span>
                                <span className="text-emerald-600">✅ {halaqah.alreadyDepositedCount} Sudah Setor</span>
                                <span>•</span>
                                <span className="text-rose-500">❌ {halaqah.notYetDepositedCount} Belum</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-between">
                              {/* Automatic Badge */}
                              {allDone ? (
                                <span className="text-[9px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                                  Semua Siswa Sudah Setor
                                </span>
                              ) : halaqah.alreadyDepositedCount === 0 ? (
                                <span className="text-[9px] font-black tracking-wider uppercase bg-rose-50 text-rose-600 px-2.5 py-1.5 rounded-lg border border-rose-100">
                                  Belum Ada Setoran Minggu Ini
                                </span>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => toggleHalaqah(halaqahKey)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 border ${
                                  isHalaqahExpanded 
                                    ? 'bg-gray-100 text-gray-600 border-gray-200' 
                                    : 'bg-primary-50 text-primary-700 border-primary-100 hover:bg-primary-100'
                                }`}
                              >
                                {isHalaqahExpanded ? 'Sembunyikan' : 'Lihat Detail'}
                                {isHalaqahExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
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
                                    <th className="px-5 py-3 text-center">Jumlah Pekan Ini</th>
                                    <th className="px-5 py-3 text-center">Aksi</th>
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
                                                  {/* Color indicator */}
                                                  {isDepositedThisWeek ? (
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Sudah setor minggu ini" />
                                                  ) : (
                                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" title="Belum setor minggu ini" />
                                                  )}
                                                  <span className="font-bold text-gray-900 uppercase">{student.name}</span>
                                                  
                                                  {/* Red Badge "Belum Ada Setoran Minggu Ini" */}
                                                  {!isDepositedThisWeek && (
                                                    <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-rose-50 text-rose-500 border border-rose-100">
                                                      Belum Ada Setoran
                                                    </span>
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
                                                    ? 'bg-emerald-50 text-emerald-700' 
                                                    : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                  {weeklySetorans.length} Setoran
                                                </span>
                                              </td>
                                              <td className="px-5 py-3 text-center">
                                                <button
                                                  type="button"
                                                  onClick={() => handleOpenHistory(student)}
                                                  className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 hover:text-primary-800 transition-colors inline-flex items-center gap-1 font-bold text-[10px] uppercase"
                                                  title="Lihat Riwayat"
                                                >
                                                  <History size={14} />
                                                  <span>Lihat Riwayat</span>
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}

                                        {/* Pagination for students inside halaqah */}
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
        <div className="bg-white rounded-3xl p-24 border border-gray-100 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-300">
            <Filter size={32} />
          </div>
          <h3 className="text-base font-black text-gray-800 mb-1">DATA TIDAK DITEMUKAN</h3>
          <p className="text-xs text-gray-400 font-medium">Sesuaikan pilihan filter atau pencarian Anda untuk melihat data setoran sabak.</p>
        </div>
      )}

      {/* 4. HISTORY MODAL */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-primary-700 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black tracking-tight uppercase">Riwayat Setoran Sabak</h3>
                <p className="text-xs text-primary-200 font-bold uppercase tracking-wider">{historyStudent.name} • {historyStudent.className}</p>
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary-50/50 rounded-2xl border border-primary-50 gap-2">
                <div className="text-xs font-bold text-primary-900">
                  <span className="text-gray-400 font-medium mr-1 uppercase">Sedang Menghafal:</span>
                  <span className="bg-primary-100 px-2.5 py-1 rounded-lg uppercase">{historyStudent.currentProgress || 'Belum Ada'}</span>
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
                          <td className="px-5 py-3.5 font-black text-primary-700 uppercase">{rec.surah}</td>
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
