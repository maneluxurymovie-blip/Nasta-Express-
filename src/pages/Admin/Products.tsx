import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { db, storage, handleFirebaseError } from '../../lib/firebase';
import { Product, Category } from '../../types';
import { Plus, Edit2, Trash2, Package, X, Check, Image as ImageIcon, Loader2, Upload, Wand2, Sparkles } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    isAvailable: true,
    isPopular: false,
    isSpecial: false,
  });

  useEffect(() => {
    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (s) => 
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product)))
    );
    const unsubCategories = onSnapshot(collection(db, 'categories'), (s) => 
      setCategories(s.docs.map(d => ({ id: d.id, ...d.data() } as Category)))
    );
    return () => { unsubProducts(); unsubCategories(); };
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price.toString(),
        categoryId: editingProduct.categoryId,
        imageUrl: editingProduct.imageUrl,
        isAvailable: editingProduct.isAvailable,
        isPopular: editingProduct.isPopular || false,
        isSpecial: editingProduct.isSpecial || false,
      });
      setImagePreview(editingProduct.imageUrl);
      setSelectedFile(null);
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        imageUrl: '',
        isAvailable: true,
        isPopular: false,
        isSpecial: false,
      });
      setImagePreview('');
      setSelectedFile(null);
    }
  }, [editingProduct]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const storageRef = ref(storage, fileName);
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        }, 
        (error: any) => {
          console.error('Detailed Upload Error:', error);
          let message = 'An unexpected error occurred during upload.';
          
          if (error.code === 'storage/retry-limit-exceeded') {
            message = 'Upload timed out. This often happens if Firebase Storage is not enabled in the Console or your connection is weak. Please check if you have clicked "Get Started" in the Storage tab of the Firebase Console.';
          } else if (error.code === 'storage/unauthorized') {
            message = 'Unauthorized. Please ensure you are logged in as an admin and your Storage rules allow uploads.';
          } else if (error.code === 'storage/canceled') {
            message = 'Upload was canceled.';
          }
          
          reject(new Error(message));
        }, 
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (urlError: any) {
            reject(new Error('Failed to get download URL: ' + urlError.message));
          }
        }
      );
    });
  };

  const handleGenerateImage = async () => {
    if (!formData.name) return toast.error('Please enter a product name first to generate an image');
    
    setGeneratingImage(true);
    try {
      const prompt = `Professional food photography of ${formData.name}, ${formData.description}, high quality, appetizing, centered, studio lighting, plain background`;
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate image');

      setImagePreview(data.image);
      setFormData({ ...formData, imageUrl: data.image });
      setSelectedFile(null);
      toast.success('AI Image generated successfully!');
    } catch (error: any) {
      console.error('Generation Error:', error);
      toast.error(error.message || 'Failed to generate AI image. Please try again.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) return toast.error('Please select a category');
    
    setLoading(true);
    try {
      let finalImageUrl = formData.imageUrl;

      if (selectedFile) {
        setUploading(true);
        try {
          finalImageUrl = await uploadImage(selectedFile);
          toast.success('Image uploaded successfully');
        } catch (uploadError: any) {
          console.error('Upload Error Handle:', uploadError);
          toast.error(uploadError.message);
          setLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      if (!finalImageUrl) {
        toast.error('Product image is required');
        setLoading(false);
        return;
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        imageUrl: finalImageUrl,
        isAvailable: formData.isAvailable,
        isPopular: formData.isPopular,
        isSpecial: formData.isSpecial,
        updatedAt: serverTimestamp(),
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...productData,
          createdAt: editingProduct.createdAt // Keep original createdAt
        });
        toast.success('Product updated successfully');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
        });
        toast.success('Product saved successfully');
      }
      
      setIsModalOpen(false);
      setEditingProduct(null);
      setSelectedFile(null);
      setImagePreview('');
    } catch (error: any) {
      toast.error(handleFirebaseError(error, editingProduct ? 'updating product' : 'saving product'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted');
      setProductToDelete(null);
    } catch (error) {
      toast.error(handleFirebaseError(error, 'deleting product'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Products Management</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage your inventory, prices, and availability.</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-amber-700 transition-all active:scale-95 shadow-lg shadow-amber-100"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm flex flex-col group">
            <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-white shadow-sm transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setProductToDelete(product.id)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-red-500 hover:text-red-600 hover:bg-white shadow-sm transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  product.isAvailable ? 'bg-green-600 text-white shadow-lg' : 'bg-red-600 text-white shadow-lg'
                }`}>
                  {product.isAvailable ? 'Available' : 'Out of Stock'}
                </span>
                <div className="flex gap-2">
                  {product.isSpecial && (
                    <span className="px-2 py-1 bg-amber-500 text-white rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-sm">
                      Special
                    </span>
                  )}
                  {product.isPopular && (
                    <span className="px-2 py-1 bg-stone-900 text-white rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-sm">
                      Popular
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                {categories.find(c => c.id === product.categoryId)?.name || 'General'}
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">{product.name}</h3>
              <p className="text-neutral-500 text-xs line-clamp-2 mb-4">{product.description}</p>
              <div className="text-xl font-black text-neutral-900">{formatPrice(product.price)}</div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-neutral-200">
            <Package className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-500">No products listed yet.</p>
          </div>
        )}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Product Name</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-neutral-900 transition-all"
                      placeholder="e.g. Luxury Silk Tie"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Price (INR)</label>
                    <input
                      required
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-neutral-900 transition-all"
                      placeholder="e.g. 2500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Category</label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-neutral-900 transition-all"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase tracking-tighter">
                        Please create a category first in the Categories tab.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Settings</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          formData.isAvailable ? 'bg-green-600 text-white shadow-md shadow-green-100' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {formData.isAvailable ? 'Available' : 'Sold Out'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isSpecial: !formData.isSpecial })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          formData.isSpecial ? 'bg-amber-600 text-white shadow-md shadow-amber-100' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        Today's Special
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isPopular: !formData.isPopular })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          formData.isPopular ? 'bg-stone-900 text-white shadow-md shadow-stone-100' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        Popular
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Product Image</label>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="w-full sm:w-48 aspect-square bg-neutral-50 rounded-[32px] flex items-center justify-center overflow-hidden border-2 border-dashed border-neutral-200 group relative">
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <label className="cursor-pointer p-3 bg-white rounded-full text-neutral-900 shadow-xl hover:scale-110 transition-transform">
                              <Upload className="w-5 h-5" />
                              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFile(null);
                                setImagePreview('');
                                setFormData({ ...formData, imageUrl: '' });
                              }}
                              className="p-3 bg-red-600 rounded-full text-white shadow-xl hover:scale-110 transition-transform"
                              title="Remove Image"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <label className="cursor-pointer flex flex-col items-center gap-2 text-neutral-400 hover:text-amber-600 transition-colors">
                            <ImageIcon className="w-10 h-10" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Select Photo</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </label>
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-px h-4 bg-neutral-200" />
                            <button
                              type="button"
                              onClick={handleGenerateImage}
                              disabled={generatingImage}
                              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-50"
                            >
                              {generatingImage ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Wand2 className="w-3 h-3" />
                              )}
                              Generate with AI
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                          Select a high-quality photo from your gallery. Max size 5MB. 
                          JPG or PNG preferred.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Or Paste URL</label>
                        <input
                          type="url"
                          value={formData.imageUrl}
                          onChange={(e) => {
                            setFormData({ ...formData, imageUrl: e.target.value });
                            setImagePreview(e.target.value);
                          }}
                          className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-neutral-900 transition-all"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-neutral-900 transition-all resize-none"
                    placeholder="Provide details about the product..."
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={loading || uploading}
                    type="submit"
                    className="flex-[2] flex items-center justify-center gap-2 bg-amber-600 text-white py-4 px-6 rounded-2xl font-bold hover:bg-amber-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-amber-100"
                  >
                    {loading || uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{uploading ? 'Uploading...' : 'Saving...'}</span>
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-8 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Delete Product?</h2>
              <p className="text-neutral-500 text-sm mb-8">This action cannot be undone. Are you sure you want to remove this item?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(productToDelete)}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-100"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 bg-neutral-100 text-neutral-600 py-3 rounded-xl font-bold hover:bg-neutral-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
