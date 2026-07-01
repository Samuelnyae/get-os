import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BedDouble, Package, Users, MapPin, Brain } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';

const HIGHLIGHTS = [
  { icon: TrendingUp, label: 'Revenue', value: 'KES 2.4M', change: '+12.5%' },
  { icon: BedDouble, label: 'Occupancy', value: '87%', change: '+5%' },
  { icon: Package, label: 'Inventory', value: '248 items', change: '3 low' },
  { icon: Users, label: 'Customer LTV', value: 'KES 18K', change: '+8%' },
  { icon: MapPin, label: 'Demand Heatmap', value: 'Live', change: 'Active' },
  { icon: Brain, label: 'AI Insights', value: '14 active', change: 'Real-time' },
];

export default function AnalyticsSection() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Real-Time" highlight="Analytics" subtitle="Track every metric that matters, with AI insights that turn data into decisions." />

        <div className="grid lg:grid-cols-3 gap-6 mt-14">
          {/* Big chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 rounded-2xl luxury-border bg-[#111] p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-playfair text-xl text-white">Revenue Overview</p>
                <p className="font-inter text-xs text-white/40">Last 7 days</p>
              </div>
              <span className="font-inter text-sm text-green-400">▲ 12.5%</span>
            </div>
            <div className="flex items-end gap-3 h-48">
              {[45, 60, 50, 75, 65, 90, 85].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#c9a962]/20 to-[#c9a962]" style={{ height: `${h}%` }} />
                  <span className="font-inter text-xs text-white/30">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Highlight cards */}
          <div className="grid grid-cols-2 gap-4">
            {HIGHLIGHTS.map((h, i) => (
              <motion.div
                key={h.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl luxury-border bg-[#111] p-5"
              >
                <h.icon className="w-5 h-5 text-[#c9a962] mb-3" />
                <p className="font-inter text-xs text-white/40 mb-1">{h.label}</p>
                <p className="font-playfair text-lg text-white font-bold">{h.value}</p>
                <p className="font-inter text-xs text-green-400 mt-1">{h.change}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}