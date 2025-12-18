import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { getAllTeachers } from '../services/firestoreService';
import { Users, ChevronRight, Mail } from 'lucide-react';
import { Button } from '../components/UIComponents';

export const CoordinatorTeachers: React.FC = () => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllTeachers().then(setTeachers);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Guru</h2>
          <p className="text-gray-500 mt-1">Daftar semua musyrif dan ustadz/ustadzah.</p>
        </div>
        <Button>+ Tambah Guru</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <div 
            key={teacher.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => navigate(`/coordinator/guru/${teacher.id}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                  {teacher.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{teacher.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    <Mail size={12} />
                    {teacher.email}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Lihat Detail Kelas</span>
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoordinatorTeachers;