import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Student, Report, SetoranSabak } from '../../../types';
import { 
  getStudentsByTeacher, 
  getReportsByTeacher, 
  subscribeToAllSetoranSabak 
} from '../../../services/firestoreService';
import { QURAN_MAPPING } from '../../../services/quranMapping';
import { QURAN_FULL_MAP } from '../../../services/tahfizh/quranFullData';
import { extractClassLevel } from '../../../services/sdqTargets';
import { Button } from '../../../components/Button';
import { 
  Search, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Target, 
  UserCheck, 
  ListFilter,
  Users
} from 'lucide-react';
import { getStoredUser } from '../../../services/simpleAuth';
import { SetoranSabakModal } from '../../../components/SetoranSabakModal';
import { SabaqInputCard } from '../../../components/SabaqInputCard';

interface GuruHalaqahPageProps {
  teacherId?: string;
}

interface StudentWithStats extends Student {
  latestReport?: Report;
  totalHafalanDisplay?: string;
  sabaqDisplay?: string;
  tilawahDisplay?: string;
  currentJuzDisplay?: string;
}

// Helper to generate weeks for a given date's month
interface WeekOption {
  id: string;
  label: string;
  shortLabel: string;
  startDate: Date;
  endDate: Date;
  defaultDate: string;
}

const getMonthWeeksOptions = (baseDateStr: string): WeekOption[] => {
  const baseDate = new Date(baseDateStr || new Date());
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // 0-indexed
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthName = monthNames[month];

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const weeks: WeekOption[] = [];
  let currentStart = new Date(firstDay);
  let weekNum = 1;

  while (currentStart <= lastDay) {
    let currentEnd = new Date(currentStart);
    const dayOfWeek = currentEnd.getDay(); // 0 = Sun, 1 = Mon ...
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    currentEnd.setDate(currentEnd.getDate() + daysUntilSunday);
    
    if (currentEnd > lastDay) {
      currentEnd = new Date(lastDay);
    }

    const startFormatted = `${currentStart.getDate()} ${monthName}`;
    const endFormatted = `${currentEnd.getDate()} ${monthName} ${year}`;
    
    // Pick default date for this week (e.g. Friday if available, else start/end date)
    const defaultDateInWeek = new Date(currentStart);
    const startDay = currentStart.getDay();
    if (startDay <= 5) {
      defaultDateInWeek.setDate(currentStart.getDate() + (5 - startDay));
    }
    if (defaultDateInWeek > currentEnd) {
      defaultDateInWeek.setTime(currentEnd.getTime());
    }

    const isoDateStr = `${defaultDateInWeek.getFullYear()}-${String(defaultDateInWeek.getMonth() + 1).padStart(2, '0')}-${String(defaultDateInWeek.getDate()).padStart(2, '0')}`;

    weeks.push({
      id: `${year}-${month + 1}-W${weekNum}`,
      label: `Pekan ${weekNum} (${startFormatted} - ${endFormatted})`,
      shortLabel: `Pekan ${weekNum}`,
      startDate: new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate(), 0, 0, 0),
      endDate: new Date(currentEnd.getFullYear(), currentEnd.getMonth(), currentEnd.getDate(), 23, 59, 59),
      defaultDate: isoDateStr
    });

    const nextStart = new Date(currentEnd);
    nextStart.setDate(nextStart.getDate() + 1);
    currentStart = nextStart;
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

export default function GuruHalaqahPage({ teacherId = '1' }: GuruHalaqahPageProps) {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithStats[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Tab State: 'list' = Default Daftar Siswa & Progress, 'input' = Input Setoran Sabaq Pekanan
  const [activeTab, setActiveTab] = useState<'list' | 'input'>('list');

  // Input Setoran Pekanan controls
  const [tanggal, setTanggal] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [allSetoranHistory, setAllSetoranHistory] = useState<SetoranSabak[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Refs for smooth scrolling between cards
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  // Subscribe to all Setoran Sabak history in real-time
  useEffect(() => {
    const unsubscribe = subscribeToAllSetoranSabak((data) => {
      setAllSetoranHistory(data);
    });
    return () => unsubscribe();
  }, []);

  // Helper: Ambil bagian "Sampai" dari range string "Dari - Sampai"
  const getEndPart = (str: string | undefined) => {
    if (!str || str === '-' || str.trim() === '') return '-';
    const parts = str.split(' - ');
    return parts.length > 1 ? parts[1].trim() : parts[0].trim();
  };

  // Helper: Format Sabaq Terakhir menjadi "Surah: Ayat" (misal "Al-Baqarah: 204")
  const formatSabaqTerakhir = (str: string | undefined): string => {
    if (!str || str === '-' || str === 'Belum Ada' || str.trim() === '') return '-';

    let trimmed = str.trim();
    if (trimmed.toLowerCase().startsWith('iqra')) return trimmed;

    const rangeRegex = /^(.+?)\s*(?:[:\-–]\s*)?(\d+)\s*(?:[\-–]|s\/d|s\.d\.|sampai)\s*(?:(.+?)\s*[:\-–]\s*)?(\d+)$/i;
    const matchRange = trimmed.match(rangeRegex);
    if (matchRange) {
      let surah = (matchRange[3] && matchRange[3].trim()) ? matchRange[3].trim() : matchRange[1].trim();
      surah = surah.replace(/[:\-–]$/, '').trim();
      const lastAyat = matchRange[4].trim();
      if (surah && lastAyat) {
        return `${surah}: ${lastAyat}`;
      }
    }

    if (trimmed.includes(' - ')) {
      const parts = trimmed.split(' - ').map(p => p.trim());
      const lastPart = parts[parts.length - 1];
      const singleMatch = lastPart.match(/^(.+?)\s*[:\-–]\s*(\d+)$/i);
      if (singleMatch) {
        return `${singleMatch[1].trim()}: ${singleMatch[2].trim()}`;
      }
      const singleSpaceMatch = lastPart.match(/^(.+?)\s+(\d+)$/i);
      if (singleSpaceMatch && !singleSpaceMatch[1].toLowerCase().startsWith('juz') && !singleSpaceMatch[1].toLowerCase().startsWith('iqra')) {
        return `${singleSpaceMatch[1].trim()}: ${singleSpaceMatch[2].trim()}`;
      }
    }

    const singleColonMatch = trimmed.match(/^(.+?)\s*[:\-–]\s*(\d+)$/i);
    if (singleColonMatch) {
      return `${singleColonMatch[1].trim()}: ${singleColonMatch[2].trim()}`;
    }

    const singleSpaceMatch = trimmed.match(/^(.+?)\s+(\d+)$/i);
    if (singleSpaceMatch && !singleSpaceMatch[1].toLowerCase().startsWith('juz') && !singleSpaceMatch[1].toLowerCase().startsWith('iqra')) {
      return `${singleSpaceMatch[1].trim()}: ${singleSpaceMatch[2].trim()}`;
    }

    return trimmed;
  };

  // Helper: Tentukan Juz berdasarkan string (misal: "Al-Jinn: 3" -> "Juz 29")
  const getJuzFromString = (str: string) => {
    if (!str || str === '-' || str === 'Belum Ada' || str.trim() === '') return '-';
    const clean = str.trim();

    // Jika sudah format Juz X (misal "Juz 29" atau "Juz 29: 15")
    const juzMatch = clean.match(/^Juz\s*(\d+)/i);
    if (juzMatch) {
      return `Juz ${juzMatch[1]}`;
    }

    // Jika Iqra
    if (clean.toLowerCase().startsWith('iqra')) {
      return clean;
    }

    // Ambil nama surat dan ayat (misal "Al-Jinn: 3", "Al-Jinn", "Al-Jinn 3")
    let surahName = clean;
    let ayahNum = 1;

    const colonMatch = clean.match(/^(.+?)\s*[:\-–]\s*(\d+)/i);
    if (colonMatch) {
      surahName = colonMatch[1].trim();
      ayahNum = parseInt(colonMatch[2].trim(), 10) || 1;
    } else {
      const spaceMatch = clean.match(/^(.+?)\s+(\d+)$/i);
      if (spaceMatch && !spaceMatch[1].toLowerCase().startsWith('juz')) {
        surahName = spaceMatch[1].trim();
        ayahNum = parseInt(spaceMatch[2].trim(), 10) || 1;
      }
    }

    const cleanSurah = surahName.toLowerCase().replace(/['`’‘]/g, "'").trim();
    const entry = QURAN_MAPPING.find(q => q.surah.toLowerCase().replace(/['`’‘]/g, "'").trim() === cleanSurah);
    if (!entry) return clean;

    let page = entry.page;
    const key = `${entry.surah}:${ayahNum}`;
    if (QURAN_FULL_MAP && QURAN_FULL_MAP[key]) {
      if (QURAN_FULL_MAP[key].juz) {
        return `Juz ${QURAN_FULL_MAP[key].juz}`;
      }
      page = QURAN_FULL_MAP[key].page;
    }

    if (page <= 21) return "Juz 1";
    if (page >= 582) return "Juz 30";
    const juzNum = 2 + Math.floor((page - 22) / 20);
    return `Juz ${Math.min(30, Math.max(1, juzNum))}`;
  };

  // Helper safely format createdAt value to string for sorting
  const getCreatedAtString = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val.toDate === 'function') {
      try { return val.toDate().toISOString(); } catch { return ''; }
    }
    if (val.seconds) return new Date(val.seconds * 1000).toISOString();
    return String(val);
  };

  // Helper: Ambil sabaq terbaru dari allSetoranHistory, jika tidak ada baru gunakan fallback dari report
  const getLatestSabaqForStudent = (studentId: string, fallbackTahfizhIndiv?: string): string => {
    if (!studentId) return '-';
    const studentSetorans = allSetoranHistory.filter(s => s && s.siswaId === studentId);
    if (studentSetorans.length > 0) {
      studentSetorans.sort((a, b) => {
        const dateA = a.tanggal || '';
        const dateB = b.tanggal || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        const ca = getCreatedAtString(a.createdAt);
        const cb = getCreatedAtString(b.createdAt);
        return cb.localeCompare(ca);
      });
      const latest = studentSetorans[0];
      if (latest && latest.surah && typeof latest.surah === 'string') {
        if (latest.surah.toLowerCase().startsWith('iqra')) {
          return latest.surah;
        }
        if (latest.ayatSampai) {
          return `${latest.surah}: ${latest.ayatSampai}`;
        }
        return latest.surah;
      }
    }

    if (fallbackTahfizhIndiv && typeof fallbackTahfizhIndiv === 'string' && fallbackTahfizhIndiv !== '-' && fallbackTahfizhIndiv !== 'Belum Ada' && fallbackTahfizhIndiv.trim() !== '') {
      return fallbackTahfizhIndiv;
    }

    return '-';
  };

  const loadData = async () => {
    if (!teacherId) return;
    setIsLoading(true);
    try {
      const [studentsData, reportsData] = await Promise.all([
        getStudentsByTeacher(teacherId),
        getReportsByTeacher(teacherId)
      ]);

      const studentsWithStats = studentsData.map(student => {
        const studentReports = reportsData.filter(r => r && r.studentId === student.id);
        studentReports.sort((a, b) => {
          const ca = getCreatedAtString(a.createdAt);
          const cb = getCreatedAtString(b.createdAt);
          return cb.localeCompare(ca);
        });
        const latest = studentReports[0];

        let hafalanDisplay = "0 Juz";
        if (latest && latest.totalHafalan) {
           const j = Number(latest.totalHafalan.juz || 0);
           const p = Number(latest.totalHafalan.pages || 0);
           const parts = [];
           if (j > 0) parts.push(`${j} Juz`);
           if (p > 0) parts.push(`${p} Halaman`);
           hafalanDisplay = parts.length > 0 ? parts.join(' ') : "0 Juz";
        } else if (student.totalHafalan) {
           const j = Number(student.totalHafalan.juz || 0);
           const p = Number(student.totalHafalan.pages || 0);
           const parts = [];
           if (j > 0) parts.push(`${j} Juz`);
           if (p > 0) parts.push(`${p} Halaman`);
           hafalanDisplay = parts.length > 0 ? parts.join(' ') : "0 Juz";
        }

        const tahfizhIndiv = latest?.tahfizh?.individual;
        const tilawahIndiv = latest?.tilawah?.individual;

        const rawSabaq = getLatestSabaqForStudent(student.id, tahfizhIndiv);
        let sabaqDisplay = formatSabaqTerakhir(rawSabaq);
        const tilawahDisplay = getEndPart(tilawahIndiv);

        const currentJuzDisplay = (sabaqDisplay !== '-') 
          ? getJuzFromString(sabaqDisplay)
          : '-';

        return {
          ...student,
          latestReport: latest,
          totalHafalanDisplay: hafalanDisplay,
          sabaqDisplay,
          tilawahDisplay,
          currentJuzDisplay
        };
      });

      setStudents(studentsWithStats);
      setFilteredStudents(studentsWithStats);
    } catch (error) {
      console.error("Error loading halaqah data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacherId]);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = students.filter(s => 
      s.name.toLowerCase().includes(lowerSearch) || 
      (s.nis && s.nis.includes(lowerSearch)) ||
      (s.nisn && s.nisn.includes(lowerSearch)) ||
      (s.className && s.className.toLowerCase().includes(lowerSearch))
    );
    setFilteredStudents(filtered);
  }, [search, students]);

  // Pekan options calculated from current selected date
  const monthWeeks = React.useMemo(() => getMonthWeeksOptions(tanggal), [tanggal.slice(0, 7)]);
  const currentWeek = monthWeeks.find(w => isDateInWeek(tanggal, w.startDate, w.endDate)) || monthWeeks[monthWeeks.length - 1] || monthWeeks[0];

  // Derive updated students array where sabaqDisplay & currentJuzDisplay react to allSetoranHistory
  const displayStudents = useMemo(() => {
    return filteredStudents.map(student => {
      const rawSabaq = getLatestSabaqForStudent(student.id, student.latestReport?.tahfizh?.individual);
      const sabaqDisplay = formatSabaqTerakhir(rawSabaq);
      const currentJuzDisplay = (sabaqDisplay !== '-') ? getJuzFromString(sabaqDisplay) : '-';

      return {
        ...student,
        sabaqDisplay,
        currentJuzDisplay
      };
    });
  }, [filteredStudents, allSetoranHistory]);

  // Handle "Simpan & Berikutnya" transition
  const handleNextCard = (currentIndex: number) => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < displayStudents.length) {
      setActiveCardIndex(nextIdx);
      const nextCardElem = document.getElementById(`student-sabaq-card-${nextIdx}`);
      if (nextCardElem) {
        nextCardElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Helper to find existing setoran for student on current week/date
  const getExistingSetoranThisWeek = (studentId: string): SetoranSabak | null => {
    if (currentWeek) {
      const match = allSetoranHistory.find(s => 
        s.siswaId === studentId && 
        isDateInWeek(s.tanggal, currentWeek.startDate, currentWeek.endDate)
      );
      if (match) return match;
    }
    return allSetoranHistory.find(s => s.siswaId === studentId && s.tanggal === tanggal) || null;
  };

  // Helper to find latest setoran from previous week
  const getLatestSetoranFromPrevWeek = (studentId: string): SetoranSabak | null => {
    if (!studentId) return null;
    const prevs = allSetoranHistory.filter(s => {
      if (!s || s.siswaId !== studentId) return false;
      if (currentWeek) {
        return !isDateInWeek(s.tanggal, currentWeek.startDate, currentWeek.endDate);
      }
      return s.tanggal !== tanggal;
    });
    if (prevs.length > 0) {
      prevs.sort((a, b) => {
        const dateA = a.tanggal || '';
        const dateB = b.tanggal || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        const ca = getCreatedAtString(a.createdAt);
        const cb = getCreatedAtString(b.createdAt);
        return cb.localeCompare(ca);
      });
      return prevs[0];
    }
    return null;
  };

  // Summary statistics for selected date
  const totalStudentsCount = displayStudents.length;
  const inputtedCount = displayStudents.filter(s => !!getExistingSetoranThisWeek(s.id)).length;
  const targetAchievedCount = displayStudents.filter(s => {
    const rec = getExistingSetoranThisWeek(s.id);
    return rec && (rec.status === 'Tuntas' || (rec.jumlahBaris !== undefined && rec.jumlahBaris >= (rec.targetBaris || 10)));
  }).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-200">
      
      {/* HEADER SECTION */}
      {activeTab === 'list' ? (
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
                <Users size={20} />
              </span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Halaqah Saya</h2>
            </div>
            <p className="text-gray-500 text-xs md:text-sm mt-1 font-medium">
              Pantau progress hafalan dan sabaq siswa halaqah secara real-time.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('input')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow self-start sm:self-auto"
          >
            <BookOpen size={16} />
            Input Setoran Sabaq
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div>
            <button
              onClick={() => setActiveTab('list')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 mb-2 transition-colors"
            >
              ← Kembali ke Progress Halaqah
            </button>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
                <BookOpen size={20} />
              </span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Input Setoran Sabaq Pekanan</h2>
            </div>
            <p className="text-gray-500 text-xs md:text-sm mt-1 font-medium">
              Catat setoran sabaq mingguan seluruh siswa halaqah dengan cepat dan akurat.
            </p>
          </div>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('list')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 transition-all"
            >
              Daftar Progress
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs transition-all"
            >
              Form Setoran
            </button>
          </div>
        </div>
      )}

      {/* FILTER & STATS BAR (FOR INPUT PEKANAN TAB) */}
      {activeTab === 'input' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Pekan Setoran Picker */}
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-emerald-600 shrink-0" />
              <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Pekan Setoran:</label>
              <select
                value={currentWeek?.id || ''}
                onChange={(e) => {
                  const selectedW = monthWeeks.find(w => w.id === e.target.value);
                  if (selectedW) {
                    setTanggal(selectedW.defaultDate);
                  }
                }}
                className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                {monthWeeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari nama siswa dalam halaqah..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

          </div>

          {/* SUMMARY STATS STRIP */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Siswa</p>
              <p className="text-lg font-black text-gray-900">{totalStudentsCount}</p>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Sudah Diinput</p>
              <p className="text-lg font-black text-emerald-800">{inputtedCount} / {totalStudentsCount}</p>
            </div>
            <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-100 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Target Tercapai</p>
              <p className="text-lg font-black text-teal-800">{targetAchievedCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH BAR (FOR LIST TAB) */}
      {activeTab === 'list' && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <Search className="text-gray-400 ml-1" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama siswa, NIS, atau NISN..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none text-sm font-medium focus:outline-none"
          />
        </div>
      )}

      {/* CONTENT BODY */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-gray-500 font-bold text-sm">Memuat data halaqah...</p>
        </div>
      ) : displayStudents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-gray-500 font-bold text-sm">Tidak ada siswa ditemukan.</p>
        </div>
      ) : activeTab === 'input' ? (
        
        /* TAB 1: INPUT SETORAN SABAQ PEKANAN (CARD CAROUSEL / QUEUE) */
        <div className="space-y-6">
          {displayStudents.map((student, idx) => {
            const existing = getExistingSetoranThisWeek(student.id);
            const prevSetoran = getLatestSetoranFromPrevWeek(student.id);

            return (
              <SabaqInputCard
                key={student.id}
                ref={(el) => (cardRefs.current[idx] = el)}
                student={student}
                index={idx}
                totalStudents={displayStudents.length}
                currentUser={currentUser}
                tanggal={tanggal}
                latestSetoranFromPrevWeek={prevSetoran}
                existingSetoranThisWeek={existing}
                onSavedSuccess={loadData}
                onNextCard={handleNextCard}
                isActive={activeCardIndex === idx}
              />
            );
          })}
        </div>

      ) : (

        /* TAB 2: DAFTAR & DETAIL SISWA (OVERVIEW GRID) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayStudents.map((student, idx) => (
            <div key={student.id} className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 hover:shadow-md transition-all border-t-4 border-t-emerald-600">
              <div className="flex justify-between items-start mb-5">
                <div className="flex gap-3 w-full overflow-hidden">
                   <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg shrink-0 border border-emerald-200">
                      {student.name.charAt(0)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate" title={student.name}>{student.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
                        {student.nis && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500 font-bold">
                            NIS {student.nis}
                          </span>
                        )}
                        {student.className && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-bold">
                            {student.className}
                          </span>
                        )}
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                   <span className="text-gray-500 font-medium">Jumlah Hafalan</span>
                   <span className="font-bold text-emerald-800">{student.totalHafalanDisplay}</span>
                </div>
                
                <div className="flex justify-between items-center">
                   <span className="text-gray-500 font-medium">Sedang Menghafal</span>
                   <span className="text-gray-800 font-bold truncate max-w-[130px] text-right">
                     {student.currentJuzDisplay}
                   </span>
                </div>

                <div className="h-px bg-gray-100"></div>

                <div className="flex justify-between items-center">
                   <span className="text-gray-500 font-medium">Sabaq Terakhir</span>
                   <span className="text-gray-900 font-bold text-right truncate max-w-[160px]" title={student.sabaqDisplay}>
                     {student.sabaqDisplay}
                   </span>
                </div>

                <div className="flex justify-between items-center">
                   <span className="text-gray-500 font-medium">Tilawah Terakhir</span>
                   <span className="text-gray-900 font-bold text-right truncate max-w-[160px]" title={student.tilawahDisplay}>
                     {student.tilawahDisplay || '-'}
                   </span>
                </div>

                <div className="pt-2">
                   <Button 
                     variant="outline" 
                     className="w-full text-xs font-bold border-emerald-600 text-emerald-700 hover:bg-emerald-50 py-2 h-auto flex items-center justify-center gap-1.5 rounded-xl"
                     onClick={() => {
                       setSelectedStudent(student);
                       setIsModalOpen(true);
                     }}
                   >
                     <BookOpen size={14} />
                     Detail & Riwayat Setoran
                   </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

      )}

      {/* SETORAN SABAK MODAL FOR INDIVIDUAL DETAIL VIEW */}
      {selectedStudent && (
        <SetoranSabakModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          currentUser={currentUser}
          onSaveSuccess={loadData}
        />
      )}

    </div>
  );
}
