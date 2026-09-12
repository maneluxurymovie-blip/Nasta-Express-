import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { formatPrice } from '../../lib/utils';
import { ShoppingBag, ChevronDown, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (s) => {
      setOrders(s.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      toast.success(`Order marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Orders</h1>
        <p className="text-neutral-500 text-sm mt-1">Manage customer orders and update their fulfillment status.</p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-neutral-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-100">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Order ID</div>
                  <div className="font-mono text-xs text-neutral-600">#{order.id.slice(0, 8)}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Date</div>
                  <div className="text-sm font-medium">{order.createdAt?.toDate().toLocaleString()}</div>
                </div>
                <div className="h-8 w-px bg-neutral-100 mx-2 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value as Order['status'])}
                    className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-amber-600 transition-all cursor-pointer shadow-sm ${
                      order.status === 'New' ? 'bg-blue-600 text-white shadow-blue-100' :
                      order.status === 'Confirmed' ? 'bg-amber-600 text-white shadow-amber-100' :
                      order.status === 'Preparing' ? 'bg-indigo-600 text-white shadow-indigo-100' :
                      order.status === 'Out for Delivery' ? 'bg-purple-600 text-white shadow-purple-100' :
                      order.status === 'Delivered' ? 'bg-green-600 text-white shadow-green-100' :
                      'bg-stone-200 text-stone-600'
                    }`}
                  >
                    <option value="New">New</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  Order Items
                </div>
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-stone-50/50 rounded-2xl border border-stone-100 group hover:border-amber-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl border border-stone-100 flex items-center justify-center font-black text-stone-900 shadow-sm">
                        {item.quantity}x
                      </div>
                      <div>
                        <div className="font-bold text-stone-900">{item.name}</div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{formatPrice(item.price)} each</div>
                      </div>
                    </div>
                    <div className="font-black text-stone-900">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="bg-stone-900 rounded-[32px] p-8 h-fit text-white shadow-2xl shadow-stone-200">
                <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Customer Details</div>
                <div className="space-y-6">
                  <div>
                    <div className="text-[10px] text-stone-500 uppercase font-black tracking-widest mb-1">Name</div>
                    <div className="text-lg font-bold">{order.customerName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-500 uppercase font-black tracking-widest mb-1">Phone</div>
                    <div className="text-lg font-bold">{order.customerPhone}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-500 uppercase font-black tracking-widest mb-1">Address</div>
                    <div className="text-sm font-medium text-stone-300 leading-relaxed">{order.customerAddress}</div>
                  </div>
                  <div className="pt-6 border-t border-stone-800">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Subtotal</span>
                      <span className="font-bold text-stone-300">{formatPrice(order.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-stone-400 uppercase tracking-widest">Total</span>
                      <span className="text-3xl font-black text-amber-500">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-neutral-200">
            <ShoppingBag className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-500">No orders received yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
