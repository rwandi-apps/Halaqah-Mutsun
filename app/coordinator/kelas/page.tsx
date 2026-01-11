
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClassHalaqahSummary, ClassSummary } from '../../../services/firestoreService';
import { Button } from '../../../components/Button';
import { Building2, ArrowRight, User as UserIcon, Loader2 } from 'lucide-react';

const CoordinatorKelasPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const summary = await getClassHalaqahSummary();
        setClasses(summary);
      } catch (error) {
        console.error("Gagal memuat data kelas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Kelas & Halaqah</h2>
          <p className="text-gray-500 mt-1">Struktur kelas dibagi menjadi 2 halaqah per kelas.</p>
        </div>
        <Button>+ Konfigurasi Kelas</Button>
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
                      <div key={idx} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <UserIcon size={16} className="text-primary-500" />
                          <div>
                            <p className="text-xs text-gray-500">Halaqah {idx + 1}</p>
                            <p className="font-semibold text-gray-800 text-sm">{halaqah.teacherName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-bold text-gray-700">
                            {halaqah.studentCount}
                          </span>
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
    </div>
  );
}

export default CoordinatorKelasPage;
