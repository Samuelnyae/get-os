import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Industries', href: '#industries' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', page: 'About' },
  { label: 'Contact', page: 'Contact' },
];

export default function MarketingNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href) => {
    setIsMenuOpen(false);
    if (href === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'glass-effect shadow-2xl' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button onClick={() => handleNavClick('#home')} className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a962] to-[#e4d5a7] flex items-center justify-center">
              <span className="font-playfair text-xl text-[#0a0a0a] font-bold">GO</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-playfair text-xl font-semibold gold-gradient">Get OS</h1>
              <p className="text-[10px] tracking-[0.3em] text-[#c9a962]/70 font-inter uppercase">Hospitality OS</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) =>
              link.href ? (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className="font-inter text-sm tracking-wide text-white/80 hover:text-[#c9a962] transition-all duration-300"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.label}
                  to={createPageUrl(link.page)}
                  className="font-inter text-sm tracking-wide text-white/80 hover:text-[#c9a962] transition-all duration-300"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="hidden sm:block font-inter text-sm text-white/80 hover:text-[#c9a962] transition-all duration-300"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="hidden sm:block px-5 py-2 rounded-full bg-gradient-to-r from-[#c9a962] to-[#e4d5a7] text-[#0a0a0a] font-inter text-sm font-medium hover:opacity-90 transition-all"
            >
              Start Free Trial
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-full luxury-border hover:bg-[#c9a962]/10 transition-all"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-[#c9a962]" /> : <Menu className="w-5 h-5 text-[#c9a962]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-effect border-t border-[#c9a962]/20"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) =>
                link.href ? (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.href)}
                    className="block font-inter text-lg text-white/80 hover:text-[#c9a962] transition-all"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.label}
                    to={createPageUrl(link.page)}
                    onClick={() => setIsMenuOpen(false)}
                    className="block font-inter text-lg text-white/80 hover:text-[#c9a962] transition-all"
                  >
                    {link.label}
                  </Link>
                )
              )}
              <div className="pt-4 border-t border-[#c9a962]/20 flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="font-inter text-base text-white/80 hover:text-[#c9a962] transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-5 py-2 rounded-full bg-gradient-to-r from-[#c9a962] to-[#e4d5a7] text-[#0a0a0a] font-inter text-sm font-medium text-center hover:opacity-90 transition-all"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}