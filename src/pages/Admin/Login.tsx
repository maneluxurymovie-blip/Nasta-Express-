import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { user, isAdmin, login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-neutral-100 text-center"
      >
        <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-200">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 mb-2">Admin Panel</h1>
        <p className="text-stone-500 mb-8 text-sm">
          Secure access for Nasta Express management.
        </p>

        {user && !isAdmin ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              Your account ({user.email}) is not authorized as an admin.
            </div>
            {user.email === 'maneluxurymovie@gmail.com' && (
              <button
                onClick={async () => {
                  try {
                    const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
                    const { db } = await import('../../lib/firebase');
                    await setDoc(doc(db, 'admins', user.uid), {
                      email: user.email,
                      createdAt: serverTimestamp()
                    });
                    window.location.reload();
                  } catch (err) {
                    console.error('Failed to provision admin:', err);
                  }
                }}
                className="w-full py-3 px-6 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
              >
                Initialize Admin Profile
              </button>
            )}
          </div>
        ) : null}

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-stone-900 text-white py-4 px-6 rounded-2xl font-bold hover:bg-stone-800 transition-all active:scale-[0.98] shadow-lg shadow-stone-200"
        >
          <LogIn className="w-5 h-5" />
          Authenticate Admin
        </button>
      </motion.div>
    </div>
  );
}
