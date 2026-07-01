import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, LogIn } from 'lucide-react';

export default function WelcomeStep({ onNext }) {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg mx-auto">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-[#c9a962] to-[#e4d5a7] flex items-center justify-center mx-auto mb-8">
        <span className="font-playfair text-3xl text-[#0a0a0a] font-bold">GO</span>
      </motion.div>

      <h1 className="font-playfair text-4xl md:text-5xl mb-4" style={{ background: 'linear-gradient(135deg, #c9a962 0%, #e4d5a7 50%, #c9a962 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Welcome to Get OS
      </h1>
      <p className="font-inter text-white/50 text-lg mb-10 leading-relaxed">
        Run your hotel, restaurant, lodge, café, or resort from one platform.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onNext}
          className="bg-[#c9a962] hover:bg-[#e4d5a7] text-[#0a0a0a] font-inter font-semibold px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
          Create My Business <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={() => navigate('/login')}
          className="luxury-border text-white/70 hover:text-[#c9a962] font-inter font-medium px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
          <LogIn className="w-4 h-4" /> Sign In
        </button>
      </div>

      <p className="font-inter text-white/30 text-xs mt-8">No credit card required · 14-day free trial · Setup in under 5 minutes</p>
    </motion.div>
  );
}