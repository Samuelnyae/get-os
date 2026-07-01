import React from 'react';
import { motion } from 'framer-motion';

export default function SectionHeader({ title, highlight, subtitle, align = 'center' }) {
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`mb-12 ${alignments[align]}`}
    >
      {subtitle && !highlight && (
        <p className="font-inter text-xs tracking-[0.3em] text-[#c9a962] uppercase mb-3">
          {subtitle}
        </p>
      )}
      <h2 className="font-playfair text-4xl md:text-5xl text-white">
        {title} {highlight && <span className="gold-gradient">{highlight}</span>}
      </h2>
      {subtitle && highlight && (
        <p className="font-inter text-base text-white/50 mt-4 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      <div className={`mt-6 flex ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
        <div className="flex items-center space-x-2">
          <div className="w-12 h-px bg-[#c9a962]/50" />
          <div className="w-2 h-2 rounded-full bg-[#c9a962]" />
          <div className="w-12 h-px bg-[#c9a962]/50" />
        </div>
      </div>
    </motion.div>
  );
}