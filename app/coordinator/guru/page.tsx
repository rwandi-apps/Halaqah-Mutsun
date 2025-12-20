
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Role } from '../../../types';
import { getAllTeachers, addTeacher, updateTeacher } from '../../../services/firestoreService';
import { Users, ChevronRight, Mail, Plus, X, ShieldCheck, Edit2 } from 'lucide-react';
import { Button } from '../../../components/Button';

export default function CoordinatorGuruPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('GURU');

  const navigate = useNavigate();

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = () => {
    getAllTeachers()
      .then(data => {
        setTeachers(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Failed to load teachers", err);
        setTeachers([]);
      });
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setNewName('');
    setNewNickname('');
    setNewEmail('');
    setNewRole('GURU');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, teacher: User) => {
    e.stopPropagation(); // Mencegah navigasi ke halaman detail
    setEditingId(teacher.id);
    setNewName(teacher.name);
    setNewNickname(teacher.nickname || '');
    setNewEmail(teacher.email);
    setNewRole(teacher.role);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newNickname) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Mode Edit
        await updateTeacher(editingId, {
          name: newName,
          nickname: newNickname,
          email: newEmail,
          role: newRole
        });
      } else {
        // Mode Tambah
        await addTeacher(newName, newEmail, newNickname, newRole);
      }
      
      await loadTeachers(); // Refresh list from Firestore
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save teacher", error);
      alert("Gagal menyimpan data ke database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Guru & Staf</h2>
          <p className="text-gray-500 mt-1">Daftar semua guru halaqah and koordinator.</p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <Plus size={18} className="mr-2" /> Tambah Guru
        </Button>
      </div>

      {!teachers || teachers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
           <p className="text-gray-500">Belum ada data guru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher, index) => {
            if (!teacher) return null;

            const name = typeof teacher.name === 'string' ? teacher.name : "Tanpa Nama";
            const nickname = typeof teacher.nickname === 'string' && teacher.nickname ? teacher.nickname : name;
            const email = teacher.email || "-";
            const role = teacher.role || 'GURU';
            
            const initial = typeof nickname === 'string' && nickname.length > 0 
              ? nickname.charAt(0).toUpperCase() 
              : "?";

            return (
              <div 
                key={teacher.id || `teacher-${index}`} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group relative"
                onClick={() => navigate(`/coordinator/guru/${teacher.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${role === 'KOORDINATOR' ? 'bg-purple-100 text-purple-600' : 'bg-primary-100 text-primary-600'}`}>
                      {initial}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {nickname}
                        </h3>
                        {role === 'KOORDINATOR' && (
                          <ShieldCheck size={14} className="text-purple-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">{name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <Mail size={12} />
                        {email}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tombol Edit Baru */}
                  <button 
                    onClick={(e) => handleOpenEditModal(e, teacher)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit Profil Guru"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
                
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    {role === 'KOORDINATOR' ? 'Lihat Profil Admin' : 'Lihat Detail Kelas'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">{editingId ? 'Edit Profil Guru/Staf' : 'Tambah Guru/Staf Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingId && (
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800">
                  <strong>Catatan:</strong> Menambah user baru di sini hanya menyimpan profil. 
                  Anda perlu mendaftarkan email tersebut di Firebase Auth agar mereka bisa login.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Muhammad Hasan Al-Basri"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Panggilan (Header)</label>
                <input 
                  type="text" 
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  placeholder="Contoh: Ustadz Hasan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peran (Role)</label>
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
                >
                  <option value="GURU">Guru Halaqah</option>
                  <option value="KOORDINATOR">Koordinator</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@sekolah.com"
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm ${editingId ? 'bg-gray-50 text-gray-500' : ''}`}
                  required
                  readOnly={!!editingId} // Email biasanya tidak diubah setelah dibuat di Firebase Auth
                />
                {editingId && <p className="text-[10px] text-gray-400 mt-1">Email tidak dapat diubah untuk keamanan sistem.</p>}
              </div>

              <div className="pt-2 flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  {editingId ? 'Simpan Perubahan' : 'Simpan ke Database'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
