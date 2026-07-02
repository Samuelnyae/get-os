import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,169,98,0.08),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full luxury-border bg-[#c9a962]/5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#c9a962]" />
              <span className="font-inter text-xs tracking-wider text-[#c9a962] uppercase">AI-Powered Hospitality Platform</span>
            </div>

            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              The All-in-One <br />
              <span className="gold-gradient">Hospitality Operating System</span>
            </h1>

            <p className="font-inter text-lg text-white/60 leading-relaxed mb-8 max-w-xl">
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

            <div className="flex items-center gap-6 mt-8 pt-8 border-t border-white/5">
              <div>
                <p className="font-playfair text-2xl gold-gradient font-bold">14+</p>
                <p className="font-inter text-xs text-white/40">Integrated Modules</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="font-playfair text-2xl gold-gradient font-bold">8+</p>
                <p className="font-inter text-xs text-white/40">Industries Served</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="font-playfair text-2xl gold-gradient font-bold">AI</p>
                <p className="font-inter text-xs text-white/40">Built-in Automation</p>
              </div>
            </div>
          </motion.div>

          {/* Right: Product Showcase with Zoom Animation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative grid grid-cols-2 gap-4">
              {/* Phone ordering — large, spans two rows */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="row-span-2 relative rounded-2xl overflow-hidden luxury-border shadow-[0_0_60px_rgba(201,169,98,0.15)] group"
              >
                <motion.img
                  src="https://media.base44.com/images/public/6a3bb63c5d638ed13971e566/100f487b4_generated_image.png"
                  alt="Phone ordering at restaurant"
                  className="w-full h-full object-cover"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent p-4">
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">QR Ordering</p>
                  <p className="font-playfair text-sm text-white">Guests order from their phone</p>
                </div>
              </motion.div>

              {/* POS Dashboard */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="relative rounded-2xl overflow-hidden luxury-border shadow-[0_0_40px_rgba(201,169,98,0.1)] group"
              >
                <motion.img
                  src="https://media.base44.com/images/public/6a3bb63c5d638ed13971e566/ac2040fa0_generated_image.png"
                  alt="POS system dashboard"
                  className="w-full h-full object-cover"
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent p-3">
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-0.5">POS Dashboard</p>
                  <p className="font-playfair text-xs text-white">Real-time operations</p>
                </div>
              </motion.div>

              {/* AI Forecast & Automations */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="relative rounded-2xl overflow-hidden luxury-border shadow-[0_0_40px_rgba(201,169,98,0.1)] group"
              >
                <motion.img
                  src="https://media.base44.com/images/public/6a3bb63c5d638ed13971e566/8b634f29e_generated_image.png"
                  alt="AI automations and revenue forecast"
                  className="w-full h-full object-cover"
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent p-3">
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-0.5">AI & Automations</p>
                  <p className="font-playfair text-xs text-white">Revenue forecasting</p>
                </div>
              </motion.div>
            </div>

            {/* Floating accents */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[#c9a962]/10 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-[#c9a962]/5 blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}