import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Heart, Clock, Truck, ShieldCheck, Award } from 'lucide-react';

export default function About() {
  const stats = [
    { icon: Utensils, label: 'Fresh Items', value: '25+' },
    { icon: Clock, label: 'Fast Delivery', value: '30 min' },
    { icon: Heart, label: 'Happy Customers', value: '5000+' },
    { icon: Award, label: 'Quality Award', value: 'Best Choice' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black text-stone-900 leading-tight"
        >
          Authentic Flavors, <br />
          <span className="text-amber-600">Pure Passion.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-stone-500 max-w-2xl mx-auto text-xl"
        >
          Founded in 2024, Nasta Express was born from a simple desire: to bring the authentic, comforting flavors of traditional Indian snacks to your doorstep with modern speed and hygiene.
        </motion.p>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-xl shadow-stone-100 text-center space-y-2"
          >
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4">
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-stone-900">{stat.value}</div>
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">{stat.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Our Mission */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-stone-900">Our Mission</h2>
            <p className="text-stone-500 leading-relaxed text-lg">
              We believe that breakfast and snacks shouldn't just be about convenience—they should be an experience. Every item we prepare is crafted using traditional recipes passed down through generations, combined with the freshest ingredients sourced from local farmers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900">Hygiene First</h4>
                <p className="text-sm text-stone-500">We follow strict safety protocols in our ISO-certified kitchens.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900">Always On Time</h4>
                <p className="text-sm text-stone-500">Our delivery team is trained to bring your food hot and fresh.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative aspect-square rounded-[40px] overflow-hidden shadow-2xl"
        >
          <img
            src="https://images.unsplash.com/photo-1596797038530-2c39da0a7aa3?auto=format&fit=crop&q=80&w=800"
            alt="Chef preparing snacks"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent" />
          <div className="absolute bottom-8 left-8">
            <div className="text-white font-black text-2xl">Crafted with Love</div>
            <div className="text-stone-300 text-sm font-medium">Inside our Nasta Express Kitchen</div>
          </div>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section className="bg-stone-900 rounded-[40px] p-12 md:p-24 text-center space-y-8 text-white">
        <h2 className="text-4xl md:text-5xl font-black">Got Questions?</h2>
        <p className="text-stone-400 max-w-xl mx-auto text-lg">
          Whether you're curious about our ingredients or want to place a bulk order for an event, we're here to help.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="tel:+919321014419"
            className="w-full sm:w-auto bg-white text-stone-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-stone-100 transition-all"
          >
            Call Us Now
          </a>
          <a
            href="https://wa.me/919321014419"
            className="w-full sm:w-auto bg-green-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-green-600 transition-all"
          >
            WhatsApp Message
          </a>
        </div>
      </section>
    </div>
  );
}
