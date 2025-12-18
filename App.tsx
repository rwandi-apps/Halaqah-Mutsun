import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, isFirebaseEnabled } from './lib/firebase';
import { Layout } from './app/layout';
import LoginPage from './app/(auth)/login/page';
import CoordinatorDashboard from './app/coordinator/dashboard/page';
import CoordinatorGuruPage from './app/coordinator/guru/page';
import CoordinatorTeacherDetail from './app/coordinator/guru/[id]/page';
import CoordinatorSiswaPage from './app/coordinator/siswa/page';
import CoordinatorKelasPage from './app/coordinator/kelas/page';
import GuruDashboard from './app/guru/dashboard/page';
import GuruHalaqahPage from './app/guru/halaqah/page';
import GuruLaporanPage from './app/guru/laporan/page';
import GuruViewReportPage from './app/guru/view-report/page';
import { User, Role } from './types';
import { logout } from './lib/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Firebase Auth Persistence Listener
  useEffect(() => {
    // If Firebase isn't configured, we skip the listener and stop loading.
    // The user will be directed to the Login page where they can use Demo mode.
    if (!isFirebaseEnabled || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          if (!db) {
             console.error("Firestore DB not initialized");
             return;
          }

          let currentUserId = firebaseUser.uid;
          let currentUserRole: Role = 'GURU';
          let currentUserName = firebaseUser.displayName || firebaseUser.email || 'User';

          // 1. Check if user document exists with UID (Best practice: Auth UID = Doc ID)
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            currentUserId = firebaseUser.uid;
            currentUserRole = (userData.role as Role) || 'GURU';
            currentUserName = userData.name || currentUserName;
          } else {
            // 2. Fallback: Check if user exists by Email (Created by Coordinator via addDoc)
            // This links the Auth User (UID) to the Profile Document (Random ID)
            if (firebaseUser.email) {
              const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                currentUserId = userDoc.id; // IMPORTANT: Use the Firestore Doc ID as the User ID
                currentUserRole = (userData.role as Role) || 'GURU';
                currentUserName = userData.name || currentUserName;
              }
            }
          }

          setUser({
            id: currentUserId,
            name: currentUserName,
            email: firebaseUser.email || '',
            role: currentUserRole,
          });

        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Optional: handle error state
        }
      } else {
        // No user logged in (or just logged out)
        if (isFirebaseEnabled) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await logout(); // Firebase signout
    setUser(null);
  };

  const handleSwitchRole = (role: Role) => {
    // Development/Demo helper to quick switch
    if (user) {
       setUser({ ...user, role });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to={user.role === 'KOORDINATOR' ? '/coordinator/dashboard' : '/guru/dashboard'} replace /> : <LoginPage onLogin={handleLogin} />
        } />

        <Route element={<Layout user={user} onLogout={handleLogout} onSwitchRole={handleSwitchRole} />}>
          {/* Coordinator Routes */}
          <Route path="/coordinator" element={<Navigate to="/coordinator/dashboard" replace />} />
          
          <Route path="/coordinator/dashboard" element={
            user?.role === 'KOORDINATOR' ? <CoordinatorDashboard /> : <Navigate to="/guru/dashboard" replace />
          } />
          
          <Route path="/coordinator/guru" element={
             user?.role === 'KOORDINATOR' ? <CoordinatorGuruPage /> : <Navigate to="/guru/dashboard" replace />
          } />

          <Route path="/coordinator/guru/:id" element={
             user?.role === 'KOORDINATOR' ? <CoordinatorTeacherDetail /> : <Navigate to="/guru/dashboard" replace />
          } />

          <Route path="/coordinator/siswa" element={
             user?.role === 'KOORDINATOR' ? <CoordinatorSiswaPage /> : <Navigate to="/guru/dashboard" replace />
          } />

          <Route path="/coordinator/kelas" element={
             user?.role === 'KOORDINATOR' ? <CoordinatorKelasPage /> : <Navigate to="/guru/dashboard" replace />
          } />

          {/* Fallback for other coordinator routes placeholders */}
           <Route path="/coordinator/*" element={
             user?.role === 'KOORDINATOR' ? <CoordinatorDashboard /> : <Navigate to="/guru/dashboard" replace />
          } />


          {/* Guru Routes */}
          <Route path="/guru" element={<Navigate to="/guru/dashboard" replace />} />

          <Route path="/guru/dashboard" element={
            user?.role === 'GURU' ? <GuruDashboard teacherId={user.id} /> : <Navigate to="/coordinator/dashboard" replace />
          } />

          <Route path="/guru/halaqah" element={
            user?.role === 'GURU' ? <GuruHalaqahPage teacherId={user.id} /> : <Navigate to="/coordinator/dashboard" replace />
          } />

          <Route path="/guru/laporan" element={
            user?.role === 'GURU' ? <GuruLaporanPage teacherId={user.id} /> : <Navigate to="/coordinator/dashboard" replace />
          } />

          <Route path="/guru/view-report" element={
            user?.role === 'GURU' ? <GuruViewReportPage teacherId={user.id} /> : <Navigate to="/coordinator/dashboard" replace />
          } />

           {/* Fallback for other guru routes placeholders */}
          <Route path="/guru/*" element={
            user?.role === 'GURU' ? <GuruDashboard teacherId={user.id} /> : <Navigate to="/coordinator/dashboard" replace />
          } />
        </Route>

        {/* Default Redirect based on Role */}
        <Route path="*" element={
          user ? <Navigate to={user.role === 'KOORDINATOR' ? '/coordinator/dashboard' : '/guru/dashboard'} replace /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </HashRouter>
  );
}

export default App;