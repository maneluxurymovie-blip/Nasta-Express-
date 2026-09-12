import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category } from '../types';
import { formatPrice } from '../lib/utils';
import { motion } from 'framer-motion';
import { ShoppingCart, Filter, Loader2, ShoppingBag, Star, Flame, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  key?: string;
  product: Product;
  index: number;
  categories: Category[];
  addToCart: (product: Product) => void;
}

const ProductCard = ({ product, index, categories, addToCart }: ProductCardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    className="group bg-white rounded-3xl overflow-hidden border border-stone-100 hover:shadow-2xl transition-all duration-300 flex flex-col"
  >
    <div className="relative aspect-square overflow-hidden bg-stone-100">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {product.isSpecial && (
          <div className="bg-amber-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-amber-200">
            <Star className="w-3 h-3 fill-current" />
            Special
          </div>
        )}
        {product.isPopular && (
          <div className="bg-stone-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-stone-200">
            <Flame className="w-3 h-3 fill-current" />
            Popular
          </div>
        )}
      </div>
      {!product.isAvailable && (
        <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl transform -rotate-12 border border-stone-100">
            <span className="text-stone-900 font-black tracking-wider uppercase text-xs">
              Sold Out
            </span>
          </div>
        </div>
      )}
    </div>
    <div className="p-5 flex-1 flex flex-col">
      <div className="mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
          {categories.find(c => c.id === product.categoryId)?.name || 'General'}
        </span>
        <h3 className="text-lg font-bold text-stone-900 leading-tight mt-1 group-hover:text-amber-600 transition-colors">
          {product.name}
        </h3>
      </div>
      <p className="text-stone-500 text-sm line-clamp-2 mb-4 flex-1">
        {product.description}
      </p>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-50">
        <span className="text-xl font-black text-stone-900">
          {formatPrice(product.price)}
        </span>
        <button
          disabled={!product.isAvailable}
          onClick={() => addToCart(product)}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-md",
            product.isAvailable
              ? "bg-amber-600 text-white hover:bg-amber-700 active:scale-95 shadow-amber-100"
              : "bg-stone-100 text-stone-400 cursor-not-allowed shadow-none"
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          {product.isAvailable ? 'Add to Cart' : 'Sold Out'}
        </button>
      </div>
    </div>
  </motion.div>
);

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const catsSnap = await getDocs(collection(db, 'categories'));
      const fetchedCats = catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(fetchedCats);

      const productsSnap = await getDocs(collection(db, 'products'));
      const fetchedProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      fetchedProducts.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
        return timeB - timeA;
      });
      
      setProducts(fetchedProducts);
      console.log("DEBUG: Fetched", fetchedProducts.length, "products via getDocs");
    } catch (error) {
      console.error("DEBUG: Fetch error:", error);
      toast.error("Failed to load menu. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    
    // Also keep real-time listeners but with more logging
    const unsubscribeCats = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        console.log("DEBUG: Categories Snapshot Size:", snapshot.size);
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      },
      (error) => console.error("DEBUG: Categories listener error:", error)
    );

    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        console.log("DEBUG: Products Snapshot Size:", snapshot.size);
        const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        fetchedProducts.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
          return timeB - timeA;
        });
        setProducts(fetchedProducts);
      },
      (error) => console.error("DEBUG: Products listener error:", error)
    );

    return () => {
      unsubscribeCats();
      unsubscribeProducts();
    };
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const specialProducts = products.filter(p => p.isSpecial && p.isAvailable);
  const popularProducts = products.filter(p => p.isPopular && p.isAvailable);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Hero Section */}
      <div className="text-center pt-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black text-stone-900 mb-6 leading-tight"
        >
          Freshly Prepared <br />
          <span className="text-amber-600">Nasta Express</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-stone-500 max-w-2xl mx-auto text-xl mb-12"
        >
          Experience authentic flavors delivered hot to your doorstep. <br className="hidden md:block" /> Traditional recipes, premium quality.
        </motion.p>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto relative group"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
          <input
            type="text"
            placeholder="Search for Poha, Samosa, Chai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-stone-900 shadow-xl shadow-stone-100 focus:ring-2 focus:ring-amber-600 outline-none transition-all"
          />
        </motion.div>
      </div>

      {/* Today's Special */}
      {specialProducts.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-100">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tight">Today's Special</h2>
              <p className="text-stone-400 text-sm">Chef's recommended highlights for today.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {specialProducts.map((p, i) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                index={i} 
                categories={categories} 
                addToCart={addToCart} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Main Catalog */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-stone-200">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tight">Full Menu</h2>
              <p className="text-stone-400 text-sm">Browse our complete collection of snacks.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm",
                selectedCategory === null
                  ? "bg-amber-600 text-white shadow-amber-100"
                  : "bg-white text-stone-400 hover:bg-stone-100"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm",
                  selectedCategory === cat.id
                    ? "bg-amber-600 text-white shadow-amber-100"
                    : "bg-white text-stone-400 hover:bg-stone-100"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((p, index) => (
            <ProductCard 
              key={p.id} 
              product={p} 
              index={index} 
              categories={categories} 
              addToCart={addToCart} 
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-stone-200">
            <ShoppingBag className="w-16 h-16 text-stone-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-stone-900">No products found</h3>
            <p className="text-stone-400 text-sm mt-1 mb-6">We're cooking up something new. Check back soon!</p>
            <button
              onClick={fetchMenu}
              className="px-6 py-2 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-all"
            >
              Try Reloading Menu
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

