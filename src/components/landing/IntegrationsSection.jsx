import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, CreditCard, MessageCircle, Mail, MessageSquare, QrCode, Calculator, Code } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';

const INTEGRATIONS = [
  { name: 'M-Pesa', icon: Smartphone },
  { name: 'Visa', icon: CreditCard },
  { name: 'Mastercard', icon: CreditCard },
  { name: 'Stripe', icon: CreditCard },
  { name: 'WhatsApp', icon: MessageCircle },
  { name: 'Email', icon: Mail },
  { name: 'SMS', icon: MessageSquare },
  { name: 'QR Ordering', icon: QrCode },
  { name: 'Accounting', icon: Calculator },
  { name: 'APIs', icon: Code },
];

export default function IntegrationsSection() {
  return (
    <section className="py-24 bg-[#0c0c0c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Seamless" highlight="Integrations" subtitle="Connect with the tools and payment platforms your customers already use." />

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-14">
          {INTEGRATIONS.map((int, i) => (
            <motion.div
              key={int.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-3 rounded-xl luxury-border bg-[#111] p-6 hover:border-[#c9a962]/40 transition-all duration-300"
            >
              <int.icon className="w-7 h-7 text-[#c9a962]" />
              <span className="font-inter text-sm text-white/60">{int.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}