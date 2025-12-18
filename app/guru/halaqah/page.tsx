import React, { useEffect, useState } from 'react';
import { Student, Report } from '../../../types';
import { getStudentsByTeacher, getReportsByTeacher } from '../../../services/firestoreService';
import { QURAN_MAPPING } from '../../../services/quranMapping';
import { Button } from '../../../components/Button';
import { Search, MoreVertical, BookOpen } from 'lucide-react';

interface GuruHalaqahPageProps {
  teacherId: string;
}

interface StudentWithStats extends Student {
  latestReport?: Report;
  totalHafalanDisplay?: string;
  sabaqDisplay?: string;
  tilawahDisplay?: string;
  currentJuzDisplay?: string;
}

export default function GuruHalaqahPage({ teacherId }: GuruHalaqahPageProps) {
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithStats[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Helper: Ambil bagian "Sampai" dari range string "Dari - Sampai"
  const getEndPart = (str: string | undefined) => {
    if (!str || str === '-' || str.trim() === '') return '-';
    const parts = str.split(' - ');
    // Jika ada separator " - ", ambil bagian kedua. Jika tidak, ambil string utuh.
    return parts.length > 1 ? parts[1].trim() : parts[0].trim();
  };

  // Helper: Tentukan Juz berdasarkan string (misal: "An-Naba: 30")
  const getJuzFromString = (str: string) => {
    if (!str || str === '-' || str === '') return '-';
    
    // Ambil nama surah (sebelum titik dua atau spasi angka)
    // Contoh: "An-Naba: 30" -> "An-Naba"
    // Contoh: "Al-Baqarah" -> "Al-Baqarah"
    const match = str.match(/^(.*?)[:\d]/);
    const surahName = match ? match[1].trim() : str.trim();

    // Cari di Mapping
    const entry = QURAN_MAPPING.find(q => q.surah.toLowerCase() === surahName.toLowerCase());
    
    if (!entry) return str; // Fallback jika tidak ketemu (misal input manual text)

    const p = entry.page;
    
    // Logika penentuan Juz berdasarkan Halaman (Approximation standar Mushaf Madinah)
    if (p >= 582) return "Juz 30";
    if (p >= 562) return "Juz 29";
    if (p >= 542) return "Juz 28";
    if (p >= 522) return "Juz 27";
    if (p >= 502) return "Juz 26";
    
    // Rumus umum (Page / 20)
    return `Juz ${Math.ceil(p / 20)}`;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!teacherId) return;
      setIsLoading(true);
      const [studentsData, reportsData] = await Promise.all([
        getStudentsByTeacher(teacherId),
        getReportsByTeacher(teacherId)
      ]);

      // Map latest report and calculate stats for each student
      const studentsWithStats = studentsData.map(student => {
        const studentReports = reportsData.filter(r => r.studentId === student.id);
        // Sort by date descending (using string ISO compare is safe for ISO dates)
        studentReports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const latest = studentReports[0];

        // 1. Total Hafalan
        let hafalanDisplay = "0 Juz";
        if (latest && latest.totalHafalan) {
           const { juz } = latest.totalHafalan;
           hafalanDisplay = `${juz} Juz`;
        }

        // 2. Sabaq Terakhir (Ambil 'Sampai')
        const sabaqRaw = latest?.tahfizh?.individual;
        const sabaqDisplay = getEndPart(sabaqRaw);

        // 3. Tilawah Terakhir (Ambil 'Sampai')
        const tilawahRaw = latest?.tilawah?.individual;
        const tilawahDisplay = getEndPart(tilawahRaw);

        // 4. Sedang Menghafal (Hitung Juz dari Sabaq Terakhir)
        // Jika sabaq kosong, fallback ke data student.currentProgress atau "-"
        const currentJuzDisplay = (sabaqDisplay !== '-') 
          ? getJuzFromString(sabaqDisplay)
          : (student.currentProgress || "-");

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
      setIsLoading(false);
    };
    loadData();
  }, [teacherId]);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = students.filter(s => 
      s.name.toLowerCase().includes(lowerSearch) || 
      (s.nis && s.nis.includes(lowerSearch)) ||
      (s.nisn && s.nisn.includes(lowerSearch)) ||
      s.className.toLowerCase().includes(lowerSearch)
    );
    setFilteredStudents(filtered);
  }, [search, students]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Halaqah Saya</h2>
          <p className="text-gray-500 mt-1">Daftar siswa dalam bimbingan halaqah Anda.</p>
        </div>
        <div className="flex gap-2">
           <Button>+ Input Setoran Hafalan</Button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama siswa, NIS, atau NISN..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Grid View */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Memuat data halaqah...</div>
      ) : filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow border-t-4 border-t-[#0ea5e9]">
              {/* Header Card */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                   <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xl">
                      {student.name.charAt(0)}
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-900 line-clamp-1" title={student.name}>{student.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {student.nis && (
                          <span className="text-[10px] px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-500 font-medium">
                            NIS: {student.nis}
                          </span>
                        )}
                        {student.nisn && (
                          <span className="text-[10px] px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-500 font-medium">
                            NISN: {student.nisn}
                          </span>
                        )}
                      </div>
                   </div>
                </div>
                <button className="text-gray-300 hover:text-gray-600">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Stats Rows - Font Size 12px, Line Height 16px */}
              <div className="space-y-4">
                {/* Jumlah Hafalan */}
                <div className="flex justify-between items-center text-[12px] leading-[16px]">
                   <span className="text-gray-500">Jumlah Hafalan</span>
                   <span className="font-bold text-[#0e7490]">{student.totalHafalanDisplay}</span>
                </div>
                
                {/* Sedang Menghafal (Derived from Sabaq) */}
                <div className="flex justify-between items-center text-[12px] leading-[16px]">
                   <span className="text-gray-500">Sedang Menghafal</span>
                   <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-blue-50 text-blue-600">
                        <BookOpen size={14} />
                      </div>
                      <span className="text-gray-700 font-medium truncate max-w-[120px] text-right">
                        {student.currentJuzDisplay}
                      </span>
                   </div>
                </div>

                <div className="h-px bg-gray-50"></div>

                {/* Sabaq Terakhir (End Part) */}
                <div className="flex justify-between items-center text-[12px] leading-[16px]">
                   <span className="text-gray-500">Sabaq Terakhir</span>
                   <span className="text-gray-900 font-medium text-right truncate max-w-[150px]" title={student.sabaqDisplay}>
                     {student.sabaqDisplay}
                   </span>
                </div>

                <div className="h-px bg-gray-50"></div>

                {/* Tilawah Terakhir (End Part) */}
                <div className="flex justify-between items-center text-[12px] leading-[16px]">
                   <span className="text-gray-500">Tilawah Terakhir</span>
                   <span className="text-gray-900 font-medium text-right truncate max-w-[150px]" title={student.tilawahDisplay}>
                     {student.tilawahDisplay}
                   </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">Tidak ada siswa ditemukan.</p>
        </div>
      )}
    </div>
  );
}
