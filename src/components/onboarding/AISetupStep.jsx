import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { AI_MODULES } from './onboardingConfig';
import OnboardingIcon from './OnboardingIcon';

export default function AISetupStep({ data, update, onNext, onBack }) {
  const toggleAI = (value) => {
    const current = data.ai_modules || [];
    update({
      ai_modules: current.includes(value)
        ? current.filter(m => m !== value)
        : [...current, value]
    });
  };

  const enableAll = () => update({ ai_modules: AI_MODULES.map(m => m.value) });
  const disableAll = () => update({ ai_modules: [] });

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h1 className="font-playfair text-3xl gold-gradient mb-2">Enable AI?</h1>
      <p className="font-inter text-sm text-white/50 mb-6">Power up your business with AI-driven automation and insights.</p>

      <div className="flex gap-3 mb-6">
        <button onClick={enableAll}
          className="px-4 py-2 rounded-lg bg-[#c9a962]/10 border border-[#c9a962]/30 text-[#c9a962] font-inter text-sm flex items-center gap-2 hover:bg-[#c9a962]/20 transition-colors">
          <Sparkles className="w-4 h-4" /> Enable All
        </button>
        <button onClick={disableAll}
          className="px-4 py-2 rounded-lg luxury-border font-inter text-sm text-white/60 hover:text-white transition-colors">
          Skip AI
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {AI_MODULES.map((mod) => {
          const selected = data.ai_modules?.includes(mod.value);
          return (
            <button key={mod.value} onClick={() => toggleAI(mod.value)}
              className={`p-4 rounded-xl text-left transition-all ${
                selected ? 'bg-[#c9a962]/15 border-2 border-[#c9a962]' : 'luxury-border border border-[#c9a962]/20 hover:bg-white/5'
              }`}>
              <div className="flex items-start gap-3">
                <OnboardingIcon name={mod.icon} className="w-6 h-6 text-[#c9a962] shrink-0" />
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