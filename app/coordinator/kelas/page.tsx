import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClassHalaqahSummary, ClassSummary, getAllTeachers, reassignHalaqahTeacher } from '../../../services/firestoreService';
import { User } from '../../../types';
import { getStoredUser } from '../../../services/simpleAuth';
import { Button } from '../../../components/Button';
import { Building2, ArrowRight, User as UserIcon, Loader2, Edit, X } from 'lucide-react';

const CoordinatorKelasPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teachers, setTeachers] = useState<User[]>([]);
  
  // State Modal Ganti Guru
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedHalaqah, setSelectedHalaqah] = useState<{
    className: string;
    teacherId: string;
    teacherName: string;
  } | null>(null);
  const [targetTeacherId, setTargetTeacherId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [summary, allTeachers] = await Promise.all([
        getClassHalaqahSummary(),
        getAllTeachers()
      ]);
      setClasses(summary);
      setTeachers(allTeachers.filter(t => t.role === 'GURU'));
    } catch (error) {
      console.error("Gagal memuat data kelas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReassignModal = (className: string, teacherId: string, teacherName: string) => {
    setSelectedHalaqah({ className, teacherId, teacherName });
    setTargetTeacherId('');
    setIsModalOpen(true);
  };

  const handleConfirmReassign = async () => {
    if (!selectedHalaqah || !targetTeacherId) return;
    
    setIsSaving(true);
    try {
      const currentUser = getStoredUser();
      const newTeacher = teachers.find(t => t.id === targetTeacherId);
      
      if (!newTeacher) throw new Error("Guru baru tidak valid.");

      await reassignHalaqahTeacher(
        selectedHalaqah.className,
        selectedHalaqah.teacherId,
        targetTeacherId,
        newTeacher.nickname || newTeacher.name,
        selectedHalaqah.teacherName,
        currentUser?.id || 'system'
      );

      alert(`Berhasil mengganti guru halaqah menjadi ${newTeacher.nickname || newTeacher.name}.`);
      setIsModalOpen(false);
      loadData(); // Refresh UI
    } catch (error: any) {
      alert("Gagal: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Kelas & Halaqah</h2>
          <p className="text-gray-500 mt-1">Struktur kelas dibagi menjadi 2 halaqah per kelas.</p>
        </div>
        <Button onClick={() => loadData()}><Loader2 size={16} className="mr-2"/> Refresh Data</Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
          <Loader2 size={40} className="animate-spin text-primary-500" />
          <p className="text-sm font-medium">Sinkronisasi data Firestore...</p>
        </div>
      ) : classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.className} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Building2 size={24} />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${cls.status === 'Aktif' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cls.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight min-h-[3rem]">{cls.className}</h3>
                <p className="text-gray-500 text-xs mb-6">Total: {cls.totalStudents} Siswa</p>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Daftar Halaqah</h4>
                  {cls.halaqahs.length > 0 ? (
                    cls.halaqahs.slice(0, 2).map((halaqah, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 group">
                        <div className="flex items-center gap-3">
                          <UserIcon size={16} className="text-primary-500" />
                          <div>
                            <p className="text-xs text-gray-500">Halaqah {idx + 1}</p>
                            <p className="font-semibold text-gray-800 text-sm">{halaqah.teacherName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-bold text-gray-700">
                            {halaqah.studentCount}
                          </span>
                          <button 
                            onClick={() => handleOpenReassignModal(cls.className, halaqah.teacherId, halaqah.teacherName)}
                            className="p-1.5 hover:bg-white rounded text-gray-400 hover:text-primary-600 transition-colors" 
                            title="Ganti Guru"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                       <p className="text-xs text-gray-400">Belum ada halaqah terbentuk</p>
                    </div>
                  )}
                  
                  {/* Slot Halaqah 2 Tersedia jika baru ada 1 halaqah */}
                  {cls.halaqahs.length === 1 && (
                     <div className="flex items-center justify-center text-sm text-gray-400 bg-gray-50/50 p-3 rounded-lg border border-dashed border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                        <span className="text-xs">+ Slot Halaqah 2 Tersedia</span>
                     </div>
                  )}
                </div>
              </div>
              
              <div 
                onClick={() => navigate(`/coordinator/kelas/detail?name=${encodeURIComponent(cls.className)}`)}
                className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors group mt-auto"
              >
                <span className="text-sm font-medium text-gray-600 group-hover:text-primary-600">Lihat Detail Kelas</span>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-primary-600" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">Belum ada data kelas yang tercatat di sistem.</p>
        </div>
      )}

      {/* Modal Reassign Teacher */}
      {isModalOpen && selectedHalaqah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Konfigurasi Halaqah</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                <p className="font-bold mb-1">Perhatian:</p>
                <p>Anda akan mengganti guru untuk halaqah ini. Siswa akan dipindahkan ke guru baru untuk laporan mendatang. Laporan lama tetap tersimpan atas nama guru lama.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
                <div className="p-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                  {selectedHalaqah.className}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Guru Saat Ini</label>
                <div className="p-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2">
                  <UserIcon size={16} className="text-gray-400"/>
                  {selectedHalaqah.teacherName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Guru Pengganti</label>
                <select 
                  value={targetTeacherId}
                  onChange={(e) => setTargetTeacherId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
                >
                  <option value="">-- Pilih Guru Baru --</option>
                  {teachers
                    .filter(t => t.id !== selectedHalaqah.teacherId)
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.nickname || t.name}</option>
                    ))
                  }
                </select>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button onClick={handleConfirmReassign} isLoading={isSaving} disabled={!targetTeacherId}>
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoordinatorKelasPage;