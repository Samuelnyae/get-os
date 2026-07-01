import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, TrendingUp, Calendar, BedDouble, Package, Sparkles } from 'lucide-react';

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

          {/* Right: Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl luxury-border bg-[#111] p-6 shadow-[0_0_60px_rgba(201,169,98,0.1)]">
              {/* Mock header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-inter text-xs text-white/40">Good Morning</p>
                  <p className="font-playfair text-lg text-white">Dashboard Overview</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <div className="w-2 h-2 rounded-full bg-[#c9a962]" />
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-[#1a1a1a] p-4 luxury-border">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-4 h-4 text-[#c9a962]" />
                    <span className="font-inter text-xs text-green-400">+12.5%</span>
                  </div>
                  <p className="font-playfair text-xl text-white font-bold">KES 847K</p>
                  <p className="font-inter text-xs text-white/40">Today's Revenue</p>
                </div>
                <div className="rounded-xl bg-[#1a1a1a] p-4 luxury-border">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-4 h-4 text-[#c9a962]" />
                    <span className="font-inter text-xs text-green-400">+8</span>
                  </div>
                  <p className="font-playfair text-xl text-white font-bold">142</p>
                  <p className="font-inter text-xs text-white/40">Reservations</p>
                </div>
                <div className="rounded-xl bg-[#1a1a1a] p-4 luxury-border">
                  <div className="flex items-center justify-between mb-2">
                    <BedDouble className="w-4 h-4 text-[#c9a962]" />
                    <span className="font-inter text-xs text-green-400">87%</span>
                  </div>
                  <p className="font-playfair text-xl text-white font-bold">26/30</p>
                  <p className="font-inter text-xs text-white/40">Rooms Occupied</p>
                </div>
                <div className="rounded-xl bg-[#1a1a1a] p-4 luxury-border">
                  <div className="flex items-center justify-between mb-2">
                    <Package className="w-4 h-4 text-[#c9a962]" />
                    <span className="font-inter text-xs text-red-400">3 Low</span>
                  </div>
                  <p className="font-playfair text-xl text-white font-bold">248</p>
                  <p className="font-inter text-xs text-white/40">Inventory Items</p>
                </div>
              </div>

              {/* AI insight bar */}
              <div className="rounded-xl bg-gradient-to-r from-[#c9a962]/10 to-transparent p-4 luxury-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#c9a962]/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#c9a962]" />
                </div>
                <div>
                  <p className="font-inter text-xs text-[#c9a962] font-medium">AI Insight</p>
                  <p className="font-inter text-xs text-white/60">Restock tomatoes by Thursday — demand spike predicted</p>
                </div>
              </div>
            </div>

            {/* Floating accent */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[#c9a962]/10 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-[#c9a962]/5 blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}