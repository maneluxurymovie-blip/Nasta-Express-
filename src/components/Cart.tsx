import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Minus, Plus, Trash2, Send, Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPrice, getWhatsAppUrl } from '../lib/utils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export default function Cart({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isOrdering, setIsOrdering] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });

  const WHATSAPP_NUMBER = '+919321014419';

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!customer.name || !customer.phone || !customer.address) return toast.error('Please provide all details');

    setIsOrdering(true);
    try {
      // 1. Save order to Firestore
      const orderData = {
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount,
        status: 'New',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);

      // 2. Prepare WhatsApp Message
      const itemsList = items.map(item => 
        `• ${item.name} (x${item.quantity}) - ${formatPrice(item.price * item.quantity)}`
      ).join('\n');

      const message = `*NEW ORDER - NASTA EXPRESS*\n\n` +
        `*Customer:* ${customer.name}\n` +
        `*Phone:* ${customer.phone}\n` +
        `*Address:* ${customer.address}\n\n` +
        `*Items:*\n${itemsList}\n\n` +
        `*Total:* ${formatPrice(totalAmount)}\n\n` +
        `Please confirm my order!`;

      // 3. Clear Cart & Redirect
      clearCart();
      onClose();
      window.open(`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(message)}`, '_blank');
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to process order. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Your Cart</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4 text-stone-200">
                    <ShoppingCart className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">Your cart is empty</h3>
                  <p className="text-stone-400 text-sm mt-1">Add some delicious Nasta to get started!</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.productId} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-stone-900 leading-tight">{item.name}</h4>
                        <button 
                          onClick={() => removeFromCart(item.productId)}
                          className="text-stone-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-amber-600 font-black text-sm mb-3">{formatPrice(item.price)}</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-stone-900 w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-stone-100 bg-stone-50/50 space-y-6">
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Your Name</label>
                    <input
                      required
                      type="text"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full bg-white border-stone-100 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-amber-600 transition-all outline-none"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input
                      required
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full bg-white border-stone-100 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-amber-600 transition-all outline-none"
                      placeholder="e.g. 9321014419"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Delivery Address</label>
                    <textarea
                      required
                      rows={2}
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      className="w-full bg-white border-stone-100 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-amber-600 transition-all outline-none resize-none"
                      placeholder="Enter your full address"
                    />
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Total Amount</span>
                      <span className="text-2xl font-black text-stone-900">{formatPrice(totalAmount)}</span>
                    </div>
                    <button
                      disabled={isOrdering}
                      type="submit"
                      className="w-full flex items-center justify-center gap-3 bg-stone-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-stone-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-stone-200"
                    >
                      {isOrdering ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Order via WhatsApp
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
