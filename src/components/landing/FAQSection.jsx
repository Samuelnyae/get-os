import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';

const FAQS = [
  { q: 'Can I manage multiple branches?', a: 'Yes. The Professional plan supports up to 5 branches and the Enterprise plan supports unlimited branches — all managed from a single dashboard with per-branch reporting and staff assignment.' },
  { q: 'Does it support hotels?', a: 'Absolutely. Hospitality OS includes full hotel management — room bookings, check-in/check-out, housekeeping, minibar, room service, and occupancy tracking — alongside restaurant and event management.' },
  { q: 'Can I use it for restaurants?', a: 'Yes. Restaurants get POS, table dining, kitchen display system (KDS), QR ordering, delivery tracking, and menu management — all built specifically for food service operations.' },
  { q: 'Can I migrate my existing data?', a: 'Yes. Our onboarding wizard includes a CSV import step for menu items, inventory, staff, and customer data. Enterprise customers get white-glove migration support from our team.' },
  { q: 'Is there a free trial?', a: 'Yes — every plan starts with a 14-day free trial. No credit card required. You get full access to all features during the trial so you can experience the complete platform.' },
  { q: 'Do I need to install anything?', a: 'No. Hospitality OS is fully cloud-based. Access it from any browser on your computer, tablet, or phone. There are also mobile-optimized views for staff on the go.' },
];

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className="rounded-xl luxury-border bg-[#111] overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-6 py-5 text-left"
      >
        <span className="font-inter text-base text-white">{faq.q}</span>
        <ChevronDown className={`w-5 h-5 text-[#c9a962] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 font-inter text-sm text-white/50 leading-relaxed">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Frequently Asked" highlight="Questions" subtitle="Everything you need to know about the platform." />

        <div className="space-y-3 mt-14">
          {FAQS.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}