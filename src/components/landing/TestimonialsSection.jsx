import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';

const TESTIMONIALS = [
  {
    quote: "Hospitality OS transformed how we run our lodge. The AI inventory predictions alone saved us 20% on food waste in the first month.",
    name: 'Amara Okello',
    role: 'General Manager, Savanna Lodge',
    rating: 5,
  },
  {
    quote: "We manage three restaurant branches from one dashboard. Reservations, orders, staff scheduling — everything just works together.",
    name: 'David Kimani',
    role: 'Owner, Java House Group',
    rating: 5,
  },
  {
    quote: "The AI marketing assistant writes better campaigns than our agency did. Our repeat guest rate jumped from 30% to 48%.",
    name: 'Sarah Mwangi',
    role: 'Marketing Director, Coral Beach Resort',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Customer" highlight="Stories" subtitle="See what hospitality leaders across Africa are saying about Hospitality OS." />

        <div className="grid md:grid-cols-3 gap-6 mt-14">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl luxury-border bg-[#111] p-8 relative"
            >
              <Quote className="w-8 h-8 text-[#c9a962]/30 mb-4" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-[#c9a962] text-[#c9a962]" />
                ))}
              </div>
              <p className="font-inter text-sm text-white/60 leading-relaxed mb-6">"{t.quote}"</p>
              <div>
                <p className="font-playfair text-base text-white">{t.name}</p>
                <p className="font-inter text-xs text-[#c9a962]">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}