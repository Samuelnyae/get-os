import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

const PLAN_BADGE = {
  starter: { label: 'Most Popular', cls: 'bg-[#c9a962]/20 text-[#c9a962]' },
  professional: { label: 'Best Value', cls: 'bg-green-400/20 text-green-400' },
  enterprise: { label: 'Premium', cls: 'bg-purple-400/20 text-purple-400' },
};

export default function PlanCard({ plan, currentPlan, onUpgrade, loading }) {
  const isCurrent = plan.id === currentPlan;
  const badge = PLAN_BADGE[plan.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-[#1a1a1a] border rounded-2xl p-6 flex flex-col ${
        plan.featured ? 'border-[#c9a962]/40 shadow-lg shadow-[#c9a962]/5' : 'border-[#c9a962]/10'
      }`}
    >
      {badge && (
        <span className={`absolute -top-3 left-6 px-3 py-1 rounded-full font-inter text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
          {badge.label}
        </span>
      )}

      <h3 className="font-playfair text-2xl text-white mb-1">{plan.name}</h3>
      <p className="font-inter text-xs text-white/40 mb-4">{plan.tagline}</p>

      <div className="mb-5">
        <span className="font-playfair text-4xl text-[#c9a962]">${plan.price}</span>
        <span className="font-inter text-sm text-white/40">/month</span>
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-[#c9a962] mt-0.5 flex-shrink-0" />
            <span className="font-inter text-sm text-white/70">{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onUpgrade(plan.id)}
        disabled={isCurrent || loading}
        className={`w-full py-3 rounded-xl font-inter text-sm font-semibold transition-all ${
          isCurrent
            ? 'bg-white/5 text-white/30 cursor-default'
            : plan.featured
            ? 'bg-[#c9a962] text-[#0a0a0a] hover:bg-[#c9a962]/90'
            : 'bg-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/30 hover:bg-[#c9a962]/20'
        }`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isCurrent ? 'Current Plan' : `Choose ${plan.name}`}
      </button>
    </motion.div>
  );
}