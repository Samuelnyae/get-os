import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Rocket } from 'lucide-react';
import { PLANS } from './onboardingConfig';

export default function PlanStep({ data, update, onNext, onBack }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h1 className="font-playfair text-3xl gold-gradient mb-2">Choose a Plan</h1>
      <p className="font-inter text-sm text-white/50 mb-8">Start with a 14-day free trial. No card required.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {PLANS.map((plan) => (
          <button key={plan.value} onClick={() => update({ plan: plan.value })}
            className={`relative p-5 rounded-xl text-left transition-all ${
              data.plan === plan.value
                ? 'bg-[#c9a962]/15 border-2 border-[#c9a962]'
                : 'luxury-border border border-[#c9a962]/20 hover:bg-white/5'
            }`}>
            {data.plan === plan.value && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#c9a962] flex items-center justify-center">
                <Check className="w-3 h-3 text-[#0a0a0a]" />
              </div>
            )}
            <p className="font-playfair text-xl text-white mb-1">{plan.label}</p>
            <p className="font-inter text-2xl text-[#c9a962] font-semibold mb-2">{plan.price}</p>
            <p className="font-inter text-xs text-white/40 mb-3">{plan.desc}</p>
            <ul className="space-y-1">
              {plan.features.map((f, i) => (
                <li key={i} className="font-inter text-xs text-white/60 flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#c9a962]" /> {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <button onClick={() => update({ plan: 'trial' })}
        className={`w-full p-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
          data.plan === 'trial' ? 'bg-[#c9a962]/15 border-2 border-[#c9a962]' : 'luxury-border border hover:bg-white/5'
        }`}>
        <Rocket className="w-5 h-5 text-[#c9a962]" />
        <span className="font-inter text-sm text-white font-medium">Start Free Trial — decide later</span>
      </button>

      <div className="flex gap-3 mt-8">
        <button onClick={onBack} className="px-5 py-3 luxury-border rounded-lg font-inter text-white/60 hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext}
          className="flex-1 bg-[#c9a962] text-[#0a0a0a] font-inter font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#e4d5a7] transition-colors">
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}