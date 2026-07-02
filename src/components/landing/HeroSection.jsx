import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';

const HERO_IMAGES = [
  {
    src: 'https://media.base44.com/images/public/6a3bb63c5d638ed13971e566/100f487b4_generated_image.png',
    label: 'QR Ordering',
    caption: 'Guests order from their phone',
  },
  {
    src: 'https://media.base44.com/images/public/6a3bb63c5d638ed13971e566/ac2040fa0_generated_image.png',
    label: 'POS Dashboard',
    caption: 'Real-time operations',
  },
  {
    src: 'https://media.base44.com/images/public/6a3bb63c5d638ed13971e566/8b634f29e_generated_image.png',
    label: 'AI & Automations',
    caption: 'Revenue forecasting',
  },
];

export default function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Full-bleed zoom carousel background */}
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <motion.img
              src={HERO_IMAGES[activeIdx].src}
              alt={HERO_IMAGES[activeIdx].caption}
              className="w-full h-full object-cover"
              initial={{ scale: 1 }}
              animate={{ scale: 1.15 }}
              transition={{ duration: 4, ease: "easeOut" }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a]/95 via-[#0a0a0a]/80 to-[#0a0a0a]/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/40" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full luxury-border bg-[#c9a962]/5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#c9a962]" />
            <span className="font-inter text-xs tracking-wider text-[#c9a962] uppercase">AI-Powered Hospitality Platform</span>
          </div>

          <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            The All-in-One <br />
            <span className="gold-gradient">Hospitality Operating System</span>
          </h1>

          <p className="font-inter text-lg text-white/70 leading-relaxed mb-8 max-w-xl">
            Manage your hotel, restaurant, lodge, café, or resort from a single cloud platform.
            Streamline operations, automate workflows with AI, and grow your business with real-time insights.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#c9a962] to-[#e4d5a7] text-[#0a0a0a] font-inter font-semibold rounded-full hover:shadow-[0_0_30px_rgba(201,169,98,0.4)] transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="inline-flex items-center gap-2 px-7 py-3.5 luxury-border text-white font-inter font-medium rounded-full hover:bg-[#c9a962]/10 transition-all duration-300">
              <Play className="w-4 h-4 text-[#c9a962]" />
              Book a Demo
            </button>
          </div>

        </motion.div>
      </div>

      {/* Caption + dots — bottom right */}
      <div className="absolute bottom-8 right-4 sm:right-8 z-10 text-right">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">
              {HERO_IMAGES[activeIdx].label}
            </p>
            <p className="font-playfair text-lg text-white">
              {HERO_IMAGES[activeIdx].caption}
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-2 justify-end mt-3">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIdx ? 'w-6 bg-[#c9a962]' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}