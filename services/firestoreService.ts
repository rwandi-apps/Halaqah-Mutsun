import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Student } from '@/types';

export const subscribeToStudentsByTeacher = (
  teacherId: string,
  onUpdate: (students: Student[]) => void
) => {
  if (!db) return () => {};

  const q = query(
    collection(db, 'siswa'),
    where('teacherId', '==', teacherId)
  );

  return onSnapshot(q, snap => {
    onUpdate(
      snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Student[]
    );
  });
};
