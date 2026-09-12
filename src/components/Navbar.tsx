import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { ShoppingBag, LayoutDashboard, LogOut, LogIn, Menu, X, ShoppingCart, Award } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Cart from './Cart';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const isAdminPage = location.pathname.startsWith('/admin');

  const navLinks = [
    { name: 'Shop', href: '/', icon: ShoppingBag },
    { name: 'About', href: '/about', icon: Award },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: LayoutDashboard }] : []),
  ];

  return (
    <nav className="bg-white border-b border-neutral-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center mr-3 group-hover:rotate-12 transition-transform shadow-lg shadow-amber-200">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-stone-900">NASTA <span className="text-amber-600">EXPRESS</span></span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "text-amber-600 border-b-2 border-amber-600"
                    : "text-stone-500 hover:text-stone-900"
                )}
              >
                <link.icon className="w-4 h-4 mr-2" />
                {link.name}
              </Link>
            ))}

            {!isAdminPage && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-stone-500 hover:text-amber-600 transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <button
                onClick={() => logout()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            ) : (
              <Link
                to="/admin/login"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Admin Login
              </Link>
            )}
          </div>

          {/* Mobile buttons */}
          <div className="flex items-center gap-2 sm:hidden">
            {!isAdminPage && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-stone-500 hover:text-amber-600 transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-stone-400 hover:text-stone-500 hover:bg-stone-100 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-white border-b border-neutral-100 overflow-hidden"
          >
            <div className="pt-2 pb-3 space-y-1 px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-4 text-base font-medium rounded-lg",
                    location.pathname === link.href
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-50"
                  )}
                >
                  <link.icon className="w-5 h-5 mr-3" />
                  {link.name}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-4 text-base font-medium text-neutral-600 hover:bg-neutral-50 rounded-lg"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </button>
              ) : (
                <Link
                  to="/admin/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-3 py-4 text-base font-medium text-neutral-600 hover:bg-neutral-50 rounded-lg"
                >
                  <LogIn className="w-5 h-5 mr-3" />
                  Admin Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
