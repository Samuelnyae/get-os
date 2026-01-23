import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Menu, X, Instagram, Facebook, Twitter, Phone, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children, currentPageName }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        setIsAdmin(user?.role === 'admin');
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('hermanas_cart') || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    
    const handleCartUpdate = () => {
      const updatedCart = JSON.parse(localStorage.getItem('hermanas_cart') || '[]');
      setCartCount(updatedCart.reduce((sum, item) => sum + item.quantity, 0));
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const navLinks = [
    { name: 'Home', page: 'Home' },
    { name: 'Menu', page: 'Menu' },
    { name: 'Drinks', page: 'Drinks' },
    { name: 'Customize', page: 'CustomFood' },
    { name: 'About', page: 'About' },
    { name: 'Contact', page: 'Contact' },
    ...(isAdmin ? [{ name: 'Dashboard', page: 'Admin' }] : []),
  ];

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;500;600&display=swap');
        
        :root {
          --gold: #c9a962;
          --gold-light: #e4d5a7;
          --cream: #f5f0e8;
          --charcoal: #1a1a1a;
          --dark: #0a0a0a;
        }
        
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        
        .gold-gradient {
          background: linear-gradient(135deg, #c9a962 0%, #e4d5a7 50%, #c9a962 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .luxury-border {
          border: 1px solid rgba(201, 169, 98, 0.3);
        }
        
        .glass-effect {
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(20px);
        }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-effect shadow-2xl' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a962] to-[#e4d5a7] flex items-center justify-center">
                <span className="font-playfair text-xl text-[#0a0a0a] font-bold">HB</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-playfair text-xl font-semibold gold-gradient">Hermanas Bites</h1>
                <p className="text-[10px] tracking-[0.3em] text-[#c9a962]/70 font-inter uppercase">Seven Star Dining</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={`font-inter text-sm tracking-wide transition-all duration-300 hover:text-[#c9a962] ${
                    currentPageName === link.page ? 'text-[#c9a962]' : 'text-white/80'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Date & Time */}
              <div className="hidden md:block text-right">
                <p className="text-[10px] tracking-wider text-[#c9a962]/70 font-inter uppercase">{formatDate(currentTime)}</p>
                <p className="text-sm font-inter text-white/90 tabular-nums">{formatTime(currentTime)}</p>
              </div>

              {/* Cart */}
              <Link 
                to={createPageUrl('Order')} 
                className="relative p-2 rounded-full luxury-border hover:bg-[#c9a962]/10 transition-all duration-300"
              >
                <ShoppingCart className="w-5 h-5 text-[#c9a962]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c9a962] text-[#0a0a0a] text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
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
                {navLinks.map((link) => (
                  <Link
                    key={link.page}
                    to={createPageUrl(link.page)}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block font-inter text-lg transition-all ${
                      currentPageName === link.page ? 'text-[#c9a962]' : 'text-white/80'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-[#c9a962]/20">
                  <p className="text-xs text-[#c9a962]/70">{formatDate(currentTime)}</p>
                  <p className="text-sm text-white/90">{formatTime(currentTime)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0f0f0f] border-t border-[#c9a962]/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <h2 className="font-playfair text-3xl gold-gradient mb-4">Hermanas Bites</h2>
              <p className="font-cormorant text-lg text-white/60 leading-relaxed max-w-md">
                Experience the pinnacle of culinary excellence at our seven-star establishment. 
                Where every dish tells a story of passion, tradition, and innovation.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-inter text-sm tracking-wider text-[#c9a962] uppercase mb-6">Quick Links</h3>
              <div className="space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.page}
                    to={createPageUrl(link.page)}
                    className="block font-inter text-sm text-white/60 hover:text-[#c9a962] transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-inter text-sm tracking-wider text-[#c9a962] uppercase mb-6">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-full luxury-border flex items-center justify-center hover:bg-[#c9a962]/10 transition-all">
                  <Instagram className="w-4 h-4 text-[#c9a962]" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full luxury-border flex items-center justify-center hover:bg-[#c9a962]/10 transition-all">
                  <Facebook className="w-4 h-4 text-[#c9a962]" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full luxury-border flex items-center justify-center hover:bg-[#c9a962]/10 transition-all">
                  <Twitter className="w-4 h-4 text-[#c9a962]" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full luxury-border flex items-center justify-center hover:bg-[#c9a962]/10 transition-all">
                  <Phone className="w-4 h-4 text-[#c9a962]" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#c9a962]/20 mt-12 pt-8 text-center">
            <p className="font-inter text-xs text-white/40">
              © {new Date().getFullYear()} Hermanas Bites. Seven Star Luxury Dining Experience. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}