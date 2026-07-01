import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Package, Utensils, Megaphone, Users, Heart, Sparkles } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';

const AI_CARDS = [
  { icon: LineChart, title: 'Revenue Forecasting', desc: 'Predict daily, weekly, and seasonal revenue with AI-driven models.' },
  { icon: Package, title: 'Inventory Prediction', desc: 'Never run dry — AI predicts stock needs before shortages happen.' },
  { icon: Utensils, title: 'Menu Optimization', desc: 'Identify high-margin items and optimize your menu for profitability.' },
  { icon: Megaphone, title: 'Marketing Assistant', desc: 'Auto-generate campaigns tailored to your guest segments.' },
  { icon: Users, title: 'Workforce Optimization', desc: 'Smart shift scheduling based on predicted demand patterns.' },
  { icon: Heart, title: 'Guest Insights', desc: 'Understand guest sentiment and act on feedback in real time.' },
];

export default function HospitalityAISection() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#0c0c0c]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,98,0.06),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full luxury-border bg-[#c9a962]/5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#c9a962]" />
            <span className="font-inter text-xs tracking-wider text-[#c9a962] uppercase">Artificial Intelligence</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold mb-4">
            Meet your <span className="gold-gradient">AI Business Assistant</span>
          </h2>
          <p className="font-inter text-white/50 max-w-2xl mx-auto">
            Let AI handle the busywork. From forecasting to feedback, your intelligent assistant works 24/7 to keep your business ahead.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {AI_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative rounded-2xl luxury-border bg-[#111] p-8 hover:border-[#c9a962]/40 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#c9a962]/5 blur-2xl group-hover:bg-[#c9a962]/10 transition-colors" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a962]/20 to-[#c9a962]/5 flex items-center justify-center mb-5">
                  <card.icon className="w-6 h-6 text-[#c9a962]" />
                </div>
                <h3 className="font-playfair text-xl text-white mb-2">{card.title}</h3>
                <p className="font-inter text-sm text-white/50 leading-relaxed">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}