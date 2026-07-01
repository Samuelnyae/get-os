import React from 'react';
import { motion } from 'framer-motion';
import { Building2, UserPlus, Settings, Utensils, TrendingUp } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';

const STEPS = [
  { icon: Building2, title: 'Create your business', desc: 'Set up your organization in minutes with our guided onboarding.' },
  { icon: UserPlus, title: 'Invite your team', desc: 'Add staff members and assign roles with a few clicks.' },
  { icon: Settings, title: 'Configure your modules', desc: 'Enable the features you need — POS, inventory, HR, and more.' },
  { icon: Utensils, title: 'Start serving customers', desc: 'Go live with orders, reservations, and bookings from day one.' },
  { icon: TrendingUp, title: 'Grow with AI', desc: 'Let AI insights optimize your operations and boost revenue.' },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="How" highlight="It Works" subtitle="From signup to serving customers in five simple steps." />

        <div className="relative mt-14">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a962]/30 to-transparent" />

          <div className="grid lg:grid-cols-5 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative text-center"
              >
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full luxury-border bg-[#111] mx-auto mb-5">
                  <step.icon className="w-8 h-8 text-[#c9a962]" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-[#c9a962] to-[#e4d5a7] text-[#0a0a0a] font-inter text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-playfair text-lg text-white mb-2">{step.title}</h3>
                <p className="font-inter text-sm text-white/50 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}