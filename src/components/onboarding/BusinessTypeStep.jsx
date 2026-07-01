import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { BUSINESS_TYPES } from './onboardingConfig';

export default function BusinessTypeStep({ data, update, onNext, onBack }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h1 className="font-playfair text-3xl gold-gradient mb-2">What type of business are you managing?</h1>
      <p className="font-inter text-sm text-white/50 mb-8">This helps us enable the right modules automatically.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {BUSINESS_TYPES.map((type) => (
          <button key={type.value} onClick={() => update({ industry: type.value })}
            className={`relative p-5 rounded-xl text-center transition-all ${
              data.industry === type.value
                ? 'bg-[#c9a962]/15 border-2 border-[#c9a962]'
                : 'luxury-border border border-[#c9a962]/20 hover:bg-white/5'
            }`}>
            {data.industry === type.value && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#c9a962] flex items-center justify-center">
                <Check className="w-3 h-3 text-[#0a0a0a]" />
              </div>
            )}
            <div className="text-3xl mb-2">{type.icon}</div>
            <p className="font-inter text-sm text-white font-medium">{type.label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-5 py-3 luxury-border rounded-lg font-inter text-white/60 hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} disabled={!data.industry}
          className="flex-1 bg-[#c9a962] text-[#0a0a0a] font-inter font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#e4d5a7] transition-colors disabled:opacity-40">
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}