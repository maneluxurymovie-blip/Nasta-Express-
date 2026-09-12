import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirebaseError } from '../../lib/firebase';
import { Category } from '../../types';
import { Plus, Edit2, Trash2, Tag, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (s) => 
      setCategories(s.docs.map(d => ({ id: d.id, ...d.data() } as Category)))
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (editingCategory) setName(editingCategory.name);
    else setName('');
  }, [editingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    
    setLoading(true);
    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), { name: cleanName });
        toast.success('Category updated');
      } else {
        await addDoc(collection(db, 'categories'), { name: cleanName });
        toast.success('Category added');
      }
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      toast.error(handleFirebaseError(error, editingCategory ? 'updating category' : 'adding category'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This might affect products in this category.')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Category deleted');
    } catch (error) {
      toast.error(handleFirebaseError(error, 'deleting category'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Categories</h1>
          <p className="text-neutral-500 text-sm mt-1">Organize your products for easier browsing.</p>
        </div>
        <button
          onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-amber-700 transition-all active:scale-95 shadow-lg shadow-amber-100"
        >
          <Plus className="w-5 h-5" />
          New Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <motion.div
            layout
            key={cat.id}
            className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <Tag className="w-5 h-5" />
              </div>
              <span className="font-bold text-neutral-900">{cat.name}</span>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}
                className="p-2 hover:bg-neutral-50 rounded-lg text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-2 hover:bg-neutral-50 rounded-lg text-neutral-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-900">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Category Name</label>
                  <input
                    required
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-neutral-900 transition-all"
                    placeholder="e.g. Menswear"
                  />
                </div>

                <div className="pt-2 flex gap-4">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-4 px-6 rounded-2xl font-bold hover:bg-amber-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-amber-100"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
