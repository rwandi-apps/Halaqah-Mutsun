
import React, { useEffect, useState } from 'react';
import { Report, User } from '../../../types';
import { getAllTeachers, subscribeToReportsByTeacher } from '../../../services/firestoreService';
import { SDQQuranEngine } from '../../../services/tahfizh/engine';
import { Search, Download, User as UserIcon, BookOpen, Layers } from 'lucide-react';
import { Button } from '../../../components/Button';

const formatTotalHafalan = (total: any) => {
  if (!total) return '-';
  const parts = [];
  if (total.juz > 0) parts.push(`${total.juz} Juz`);
  if (total.pages > 0) parts.push(`${total.pages} Hal`);
  return parts.length > 0 ? parts.join(' ') : '0 Juz'; 
};

export default function CoordinatorReportsPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getAllTeachers().then(data => {
      const onlyTeachers = data.filter(u => u.role === 'GURU');
      setTeachers(onlyTeachers);
      if (onlyTeachers.length > 0) setSelectedTeacherId(onlyTeachers[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedTeacherId) return;
    setIsLoading(true);
    const unsubscribe = subscribeToReportsByTeacher(selectedTeacherId, (data) => {
      setReports(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [selectedTeacherId]);

  useEffect(() => {
    let result = reports;
    if (search) result = result.filter(r => r.studentName.toLowerCase().includes(search.toLowerCase()));
    setFilteredReports(result);
  }, [search, reports]);

  const getResult = (report: Report, category: 'tahfizh' | 'tilawah') => {
    if (report[category].result) return report[category].result;
    const res = SDQQuranEngine.parseAndCalculate(report[category].individual);
    return res.valid ? `${res.pages}H ${res.lines}B` : "-";
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12 px-2">
      <h2 className="text-2xl font-bold text-gray-900">Pantau Laporan Guru</h2>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
        <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} className="p-2 border rounded-lg bg-white text-sm">
          {teachers.map(t => <option key={t.id} value={t.id}>{t.nickname || t.name}</option>)}
        </select>
        <input type="text" placeholder="Cari Siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="p-2 border rounded-lg text-sm" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#0e7490] text-white text-[10px] uppercase font-bold tracking-wider text-center">
                <th className="px-4 py-3 border-r border-white/20">No</th>
                <th className="px-4 py-3 border-r border-white/20 text-left">Nama Siswa</th>
                <th className="px-4 py-3 border-r border-white/20">Jml Hafalan</th>
                <th className="px-4 py-3 border-r border-white/20">Tilawah Individual</th>
                <th className="px-4 py-3 border-r border-white/20">Hasil TL</th>
                <th className="px-4 py-3 border-r border-white/20">Tahfizh Individual</th>
                <th className="px-4 py-3 border-r border-white/20">Hasil TF</th>
                <th className="px-4 py-3 text-left">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px]">
              {filteredReports.map((report, idx) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center">{idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-gray-900 uppercase border-r">{report.studentName}</td>
                  <td className="px-4 py-3 text-center font-bold text-teal-700 bg-teal-50/20 border-r">{formatTotalHafalan(report.totalHafalan)}</td>
                  <td className="px-4 py-3 text-center border-r">{report.tilawah.individual}</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/10 border-r">{getResult(report, 'tilawah')}</td>
                  <td className="px-4 py-3 text-center border-r">{report.tahfizh.individual}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/10 border-r">{getResult(report, 'tahfizh')}</td>
                  <td className="px-4 py-3 italic text-gray-500 truncate max-w-[200px]">{report.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
