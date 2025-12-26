
import React, { useEffect, useState } from 'react';
import { Student, SemesterReport, User } from '../../../types';
import { getAllStudents, getAllTeachers, getAllSemesterReports } from '../../../services/firestoreService';
import { Search, Filter, FileText, User as UserIcon, BookOpen } from 'lucide-react';
import { Button } from '../../../components/Button';

export default function CoordinatorRaporPage() {
  const [reports, setReports] = useState<SemesterReport[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('Semua');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [allReports, allStudents, allTeachers] = await Promise.all([
        getAllSemesterReports(),
        getAllStudents(),
        getAllTeachers()
      ]);
      setReports(allReports);
      setStudents(allStudents);
      setTeachers(allTeachers);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const getStudentInfo = (id: string) => students.find(s => s.id === id);
  const getTeacherInfo = (id: string) => teachers.find(t => t.id === id);

  const filteredReports = reports.filter(r => {
    const student = getStudentInfo(r.studentId);
    const matchesSearch = student?.name.toLowerCase().includes(search.toLowerCase()) || 
                          student?.className.toLowerCase().includes(search.toLowerCase());
    const matchesYear = filterYear === 'Semua' || r.academicYear === filterYear;
    return matchesSearch && matchesYear;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pantau Rapor Semester</h2>
          <p className="text-gray-500 mt-1">Lihat status pengisian rapor semester seluruh siswa.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama siswa atau kelas..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
          />
        </div>
        <select 
          value={filterYear} 
          onChange={(e) => setFilterYear(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none"
        >
          <option value="Semua">Semua Tahun</option>
          <option value="2024 / 2025">2024 / 2025</option>
          <option value="2025 / 2026">2025 / 2026</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Guru (Wali Kelas)</th>
                <th className="px-6 py-4">Tahun / Smt</th>
                <th className="px-6 py-4 text-center">UTS/UAS</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">Memuat data rapor...</td></tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report, idx) => {
                  const student = getStudentInfo(report.studentId);
                  const teacher = getTeacherInfo(report.teacherId);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-4 font-bold text-gray-900 uppercase">{student?.name || 'Siswa Dihapus'}</td>
                      <td className="px-6 py-4">{student?.className || '-'}</td>
                      <td className="px-6 py-4 font-medium text-primary-700">{teacher?.nickname || teacher?.name || '-'}</td>
                      <td className="px-6 py-4 text-xs font-semibold uppercase">{report.academicYear} <br/><span className="text-gray-400">{report.semester}</span></td>
                      <td className="px-6 py-4 text-center font-bold text-gray-800">
                        <span className="text-emerald-600">{report.exams.uts}</span> / <span className="text-blue-600">{report.exams.uas}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button variant="outline" size="sm" onClick={() => alert("Fitur preview Koordinator akan segera hadir!")} className="text-[10px] font-black uppercase">
                          <FileText size={14}/> Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400">Belum ada rapor yang diinput untuk kriteria ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
