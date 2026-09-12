import React, { useState } from 'react';
import { MessageCircle, Phone, X, Send, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function FloatingActions() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: 'Namaste! Welcome to Nasta Express. How can I help you today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const WHATSAPP_NUMBER = '919321014419';
  const CALL_NUMBER = '+919321014419';

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userText = message;
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'bot', text: data.reply || "I'm sorry, I couldn't process that. Please try again or contact us directly." }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'bot', text: "I'm offline right now, but you can message us on WhatsApp!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[320px] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden flex flex-col h-[500px]"
          >
            <div className="bg-stone-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-sm">Nasta Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/50">
              {chatHistory.map((chat, i) => (
                <div key={i} className={cn("flex", chat.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm",
                    chat.role === 'user' 
                      ? "bg-amber-600 text-white rounded-tr-none" 
                      : "bg-white text-stone-900 border border-stone-100 rounded-tl-none"
                  )}>
                    {chat.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-stone-100 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-stone-100 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about our menu..."
                className="flex-1 bg-stone-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
              />
              <button className="bg-stone-900 text-white p-3 rounded-xl hover:bg-stone-800 transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        {/* WhatsApp Button */}
        <motion.a
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-green-100 hover:bg-green-600 transition-colors"
        >
          <MessageCircle className="w-7 h-7" />
        </motion.a>

        {/* Call Button */}
        <motion.a
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          href={`tel:${CALL_NUMBER}`}
          className="w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100 hover:bg-blue-600 transition-colors"
        >
          <Phone className="w-7 h-7" />
        </motion.a>

        {/* Chat Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-amber-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-amber-100 hover:bg-amber-700 transition-colors"
        >
          {isChatOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
        </motion.button>
      </div>
    </div>
  );
}
