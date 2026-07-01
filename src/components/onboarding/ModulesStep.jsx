import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { ALL_MODULES, BUSINESS_TYPES } from './onboardingConfig';

export default function ModulesStep({ data, update, onNext, onBack }) {
  const toggleModule = (value) => {
    const current = data.enabled_modules || [];
    update({
      enabled_modules: current.includes(value)
        ? current.filter(m => m !== value)
        : [...current, value]
    });
  };

  const autoSelect = () => {
    const businessType = BUSINESS_TYPES.find(t => t.value === data.industry);
    update({ enabled_modules: businessType ? businessType.modules : [] });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h1 className="font-playfair text-3xl gold-gradient mb-2">Configure Modules</h1>
      <p className="font-inter text-sm text-white/50 mb-4">Which features do you need? You can change these anytime.</p>

      <button onClick={autoSelect}
        className="mb-6 px-4 py-2 rounded-lg bg-[#c9a962]/10 border border-[#c9a962]/30 text-[#c9a962] font-inter text-sm flex items-center gap-2 hover:bg-[#c9a962]/20 transition-colors">
        <Sparkles className="w-4 h-4" /> Auto-select based on business type
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {ALL_MODULES.map((mod) => {
          const selected = data.enabled_modules?.includes(mod.value);
          return (
            <button key={mod.value} onClick={() => toggleModule(mod.value)}
              className={`p-4 rounded-xl text-left transition-all ${
                selected ? 'bg-[#c9a962]/15 border-2 border-[#c9a962]' : 'luxury-border border border-[#c9a962]/20 hover:bg-white/5'
              }`}>
              <div className="flex items-start gap-3">
                <div className="text-2xl">{mod.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-inter text-sm text-white font-medium">{mod.label}</p>
                    {selected && <Check className="w-4 h-4 text-[#c9a962]" />}
                  </div>
                  <p className="font-inter text-xs text-white/40">{mod.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
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