import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Rocket, Loader2, AlertTriangle, PartyPopper } from 'lucide-react';

export default function FinishStep({ loading, error, onComplete }) {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-lg mx-auto">
      {error ? (
        <>
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="font-playfair text-3xl text-white mb-2">Setup Failed</h1>
          <p className="font-inter text-sm text-white/50 mb-8">{error}</p>
          <button onClick={onComplete} className="bg-[#c9a962] text-[#0a0a0a] font-inter font-medium px-8 py-3 rounded-lg hover:bg-[#e4d5a7] transition-colors">
            Try Again
          </button>
        </>
      ) : loading ? (
        <>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
            className="w-20 h-20 rounded-full bg-[#c9a962]/15 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-[#c9a962] animate-spin" />
          </motion.div>
          <h1 className="font-playfair text-3xl gold-gradient mb-2">Creating Your Workspace...</h1>
          <p className="font-inter text-sm text-white/50">Setting up your organization, branches, and modules.</p>
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 rounded-full bg-[#c9a962]/15 flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-10 h-10 text-[#c9a962]" />
          </motion.div>
          <h1 className="font-playfair text-4xl gold-gradient mb-2">Welcome!</h1>
          <p className="font-inter text-white/50 text-lg mb-8">Your workspace is ready. Let's get your business running.</p>

          <div className="space-y-2 mb-8 text-left max-w-sm mx-auto">
            {['Organization created', 'Branches configured', 'Modules enabled', 'Owner account assigned', 'Business settings applied'].map((item, i) => (
              <motion.div key={item} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#c9a962] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-[#0a0a0a]" />
                </div>
                <span className="font-inter text-sm text-white/70">{item}</span>
              </motion.div>
            ))}
          </div>

          <button onClick={() => { window.location.href = '/Admin'; }}
            className="bg-[#c9a962] text-[#0a0a0a] font-inter font-semibold px-8 py-4 rounded-xl inline-flex items-center gap-2 hover:bg-[#e4d5a7] transition-colors">
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}