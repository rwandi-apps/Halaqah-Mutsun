
import React from 'react';

const GuruLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="p-4 bg-white border-b">Guru Layout Navigation</nav>
      <main className="p-4">{children}</main>
    </div>
  );
};

export default GuruLayout;
