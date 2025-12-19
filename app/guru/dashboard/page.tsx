import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { subscribeToStudentsByTeacher } from '@/services/firestoreService';
import { Student, User } from '@/types';

export default function GuruDashboardPage() {
  const { user } = useOutletContext<{ user: User }>();
  const teacherId = user.id;

  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!teacherId) return;
    return subscribeToStudentsByTeacher(teacherId, setStudents);
  }, [teacherId]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Dashboard Guru
      </h1>

      <p className="mb-4">
        Selamat datang, <b>{user.nickname || user.name}</b>
      </p>

      {students.length === 0 && (
        <p className="text-gray-500">Belum ada siswa</p>
      )}

      <ul className="space-y-2">
        {students.map(s => (
          <li key={s.id} className="border p-3 rounded">
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
