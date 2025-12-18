import React, { useEffect, useState } from 'react';
import { Student, User } from '../../../types';
import { getAllStudents, getAllTeachers } from '../../../services/firestoreService';
import { CLASS_LIST } from '../../../services/mockBackend';
import { Button } from '../../../components/Button';
import { Building2, Users, ArrowRight, User as UserIcon } from 'lucide-react';

interface HalaqahData {
  teacherId: string;
  teacherName: string;
  studentCount: number;
}

interface ClassData {
  className: string;
  halaqahs: HalaqahData[];
  totalStudents: number;
}

export default function CoordinatorKelasPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [allStudents, allTeachers] = await Promise.all([
        getAllStudents(),
        getAllTeachers()
      ]);

      // Create a map of teacher ID to name for easy lookup
      const teacherMap = new Map<string, string>();
      allTeachers.forEach(t => teacherMap.set(t.id, t.name));

      // Build data structure based on CLASS_LIST
      const processedClasses: ClassData[] = CLASS_LIST.map(className => {
        // Filter students belonging to this class
        const studentsInClass = allStudents.filter(s => s.className === className);
        
        // Group students by teacher (Halaqah)
        const halaqahMap = new Map<string, number>();
        studentsInClass.forEach(s => {
          const currentCount = halaqahMap.get(s.teacherId) || 0;
          halaqahMap.set(s.teacherId, currentCount + 1);
        });

        const halaqahs: HalaqahData[] = [];
        halaqahMap.forEach((count, teacherId) => {
          halaqahs.push({
            teacherId,
            teacherName: teacherMap.get(teacherId) || 'Unknown Teacher',
            studentCount: count
          });
        });

        return {
          className,
          halaqahs,
          totalStudents: studentsInClass.length
        };
      });

      setClasses(processedClasses);
      setIsLoading(false);
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
        <div className="text-center py-12 text-gray-500">Memuat data kelas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.className} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Building2 size={24} />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${cls.halaqahs.length > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cls.halaqahs.length > 0 ? 'Aktif' : 'Kosong'}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight min-h-[3rem]">{cls.className}</h3>
                <p className="text-gray-500 text-xs mb-6">Total: {cls.totalStudents} Siswa</p>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Daftar Halaqah</h4>
                  {cls.halaqahs.length > 0 ? (
                    cls.halaqahs.map((halaqah, idx) => (
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
                  
                  {/* Visual placeholder if only 1 halaqah exists to show capacity for 2 */}
                  {cls.halaqahs.length === 1 && (
                     <div className="flex items-center justify-center text-sm text-gray-400 bg-gray-50/50 p-3 rounded-lg border border-dashed border-gray-200">
                        <span className="text-xs">+ Slot Halaqah 2 Tersedia</span>
                     </div>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors group mt-auto">
                <span className="text-sm font-medium text-gray-600 group-hover:text-primary-600">Lihat Detail Kelas</span>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-primary-600" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}