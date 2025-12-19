
import React, { useEffect, useState, useRef } from 'react';
import { Student, User } from '../../../types';
import { getAllStudents, getAllTeachers, addStudent, updateStudent } from '../../../services/firestoreService';
import { CLASS_LIST } from '../../../services/mockBackend';
import { Button } from '../../../components/Button';
import { Search, Filter, Download, Plus, X, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CoordinatorSiswaPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nis: '',
    nisn: '',
    className: '',
    teacherId: '',
    memorizationTarget: 'Juz 30',
    currentProgress: 'Belum Ada'
  });

  // Helper map for teacher names
  const [teacherMap, setTeacherMap] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [allStudents, allTeachers] = await Promise.all([
      getAllStudents(),
      getAllTeachers()
    ]);
    
    setTeachers(allTeachers);

    const tMap: Record<string, string> = {};
    allTeachers.forEach(t => tMap[t.id] = t.name);
    setTeacherMap(tMap);

    setStudents(allStudents);
    setFilteredStudents(allStudents);
    setIsLoading(false);
  };

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = students.filter(s => 
      s.name.toLowerCase().includes(lowerSearch) || 
      (s.className && s.className.toLowerCase().includes(lowerSearch)) ||
      (s.nis && s.nis.includes(lowerSearch)) ||
      (s.nisn && s.nisn.includes(lowerSearch))
    );
    setFilteredStudents(filtered);
  }, [search, students]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      nis: '',
      nisn: '',
      className: '',
      teacherId: '',
      memorizationTarget: 'Juz 30',
      currentProgress: 'Belum Ada'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingId(student.id);
    setFormData({
      name: student.name,
      nis: student.nis || '',
      nisn: student.nisn || '',
      className: student.className,
      teacherId: student.teacherId,
      memorizationTarget: student.memorizationTarget,
      currentProgress: student.currentProgress
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.className || !formData.teacherId) {
      alert("Mohon lengkapi data wajib (Nama, Kelas, Guru)");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update existing student
        await updateStudent(editingId, {
          ...formData
        });
      } else {
        // Add new student
        await addStudent({
          ...formData,
          classId: '',
          progress: 0
        });
      }
      
      await loadData(); // Reload from Firestore
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan data siswa ke database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- IMPORT EXCEL LOGIC ---
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      if (jsonData.length === 0) {
        alert("File Excel kosong atau format tidak sesuai.");
        setIsImporting(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const row of jsonData as any[]) {
        const name = row['Nama'] || row['nama'];
        const nis = row['NIS'] || row['nis'] || '';
        const nisn = row['NISN'] || row['nisn'] || '';
        const className = row['Kelas'] || row['kelas'];
        const target = row['Target'] || row['target'] || 'Juz 30';
        const teacherName = row['Guru'] || row['guru'];

        if (!name || !className || !teacherName) {
          failCount++;
          continue;
        }

        const matchedTeacher = teachers.find(t => 
          t.name.toLowerCase().includes(teacherName.toLowerCase()) || 
          (t.nickname && t.nickname.toLowerCase().includes(teacherName.toLowerCase()))
        );

        if (!matchedTeacher) {
          failCount++;
          continue;
        }

        await addStudent({
          name: String(name),
          nis: String(nis),
          nisn: String(nisn),
          className: String(className),
          teacherId: matchedTeacher.id,
          memorizationTarget: String(target),
          currentProgress: 'Belum Ada',
          classId: '',
          progress: 0
        });
        
        successCount++;
      }

      alert(`Proses Import Selesai.\nBerhasil: ${successCount}\nGagal: ${failCount}`);
      await loadData();
      
    } catch (error) {
      console.error("Import Error:", error);
      alert("Terjadi kesalahan saat membaca file Excel.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Nama", "NIS", "NISN", "Kelas", "Target", "Guru"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Import_Siswa_SDQ.xlsx");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Siswa</h2>
          <p className="text-gray-500 mt-1">Total {students.length} siswa terdaftar dalam program halaqah.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             accept=".xlsx, .xls, .csv" 
             className="hidden" 
           />
           <Button variant="secondary" onClick={handleDownloadTemplate} title="Download Template Excel">
             Template
           </Button>
           <Button variant="outline" onClick={handleImportClick} isLoading={isImporting}>
             <Upload size={18} className="mr-2" /> Import Excel
           </Button>
           <Button onClick={handleOpenAddModal}><Plus size={18} className="mr-2" /> Tambah Siswa</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama, NIS, atau kelas..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <Button variant="secondary" className="md:w-auto">
          <Filter size={18} className="mr-2" /> Filter Lanjutan
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">NIS</th>
                <th className="px-6 py-4">NISN</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Guru Pembimbing</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4 text-gray-700">Progres</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Memuat data dari database...</td></tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{student.nis || '-'}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{student.nisn || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                        {student.className}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {teacherMap[student.teacherId] || 'Tidak Diketahui'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {student.memorizationTarget}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{student.currentProgress}</td>
                    <td className="px-6 py-4 text-center">
                       <button 
                         onClick={() => handleOpenEditModal(student)}
                         className="text-primary-600 hover:text-primary-800 font-medium text-xs bg-primary-50 px-3 py-1 rounded-md transition-colors"
                       >
                         Edit
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    Tidak ada data siswa ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-sm text-gray-500">
           <span>Menampilkan {filteredStudents.length} dari {students.length} siswa</span>
           <div className="flex gap-2">
             <button disabled className="px-3 py-1 border rounded bg-white disabled:opacity-50">Prev</button>
             <button disabled className="px-3 py-1 border rounded bg-white disabled:opacity-50">Next</button>
           </div>
        </div>
      </div>

      {/* Add/Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">{editingId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIS</label>
                  <input 
                    type="text" 
                    name="nis"
                    value={formData.nis}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
                  <input 
                    type="text" 
                    name="nisn"
                    value={formData.nisn}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                  <select 
                    name="className"
                    value={formData.className}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    required
                  >
                    <option value="">Pilih Kelas...</option>
                    {CLASS_LIST.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Hafalan</label>
                  <input 
                    type="text" 
                    name="memorizationTarget"
                    value={formData.memorizationTarget}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guru Pembimbing (Halaqah)</label>
                  <select 
                    name="teacherId"
                    value={formData.teacherId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    required
                  >
                    <option value="">Pilih Guru...</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-4">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  {editingId ? 'Simpan Perubahan' : 'Simpan Data'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
