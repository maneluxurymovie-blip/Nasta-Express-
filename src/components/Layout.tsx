import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { Toaster } from 'react-hot-toast';
import FloatingActions from './FloatingActions';

export default function Layout() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <FloatingActions />
      <Toaster position="bottom-right" />
    </div>
  );
}
