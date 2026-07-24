
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Student, User } from '../../../types';
import { getAllStudents, getAllTeachers, addStudent, updateStudent, isHalaqahTeacher } from '../../../services/firestoreService';
import { CLASS_LIST } from '../../../services/mockBackend';
import { getStudentGender, getAutomaticTargetLabel, extractClassLevel } from '../../../services/sdqTargets';
import { Button } from '../../../components/Button';
import { Search, Filter, Download, Plus, X, Upload, RefreshCw, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CoordinatorSiswaPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif' | 'Mutasi/Keluar' | 'Alumni/Lulus'>('Aktif');

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
    gender: 'L' as 'L' | 'P',
    teacherId: '',
    memorizationTarget: 'Juz 30',
    currentProgress: 'Belum Ada',
    status: 'Aktif' as 'Aktif' | 'Mutasi/Keluar' | 'Alumni/Lulus'
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
    const filtered = students.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(lowerSearch) || 
        (s.className && s.className.toLowerCase().includes(lowerSearch)) ||
        (s.nis && s.nis.includes(lowerSearch)) ||
        (s.nisn && s.nisn.includes(lowerSearch));
        
      const sStatus = s.status || 'Aktif';
      const matchesStatus = statusFilter === 'Semua' || sStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    setFilteredStudents(filtered);
  }, [search, students, statusFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'className') {
        next.gender = getStudentGender({ className: value });
        const level = extractClassLevel(value);
        next.memorizationTarget = getAutomaticTargetLabel(level);
      }
      if (name === 'status' && (value === 'Mutasi/Keluar' || value === 'Alumni/Lulus')) {
        next.teacherId = '';
      }
      return next;
    });
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      nis: '',
      nisn: '',
      className: '',
      gender: 'L',
      teacherId: '',
      memorizationTarget: 'Target Iqra 1-6',
      currentProgress: 'Belum Ada',
      status: 'Aktif'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingId(student.id);
    const level = extractClassLevel(student.className);
    const isInactiveStatus = student.status === 'Mutasi/Keluar' || student.status === 'Alumni/Lulus';
    setFormData({
      name: student.name,
      nis: student.nis || '',
      nisn: student.nisn || '',
      className: student.className,
      gender: student.gender || getStudentGender(student),
      teacherId: isInactiveStatus ? '' : student.teacherId,
      memorizationTarget: getAutomaticTargetLabel(level),
      currentProgress: student.currentProgress,
      status: student.status || 'Aktif'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.className) {
      alert("Mohon lengkapi data wajib (Nama dan Kelas)");
      return;
    }

    const isMutasiOrAlumni = formData.status === 'Mutasi/Keluar' || formData.status === 'Alumni/Lulus';

    if (!isMutasiOrAlumni && !formData.teacherId) {
      alert("Mohon pilih Guru Pembimbing (Halaqah) untuk siswa aktif.");
      return;
    }

    setIsSubmitting(true);
    try {
      const level = extractClassLevel(formData.className);
      const finalTarget = getAutomaticTargetLabel(level);
      const dataToSave = {
        ...formData,
        teacherId: isMutasiOrAlumni ? '' : formData.teacherId,
        memorizationTarget: finalTarget
      };

      if (editingId) {
        // Update existing student
        await updateStudent(editingId, dataToSave);
      } else {
        // Add new student
        await addStudent({
          ...dataToSave,
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
          progress: 0,
          status: 'Aktif'
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
           <Button variant="outline" onClick={() => navigate('/coordinator/transition')} className="border-primary-500 text-primary-600 hover:bg-primary-50 mr-2">
              <RefreshCw size={18} className="mr-2" /> Naik Kelas Massal
            </Button>
            <Button onClick={handleOpenAddModal}><Plus size={18} className="mr-2" /> Tambah Siswa</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
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
          
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            {(['Semua', 'Aktif', 'Mutasi/Keluar', 'Alumni/Lulus'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === tab 
                    ? 'bg-white text-gray-900 shadow-sm font-black' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab === 'Semua' ? 'Semua Status' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Info Banner Solusi Murid Keluar */}
        <div className="bg-amber-50/70 border border-amber-200/50 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-3">
          <Info size={16} className="mt-0.5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold text-amber-950 mb-0.5">💡 Solusi Terkait Murid Keluar / Mutasi</p>
            <p className="leading-relaxed text-amber-800 font-medium">
              Siswa yang keluar di tengah tahun ajaran <strong>tidak disarankan untuk dihapus permanen</strong> dari sistem agar seluruh arsip setoran sabaq, jurnal bulanan, dan rapor semester terdahulu mereka tidak ikut hilang. Cukup ganti Status Keaktifannya menjadi <strong>"Mutasi / Keluar"</strong>. Mereka otomatis disembunyikan dari daftar bimbingan harian guru agar tidak membingungkan, namun riwayat akademisnya tetap aman tersimpan di basis data sekolah.
            </p>
          </div>
        </div>
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
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Guru Pembimbing</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4 text-gray-700">Progres</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-500">Memuat data dari database...</td></tr>
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
                    <td className="px-6 py-4">
                      {student.status === 'Mutasi/Keluar' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                          Mutasi
                        </span>
                      ) : student.status === 'Alumni/Lulus' || student.className === 'Lulus / Alumni' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                          Alumni
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {teacherMap[student.teacherId] || 'Tidak Diketahui'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {getAutomaticTargetLabel(extractClassLevel(student.className))}
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
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                  <select 
                    name="className"
                    value={formData.className}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                    required
                  >
                    <option value="">Pilih Kelas...</option>
                    {CLASS_LIST.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                    <option value="Lulus / Alumni">Lulus / Alumni (Keluar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm font-bold text-gray-700"
                    required
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Keaktifan</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm font-bold text-gray-700"
                    required
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Mutasi/Keluar">Mutasi / Keluar</option>
                    <option value="Alumni/Lulus">Alumni / Lulus</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Hafalan</label>
                  <input 
                    type="text" 
                    name="memorizationTarget"
                    value={formData.memorizationTarget}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed outline-none font-medium text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">Otomatis ditentukan berdasarkan tingkatan kelas</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guru Pembimbing (Halaqah)</label>
                  <select 
                    name="teacherId"
                    value={formData.teacherId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${
                      formData.status === 'Mutasi/Keluar' || formData.status === 'Alumni/Lulus' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
                    }`}
                    required={formData.status === 'Aktif'}
                    disabled={formData.status === 'Mutasi/Keluar' || formData.status === 'Alumni/Lulus'}
                  >
                    <option value="">
                      {formData.status === 'Mutasi/Keluar' 
                        ? '(Kosong - Siswa Mutasi)' 
                        : formData.status === 'Alumni/Lulus' 
                        ? '(Kosong - Alumni)' 
                        : 'Pilih Guru...'}
                    </option>
                    {teachers
                      .filter(t => isHalaqahTeacher(t) && (t.status !== 'Nonaktif' || t.id === formData.teacherId))
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.status === 'Nonaktif' ? '(Nonaktif)' : ''}
                        </option>
                      ))
                    }
                  </select>
                  {(formData.status === 'Mutasi/Keluar' || formData.status === 'Alumni/Lulus') && (
                    <p className="text-[10px] text-amber-600 mt-1 font-medium">
                      💡 Siswa dengan status {formData.status === 'Mutasi/Keluar' ? 'Mutasi / Keluar' : 'Alumni / Lulus'} otomatis dikosongkan dari guru pembimbing.
                    </p>
                  )}
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
