import React from 'react';
import { motion } from 'framer-motion';
import { Hotel, Utensils, Coffee, Tent, Palmtree, Wine, Cake, PartyPopper } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';

const INDUSTRIES = [
  { icon: Hotel, name: 'Hotels' },
  { icon: Utensils, name: 'Restaurants' },
  { icon: Coffee, name: 'Cafés' },
  { icon: Tent, name: 'Lodges' },
  { icon: Palmtree, name: 'Resorts' },
  { icon: Wine, name: 'Bars' },
  { icon: Cake, name: 'Bakeries' },
  { icon: PartyPopper, name: 'Event Venues' },
];

export default function IndustriesSection() {
  return (
    <section className="py-24 bg-[#0c0c0c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Built for Every" highlight="Industry" subtitle="Whether you run a single café or a multi-property resort group, Hospitality OS adapts to you." />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14">
          {INDUSTRIES.map((ind, i) => (
            <motion.div
              key={ind.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group rounded-2xl luxury-border bg-[#111] p-8 text-center hover:bg-[#161616] hover:border-[#c9a962]/40 transition-all duration-300 cursor-pointer"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#c9a962]/10 group-hover:bg-[#c9a962]/20 transition-colors mb-4">
                <ind.icon className="w-7 h-7 text-[#c9a962]" />
              </div>
              <p className="font-playfair text-lg text-white">{ind.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}