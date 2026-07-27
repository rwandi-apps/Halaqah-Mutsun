import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Student, Report, SetoranSabak } from '../../../types';
import { 
  getStudentsByTeacher, 
  getReportsByTeacher, 
  subscribeToAllSetoranSabak 
} from '../../../services/firestoreService';
import { QURAN_MAPPING } from '../../../services/quranMapping';
import { extractClassLevel } from '../../../services/sdqTargets';
import { Button } from '../../../components/Button';
import { 
  Search, 
  BookOpen, 
  Calendar, 
  Sparkles, 
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

export default function GuruHalaqahPage({ teacherId = '1' }: GuruHalaqahPageProps) {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithStats[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Tab State: 'input' = Input Setoran Sabaq Pekanan, 'list' = Daftar Siswa & Detail
  const [activeTab, setActiveTab] = useState<'input' | 'list'>('input');

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

  // Helper: Tentukan Juz berdasarkan string
  const getJuzFromString = (str: string) => {
    if (!str || str === '-' || str === '') return '-';
    const match = str.match(/^(.*?)[:\d]/);
    const surahName = match ? match[1].trim() : str.trim();
    const cleanName = surahName.toLowerCase().replace(/['`’]/g, "'");
    const entry = QURAN_MAPPING.find(q => q.surah.toLowerCase().replace(/['`’]/g, "'") === cleanName);
    if (!entry) return str;
    const p = entry.page;
    if (p >= 582) return "Juz 30";
    if (p >= 562) return "Juz 29";
    if (p >= 542) return "Juz 28";
    if (p >= 522) return "Juz 27";
    if (p >= 502) return "Juz 26";
    return `Juz ${Math.ceil(p / 20)}`;
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
        const studentReports = reportsData.filter(r => r.studentId === student.id);
        studentReports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

        const classLvl = extractClassLevel(student.className);
        const tahfizhIndiv = latest?.tahfizh?.individual;
        const tilawahIndiv = latest?.tilawah?.individual;

        let rawSabaq = '-';

        if (classLvl === 1) {
          rawSabaq = (student.currentProgress && student.currentProgress !== 'Belum Ada' && student.currentProgress !== '-')
            ? student.currentProgress
            : (tahfizhIndiv || tilawahIndiv || '-');
        } else if (classLvl === 2) {
          if (tahfizhIndiv && tahfizhIndiv !== '-' && tahfizhIndiv !== 'Belum Ada' && tahfizhIndiv.trim() !== '') {
            rawSabaq = tahfizhIndiv;
          } else if (
            student.currentProgress && 
            student.currentProgress !== 'Belum Ada' && 
            student.currentProgress !== '-' &&
            student.currentProgress !== tilawahIndiv &&
            !student.currentProgress.toLowerCase().startsWith('iqra') &&
            !student.currentProgress.toLowerCase().startsWith('juz') &&
            !student.currentProgress.toLowerCase().startsWith('tilawah') &&
            student.currentProgress.includes(':')
          ) {
            rawSabaq = student.currentProgress;
          } else {
            rawSabaq = '-';
          }
        } else {
          if (tahfizhIndiv && tahfizhIndiv !== '-' && tahfizhIndiv !== 'Belum Ada' && tahfizhIndiv.trim() !== '') {
            rawSabaq = tahfizhIndiv;
          } else if (
            student.currentProgress && 
            student.currentProgress !== 'Belum Ada' && 
            student.currentProgress !== '-' &&
            student.currentProgress !== tilawahIndiv
          ) {
            rawSabaq = student.currentProgress;
          } else {
            rawSabaq = '-';
          }
        }

        let sabaqDisplay = formatSabaqTerakhir(rawSabaq);
        const tilawahDisplay = getEndPart(tilawahIndiv);

        const currentJuzDisplay = (sabaqDisplay !== '-') 
          ? getJuzFromString(sabaqDisplay)
          : ((student.currentProgress && student.currentProgress !== tilawahIndiv && student.currentProgress !== 'Belum Ada') ? student.currentProgress : "-");

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

  // Handle "Simpan & Berikutnya" transition
  const handleNextCard = (currentIndex: number) => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < filteredStudents.length) {
      setActiveCardIndex(nextIdx);
      const nextCardElem = document.getElementById(`student-sabaq-card-${nextIdx}`);
      if (nextCardElem) {
        nextCardElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Helper to find existing setoran for student on current date
  const getExistingSetoranThisWeek = (studentId: string): SetoranSabak | null => {
    return allSetoranHistory.find(s => s.siswaId === studentId && s.tanggal === tanggal) || null;
  };

  // Helper to find latest setoran from previous week
  const getLatestSetoranFromPrevWeek = (studentId: string): SetoranSabak | null => {
    const prevs = allSetoranHistory.filter(s => s.siswaId === studentId && s.tanggal !== tanggal);
    return prevs.length > 0 ? prevs[0] : null;
  };

  // Summary statistics for selected date
  const totalStudentsCount = filteredStudents.length;
  const inputtedCount = filteredStudents.filter(s => !!getExistingSetoranThisWeek(s.id)).length;
  const targetAchievedCount = filteredStudents.filter(s => {
    const rec = getExistingSetoranThisWeek(s.id);
    return rec && (rec.status === 'Tuntas' || (rec.jumlahBaris !== undefined && rec.jumlahBaris >= (rec.targetBaris || 10)));
  }).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
              <BookOpen size={20} />
            </span>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Input Setoran Sabaq</h2>
          </div>
          <p className="text-gray-500 text-xs md:text-sm mt-1 font-medium">
            Catat setoran sabaq mingguan seluruh siswa halaqah dengan cepat dan akurat.
          </p>
        </div>

        {/* TAB TOGGLE */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'input' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles size={14} />
            Input Pekanan
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'list' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users size={14} />
            Daftar Siswa
          </button>
        </div>
      </div>

      {/* FILTER & STATS BAR (FOR INPUT PEKANAN TAB) */}
      {activeTab === 'input' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Tanggal Setoran Picker */}
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-emerald-600 shrink-0" />
              <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Tanggal Setoran:</label>
              <input 
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
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
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-gray-500 font-bold text-sm">Tidak ada siswa ditemukan.</p>
        </div>
      ) : activeTab === 'input' ? (
        
        /* TAB 1: INPUT SETORAN SABAQ PEKANAN (CARD CAROUSEL / QUEUE) */
        <div className="space-y-6">
          {filteredStudents.map((student, idx) => {
            const existing = getExistingSetoranThisWeek(student.id);
            const prevSetoran = getLatestSetoranFromPrevWeek(student.id);

            return (
              <SabaqInputCard
                key={student.id}
                ref={(el) => (cardRefs.current[idx] = el)}
                student={student}
                index={idx}
                totalStudents={filteredStudents.length}
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
          {filteredStudents.map((student) => (
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
