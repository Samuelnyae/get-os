import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, BedDouble, Package, BarChart3, Brain } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';

const TABS = [
  { id: 'restaurant', label: 'Restaurant', icon: Utensils },
  { id: 'hotel', label: 'Hotel', icon: BedDouble },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'ai', label: 'AI', icon: Brain },
];

function MockRestaurant() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2 rounded-xl bg-[#1a1a1a] p-4 luxury-border">
        <p className="font-inter text-xs text-white/40 mb-3">Live Orders</p>
        <div className="space-y-2">
          {['Table 7 — Grilled Salmon', 'Table 12 — Margherita Pizza', 'Takeaway — Burger Combo', 'Table 3 — Caesar Salad'].map((order, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-[#222] px-3 py-2">
              <span className="font-inter text-xs text-white/70">{order}</span>
              <span className={`font-inter text-xs px-2 py-0.5 rounded-full ${i < 2 ? 'bg-green-500/20 text-green-400' : 'bg-[#c9a962]/20 text-[#c9a962]'}`}>
                {i < 2 ? 'Ready' : 'Preparing'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-[#1a1a1a] p-4 luxury-border">
        <p className="font-inter text-xs text-white/40 mb-3">Today's Stats</p>
        <div className="space-y-3">
          <div><p className="font-playfair text-lg text-white">87</p><p className="font-inter text-xs text-white/40">Orders</p></div>
          <div><p className="font-playfair text-lg text-[#c9a962]">KES 34K</p><p className="font-inter text-xs text-white/40">Revenue</p></div>
          <div><p className="font-playfair text-lg text-white">12 min</p><p className="font-inter text-xs text-white/40">Avg Prep</p></div>
        </div>
      </div>
    </div>
  );
}

function MockHotel() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {['101', '102', '103', '104', '201', '202', '203', '204'].map((room, i) => (
        <div key={room} className={`rounded-xl p-4 luxury-border ${i % 3 === 0 ? 'bg-green-500/10' : i % 3 === 1 ? 'bg-[#c9a962]/10' : 'bg-[#1a1a1a]'}`}>
          <p className="font-playfair text-lg text-white mb-1">{room}</p>
          <p className={`font-inter text-xs ${i % 3 === 0 ? 'text-green-400' : i % 3 === 1 ? 'text-[#c9a962]' : 'text-white/40'}`}>
            {i % 3 === 0 ? 'Available' : i % 3 === 1 ? 'Occupied' : 'Cleaning'}
          </p>
        </div>
      ))}
    </div>
  );
}

function MockInventory() {
  return (
    <div className="space-y-2">
      {[
        { name: 'Tomatoes', level: 85, status: 'good' },
        { name: 'Chicken Breast', level: 62, status: 'ok' },
        { name: 'Cooking Oil', level: 18, status: 'low' },
        { name: 'Rice', level: 45, status: 'ok' },
        { name: 'Beef Fillet', level: 8, status: 'critical' },
      ].map((item) => (
        <div key={item.name} className="flex items-center gap-4 rounded-lg bg-[#1a1a1a] px-4 py-3">
          <span className="font-inter text-sm text-white/70 w-32">{item.name}</span>
          <div className="flex-1 h-2 rounded-full bg-[#222] overflow-hidden">
            <div
              className={`h-full rounded-full ${item.status === 'good' ? 'bg-green-400' : item.status === 'low' ? 'bg-orange-400' : item.status === 'critical' ? 'bg-red-400' : 'bg-[#c9a962]'}`}
              style={{ width: `${item.level}%` }}
            />
          </div>
          <span className="font-inter text-xs text-white/40 w-10 text-right">{item.level}%</span>
        </div>
      ))}
    </div>
  );
}

function MockAnalytics() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-[#1a1a1a] p-4 luxury-border">
        <p className="font-inter text-xs text-white/40 mb-3">Weekly Revenue</p>
        <div className="flex items-end gap-2 h-32">
          {[60, 45, 75, 50, 90, 70, 85].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#c9a962]/30 to-[#c9a962]" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-[#1a1a1a] p-4 luxury-border">
        <p className="font-inter text-xs text-white/40 mb-3">Top Metrics</p>
        <div className="space-y-3">
          <div className="flex justify-between"><span className="font-inter text-xs text-white/50">Avg Order Value</span><span className="font-inter text-xs text-[#c9a962]">KES 1,240</span></div>
          <div className="flex justify-between"><span className="font-inter text-xs text-white/50">Occupancy Rate</span><span className="font-inter text-xs text-[#c9a962]">87%</span></div>
          <div className="flex justify-between"><span className="font-inter text-xs text-white/50">Repeat Guests</span><span className="font-inter text-xs text-[#c9a962]">42%</span></div>
          <div className="flex justify-between"><span className="font-inter text-xs text-white/50">Revenue Growth</span><span className="font-inter text-xs text-green-400">+12.5%</span></div>
        </div>
      </div>
    </div>
  );
}

function MockAI() {
  return (
    <div className="space-y-3">
      {[
        { icon: '📈', title: 'Revenue Forecast', text: 'Weekend revenue projected to increase 18% — staff up by 2 servers.' },
        { icon: '📦', title: 'Inventory Prediction', text: 'Restock tomatoes and chicken by Thursday based on demand patterns.' },
        { icon: '❤️', title: 'Guest Insights', text: 'NPS score improved to 72. Top request: faster room service.' },
      ].map((insight) => (
        <div key={insight.title} className="rounded-xl bg-[#1a1a1a] p-4 luxury-border flex items-start gap-4">
          <span className="text-2xl">{insight.icon}</span>
          <div>
            <p className="font-inter text-sm text-[#c9a962] font-medium mb-1">{insight.title}</p>
            <p className="font-inter text-xs text-white/50">{insight.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const MOCKS = {
  restaurant: MockRestaurant,
  hotel: MockHotel,
  inventory: MockInventory,
  analytics: MockAnalytics,
  ai: MockAI,
};

export default function DashboardShowcaseSection() {
  const [active, setActive] = useState('restaurant');
  const Mock = MOCKS[active];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Dashboard" highlight="Showcase" subtitle="One unified dashboard for every aspect of your hospitality business." />

        <div className="flex flex-wrap justify-center gap-2 mt-12 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-inter text-sm transition-all duration-300 ${
                active === tab.id
                  ? 'bg-gradient-to-r from-[#c9a962] to-[#e4d5a7] text-[#0a0a0a] font-semibold'
                  : 'luxury-border text-white/60 hover:text-[#c9a962]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl luxury-border bg-[#111] p-6 shadow-[0_0_60px_rgba(201,169,98,0.05)]"
        >
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-[#c9a962]/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
            </div>
            <span className="font-inter text-xs text-white/30 ml-3">hospitality-os.com/dashboard</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Mock />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}