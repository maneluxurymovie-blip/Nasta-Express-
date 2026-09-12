import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, Category, Order } from '../../types';
import { Package, Tag, ShoppingCart, TrendingUp, ArrowUpRight, Database, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPrice } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { seedMenu } from '../../lib/seed';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product))),
      (e) => console.error("Admin products error:", e)
    );
    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() } as Category))),
      (e) => console.error("Admin categories error:", e)
    );
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() } as Order))),
      (e) => console.error("Admin orders error:", e)
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubOrders();
    };
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const count = await seedMenu();
      toast.success(`Successfully added ${count} new items to the menu!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to populate menu items.');
    } finally {
      setIsSeeding(false);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const activeProducts = products.filter(p => p.isAvailable).length;

  const stats = [
    { name: 'Total Revenue', value: formatPrice(totalRevenue), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'text-stone-600', bg: 'bg-stone-50' },
    { name: 'Active Products', value: activeProducts, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Categories', value: categories.length, icon: Tag, color: 'text-stone-600', bg: 'bg-stone-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h1>
          <p className="text-neutral-500 text-sm mt-1">Monitor your store's performance and manage your inventory.</p>
        </div>
        <button
          onClick={handleSeed}
          disabled={isSeeding}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-stone-800 transition-all disabled:opacity-50 shadow-lg shadow-stone-100"
        >
          <Database className="w-5 h-5" />
          {isSeeding ? 'Adding Menu Items...' : 'Populate All Menu Items'}
        </button>
      </div>

      {/* Storage Fix Instruction */}
      <div className="mb-8 bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4 items-start shadow-sm">
        <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-amber-900">Important: Fix "Upload Timeout" Error</h2>
          <p className="text-amber-800 text-sm mt-1 max-w-2xl leading-relaxed">
            If you are seeing errors when uploading photos, you must go to the <strong>Firebase Console</strong>, 
            click on the <strong>Storage</strong> tab, and click the <strong>"Get Started"</strong> button. 
            Your photo uploads will not work until this is enabled.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-neutral-500">{stat.name}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-50 flex items-center justify-between">
            <h2 className="font-bold text-neutral-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm font-bold text-neutral-400 hover:text-neutral-900 transition-colors">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900">{order.customerName}</div>
                      <div className="text-xs text-neutral-400">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-neutral-900">{formatPrice(order.totalAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'New' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'Confirmed' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'Preparing' ? 'bg-indigo-100 text-indigo-700' :
                        order.status === 'Out for Delivery' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {order.createdAt?.toDate().toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-neutral-400 text-sm italic">
                      No orders placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden h-fit">
          <div className="p-6 border-b border-neutral-50 flex items-center justify-between">
            <h2 className="font-bold text-neutral-900">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2">
            <Link to="/admin/products" className="flex items-center gap-3 p-4 rounded-2xl hover:bg-stone-50 transition-colors group">
              <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white group-hover:bg-amber-600 transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-stone-900">Add New Product</div>
                <div className="text-xs text-stone-400 mt-0.5">List a new item in your store</div>
              </div>
              <ArrowUpRight className="w-4 h-4 ml-auto text-stone-300" />
            </Link>
            <Link to="/admin/categories" className="flex items-center gap-3 p-4 rounded-2xl hover:bg-stone-50 transition-colors group">
              <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-900 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-stone-900">Manage Categories</div>
                <div className="text-xs text-stone-400 mt-0.5">Organize your product catalog</div>
              </div>
              <ArrowUpRight className="w-4 h-4 ml-auto text-stone-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
