import React from 'react';
import { motion } from 'framer-motion';

export default function LuxuryButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false,
  type = 'button'
}) {
  const variants = {
    primary: 'bg-[#c9a962] text-[#0a0a0a] hover:bg-[#e4d5a7]',
    secondary: 'bg-transparent border border-[#c9a962] text-[#c9a962] hover:bg-[#c9a962]/10',
    ghost: 'bg-transparent text-[#c9a962] hover:bg-[#c9a962]/10'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        font-inter font-medium tracking-wide rounded-full
        transition-all duration-300 
        ${variants[variant]} 
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}