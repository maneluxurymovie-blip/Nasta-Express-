import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProducts from './pages/Admin/Products';
import AdminCategories from './pages/Admin/Categories';
import AdminOrders from './pages/Admin/Orders';
import { Loader2, ShieldCheck } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import React from 'react';
import { toast } from 'react-hot-toast';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

function AdminInit() {
  const { user, isAdmin, loading } = useAuth();
  const [isInitializing, setIsInitializing] = React.useState(false);

  const claimAdmin = async () => {
    if (!user) return;
    setIsInitializing(true);
    try {
      await setDoc(doc(db, 'admins', user.uid), {
        email: user.email,
        claimedAt: new Date().toISOString(),
      });
      toast.success('Admin status activated! Please refresh.');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to activate admin status.');
      console.error(error);
    } finally {
      setIsInitializing(false);
    }
  };

  if (loading) return null;
  if (!user || isAdmin) return null;
  if (user.email !== 'maneluxurymovie@gmail.com') return null;

  return (
    <div className="bg-stone-900 text-white p-4 flex items-center justify-between border-b border-stone-800">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400" />
        <span className="text-sm font-medium">Nasta Express Owner account detected. Activate your dashboard.</span>
      </div>
      <button
        onClick={claimAdmin}
        disabled={isInitializing}
        className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors disabled:opacity-50"
      >
        {isInitializing ? 'Activating...' : 'Activate Admin'}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AdminInit />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              
              {/* Admin Routes */}
              <Route path="admin/login" element={<AdminLogin />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/products"
                element={
                  <ProtectedRoute>
                    <AdminProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/categories"
                element={
                  <ProtectedRoute>
                    <AdminCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/orders"
                element={
                  <ProtectedRoute>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
