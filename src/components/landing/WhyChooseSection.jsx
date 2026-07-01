import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Bot, TrendingUp, Building2, Cloud, ShieldCheck } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';

const FEATURES = [
  { icon: Zap, title: 'Faster Operations', desc: 'Manage orders, reservations, staff, and inventory in one place.' },
  { icon: Bot, title: 'AI Automation', desc: 'Automate inventory, marketing, forecasting, and guest feedback.' },
  { icon: TrendingUp, title: 'Business Intelligence', desc: 'Make smarter decisions with real-time analytics.' },
  { icon: Building2, title: 'Built for Hospitality', desc: 'Designed specifically for hotels, restaurants, cafés, lodges, and resorts.' },
  { icon: Cloud, title: 'Cloud Based', desc: 'Access your business securely from anywhere, on any device.' },
  { icon: ShieldCheck, title: 'Enterprise Security', desc: 'Secure, reliable, and scalable for businesses of any size.' },
];

export default function WhyChooseSection() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Why Choose" highlight="Hospitality OS" subtitle="Everything you need to run and grow your hospitality business — unified in one platform." />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group rounded-2xl luxury-border bg-[#111] p-8 hover:bg-[#161616] hover:border-[#c9a962]/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#c9a962]/10 flex items-center justify-center mb-5 group-hover:bg-[#c9a962]/20 transition-colors">
                <feature.icon className="w-6 h-6 text-[#c9a962]" />
              </div>
              <h3 className="font-playfair text-xl text-white mb-2">{feature.title}</h3>
              <p className="font-inter text-sm text-white/50 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}