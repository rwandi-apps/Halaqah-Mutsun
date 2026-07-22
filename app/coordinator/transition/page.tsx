import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStudents, getAllTeachers, updateStudent } from '../../../services/firestoreService';
import { Student, User } from '../../../types';
import { CLASS_LIST } from '../../../services/mockBackend';
import { Button } from '../../../components/Button';
import { 
  Calendar, 
  ArrowRight, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  GraduationCap, 
  CheckSquare, 
  Square 
} from 'lucide-react';

export default function CoordinatorTransitionPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Year & Transition Options
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026/2027');
  const [resetProgress, setResetProgress] = useState(true);
  const [resetStats, setResetStats] = useState(true);
  
  // Mapping configuration: currentClassName -> targetClassName
  const [classMapping, setClassMapping] = useState<Record<string, string>>({});
  
  // Status / Results
  const [isSuccess, setIsSuccess] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allStudents, allTeachers] = await Promise.all([
        getAllStudents(),
        getAllTeachers()
      ]);
      setStudents(allStudents);
      setTeachers(allTeachers);

      // Initialize default mapping
      const uniqueClasses = Array.from(new Set(allStudents.map(s => s.className).filter(Boolean)));
      const initialMapping: Record<string, string> = {};
      
      uniqueClasses.forEach(currClass => {
        // Simple auto-mapping heuristic:
        // Try to find the number in the current class and suggest next grade number
        const match = currClass.match(/Kelas\s*(\d+)/i);
        if (match && match[1]) {
          const currentGrade = parseInt(match[1], 10);
          if (currentGrade === 6) {
            initialMapping[currClass] = 'Lulus / Alumni';
          } else {
            const nextGrade = currentGrade + 1;
            // Find a class in CLASS_LIST that matches "Kelas [nextGrade]"
            const matchingNextClass = CLASS_LIST.find(c => c.startsWith(`Kelas ${nextGrade}`));
            initialMapping[currClass] = matchingNextClass || '';
          }
        } else {
          initialMapping[currClass] = '';
        }
      });
      
      setClassMapping(initialMapping);
    } catch (error) {
      console.error("Gagal memuat data transisi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group students by current class
  const studentsByClass = React.useMemo(() => {
    const groups: Record<string, Student[]> = {};
    students.forEach(s => {
      const cls = s.className || 'Tanpa Kelas';
      if (!groups[cls]) groups[cls] = [];
      groups[cls].push(s);
    });
    return groups;
  }, [students]);

  const handleMappingChange = (currentClass: string, targetClass: string) => {
    setClassMapping(prev => ({
      ...prev,
      [currentClass]: targetClass
    }));
  };

  const executeTransition = async () => {
    const unmappedClasses = Object.entries(classMapping).filter(([_, target]) => !target);
    if (unmappedClasses.length > 0) {
      alert(`Mohon lengkapi pemetaan kelas untuk semua kelas yang aktif. (${unmappedClasses.map(([c]) => c).join(', ')})`);
      return;
    }

    const confirmMessage = `Apakah Anda yakin ingin memproses kenaikan kelas ke Tahun Ajaran ${selectedAcademicYear}?\n\nTindakan ini akan memperbarui kelas semua siswa yang dipilih secara langsung di database Firestore.`;
    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);
    setLogs([]);
    const newLogs: string[] = [];

    const addLog = (msg: string) => {
      newLogs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setLogs([...newLogs]);
    };

    try {
      addLog(`Memulai proses transisi Tahun Ajaran Baru ke ${selectedAcademicYear}...`);
      
      let updatedCount = 0;
      
      for (const [currentClass, targetClass] of Object.entries(classMapping) as [string, string][]) {
        const studentsInClass = studentsByClass[currentClass] || [];
        addLog(`Memproses ${studentsInClass.length} siswa di "${currentClass}" -> "${targetClass}"`);

        for (const student of studentsInClass) {
          try {
            const updateData: Partial<Student> = {
              className: targetClass
            };

            // Optional resets
            if (resetProgress) {
              updateData.currentProgress = targetClass === 'Lulus / Alumni' ? 'Lulus' : 'Belum Ada';
            }
            if (resetStats) {
              updateData.attendance = 0;
              updateData.behaviorScore = 0;
            }

            await updateStudent(student.id, updateData);
            updatedCount++;
          } catch (studentErr) {
            console.error(`Gagal memperbarui siswa ${student.name}:`, studentErr);
            addLog(`❌ GAGAL: Siswa ${student.name}`);
          }
        }
        addLog(`Selesai memproses kelas "${currentClass}".`);
      }

      addLog(`Selesai! Berhasil memperbarui ${updatedCount} data siswa.`);
      setIsSuccess(true);
      
    } catch (err: any) {
      addLog(`❌ Terjadi kesalahan sistem: ${err.message}`);
      alert("Proses transisi mengalami kegagalan sebagian. Silakan periksa log.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={40} className="animate-spin text-primary-500" />
        <p className="text-gray-500 font-medium">Memuat data siswa dan kelas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
          <Sparkles size={300} />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
            <Calendar size={14} /> Tahun Ajaran Baru 2026/2027
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Transisi Tahun Ajaran & Kenaikan Kelas</h2>
          <p className="text-white/80 leading-relaxed text-sm">
            Selamat datang di Tahun Ajaran baru! Gunakan modul asisten ini untuk menaikkan kelas siswa secara massal, mengatur pemetaan kelas, dan menyegarkan parameter halaqah untuk memulai periode belajar yang baru secara bersih dan terstruktur.
          </p>
        </div>
      </div>

      {isSuccess ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-100">
            <CheckCircle size={36} />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-900">Transisi Selesai dengan Sukses!</h3>
            <p className="text-gray-500 text-sm">
              Seluruh siswa yang dipilih telah berhasil dinaikkan ke kelas baru masing-masing. Sistem siap digunakan untuk laporan dan penilaian Tahun Ajaran baru {selectedAcademicYear}.
            </p>
          </div>

          {/* Log viewer */}
          <div className="bg-gray-50 rounded-xl p-4 text-left font-mono text-xs text-gray-600 max-h-48 overflow-y-auto max-w-xl mx-auto border border-gray-100">
            <p className="font-bold border-b border-gray-200 pb-1 mb-2">LOG PROSES TRANSISI:</p>
            {logs.map((log, i) => (
              <p key={i} className="py-0.5">{log}</p>
            ))}
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <Button variant="secondary" onClick={() => navigate('/coordinator/siswa')}>
              Ke Data Siswa
            </Button>
            <Button onClick={() => { setIsSuccess(false); loadData(); }}>
              Transisi Kelas Lain
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mapping & Promotion Setup */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Pemetaan Kenaikan Kelas</h3>
                  <p className="text-xs text-gray-400">Atur tujuan kelas baru untuk setiap rombongan kelas lama.</p>
                </div>
              </div>

              {Object.keys(studentsByClass).length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Tidak ada data kelas siswa yang aktif.
                </div>
              ) : (
                <div className="space-y-4">
                  {(Object.entries(studentsByClass) as [string, Student[]][]).map(([currentClass, list]) => (
                    <div key={currentClass} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="bg-gray-200/80 text-gray-800 px-2.5 py-0.5 rounded text-xs font-semibold">
                          {currentClass}
                        </span>
                        <p className="text-xs text-gray-400">{list.length} Siswa Terdaftar</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <ArrowRight size={16} className="text-gray-400 hidden md:block" />
                        <select
                          value={classMapping[currentClass] || ''}
                          onChange={(e) => handleMappingChange(currentClass, e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500 md:w-64"
                        >
                          <option value="">-- Pilih Kelas Tujuan --</option>
                          <option value="Lulus / Alumni">Lulus / Alumni (Keluar)</option>
                          {CLASS_LIST.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Configuration & Options */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Konfigurasi & Aksi</h3>
                  <p className="text-xs text-gray-400">Atur pembersihan data opsional.</p>
                </div>
              </div>

              {/* Year Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1">
                  Tahun Ajaran Aktif
                </label>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold bg-white outline-none"
                >
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027 (Baru)</option>
                  <option value="2027/2028">2027/2028</option>
                </select>
              </div>

              <div className="h-px bg-gray-100"></div>

              {/* Reset switches */}
              <div className="space-y-4">
                <div 
                  className="flex items-start gap-3 cursor-pointer group"
                  onClick={() => setResetProgress(!resetProgress)}
                >
                  <div className="text-primary-600 mt-0.5">
                    {resetProgress ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                      Mulai Progres dari Nol
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Reset status capaian siswa (progres harian) menjadi 'Belum Ada' untuk memulai modul baru di kelas barunya.
                    </p>
                  </div>
                </div>

                <div 
                  className="flex items-start gap-3 cursor-pointer group"
                  onClick={() => setResetStats(!resetStats)}
                >
                  <div className="text-primary-600 mt-0.5">
                    {resetStats ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                      Reset Statistik Kehadiran & Adab
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Atur ulang skor kehadiran bulanan and adab siswa ke angka default (0) agar siap dinilai dari awal oleh guru baru.
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100"></div>

              {/* Alert Warning */}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 text-amber-800">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  <strong>Peringatan Keamanan:</strong> Tindakan ini memperbarui data secara permanen di server Firestore. Data laporan and evaluasi masa lalu di tahun ajaran sebelumnya tidak akan dihapus, tetapi siswa akan dipindahkan secara fisik ke rombongan kelas baru.
                </p>
              </div>

              <Button
                onClick={executeTransition}
                className="w-full py-3.5 shadow-lg shadow-primary-500/25"
                isLoading={isProcessing}
              >
                <RefreshCw size={16} className={`mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                Proses Transisi TA Baru
              </Button>
            </div>

            {/* Teacher assignment note */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary-600">
                <Users size={18} />
                <h4 className="font-bold text-sm">Ganti Guru Halaqah?</h4>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Jika di tahun ajaran baru ini terdapat guru halaqah baru atau mutasi guru untuk kelas tertentu, Anda dapat mengaturnya kapan saja secara langsung melalui menu utama <strong>Data Kelas & Halaqah</strong>.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => navigate('/coordinator/kelas')}
              >
                Atur Wali Halaqah Baru
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
