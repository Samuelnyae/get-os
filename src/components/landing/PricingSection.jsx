import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';

const PLANS = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for single-location businesses getting started.',
    features: ['1 Branch', 'POS & Orders', 'Reservations', 'Basic Analytics', 'Email Support', 'Up to 10 staff'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    description: 'For growing businesses that need AI and multi-branch support.',
    features: ['Up to 5 Branches', 'Everything in Starter', 'AI Automation Suite', 'Advanced Analytics', 'Inventory & Supply Chain', 'WhatsApp & SMS', 'Priority Support', 'Up to 50 staff'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$249',
    period: '/month',
    description: 'Unlimited scale for resort groups and large operations.',
    features: ['Unlimited Branches', 'Everything in Professional', 'Custom AI Models', 'Dedicated Account Manager', 'API Access', 'White-label Options', '24/7 Phone Support', 'Unlimited staff'],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section className="py-24 bg-[#0c0c0c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Simple" highlight="Pricing" subtitle="Start free for 14 days. No credit card required. Cancel anytime." />

        <div className="grid md:grid-cols-3 gap-6 mt-14 items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? 'luxury-border bg-gradient-to-b from-[#c9a962]/10 to-[#111] shadow-[0_0_40px_rgba(201,169,98,0.15)] lg:-mt-4'
                  : 'luxury-border bg-[#111]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#c9a962] to-[#e4d5a7] text-[#0a0a0a] font-inter text-xs font-bold">
                  MOST POPULAR
                </div>
              )}
              <h3 className="font-playfair text-2xl text-white mb-2">{plan.name}</h3>
              <p className="font-inter text-sm text-white/40 mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-playfair text-4xl gold-gradient font-bold">{plan.price}</span>
                <span className="font-inter text-sm text-white/40">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#c9a962] shrink-0 mt-0.5" />
                    <span className="font-inter text-sm text-white/60">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-full font-inter font-medium transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#c9a962] to-[#e4d5a7] text-[#0a0a0a] hover:shadow-[0_0_30px_rgba(201,169,98,0.4)]'
                    : 'luxury-border text-white hover:bg-[#c9a962]/10'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}