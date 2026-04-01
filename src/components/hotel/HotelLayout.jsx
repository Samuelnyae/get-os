import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Menu, X, Instagram, Facebook, Twitter, Phone, ShoppingCart, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Chatbot from '@/components/chatbot/Chatbot';

export default function HotelLayout({ children, hotel }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isHotelAdmin, setIsHotelAdmin] = useState(false);
  const [isMainAdmin, setIsMainAdmin] = useState(false);

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
    const checkUser = async () => {
      try {
        const user = await base44.auth.me();
        setIsMainAdmin(user?.role === 'admin');
        // Hotel admin = main admin OR the owner of this specific hotel
        setIsHotelAdmin(
          user?.role === 'admin' || 
          (hotel?.owner_email && user?.email === hotel?.owner_email)
        );
      } catch {
        setIsHotelAdmin(false);
        setIsMainAdmin(false);
      }
    };
    checkUser();
  }, [hotel]);

  useEffect(() => {
    const cartKey = hotel?.slug ? `hermanas_cart_${hotel.slug}` : 'hermanas_cart';
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    const handleCartUpdate = () => {
      const updatedCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      setCartCount(updatedCart.reduce((sum, item) => sum + item.quantity, 0));
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [hotel?.slug]);

  const hotelBase = hotel ? `/hotel/${hotel.slug}` : '/';

  const navLinks = [
    { name: 'Home', href: hotelBase },
    { name: 'Menu', href: `${hotelBase}/menu` },
    { name: 'About', href: `${hotelBase}/about` },
    { name: 'Track Order', href: `${hotelBase}/track-order` },
    ...(isHotelAdmin ? [{ name: 'Dashboard', href: `${hotelBase}/admin` }] : []),
    ...(isMainAdmin ? [{ name: 'All Locations', href: '/Hotels' }] : []),
  ];

  const servicesLinks = [
    { name: 'Reservations', href: `${hotelBase}/reservations` },
    { name: 'Table Dining', href: `${hotelBase}/table-dining` },
    { name: 'Customize Order', href: `${hotelBase}/customize` },
    { name: 'Recommendations', href: `${hotelBase}/recommendations` },
  ];

  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const hotelInitials = hotel?.name
    ? hotel.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'HB';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;500;600&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        .gold-gradient {
          background: linear-gradient(135deg, #c9a962 0%, #e4d5a7 50%, #c9a962 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .luxury-border { border: 1px solid rgba(201, 169, 98, 0.3); }
        .glass-effect { background: rgba(10,10,10,0.85); backdrop-filter: blur(20px); }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass-effect shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to={hotelBase} className="flex items-center space-x-3">
              {hotel?.logo_url ? (
                <img src={hotel.logo_url} alt={hotel.name} className="w-12 h-12 rounded-full object-cover border border-[#c9a962]/30" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a962] to-[#e4d5a7] flex items-center justify-center">
                  <span className="font-playfair text-lg text-[#0a0a0a] font-bold">{hotelInitials}</span>
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="font-playfair text-xl font-semibold gold-gradient">{hotel?.name || 'Hermanas Bites'}</h1>
                <p className="text-[10px] tracking-[0.3em] text-[#c9a962]/70 font-inter uppercase">{hotel?.location || 'Seven Star Dining'}</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="font-inter text-sm tracking-wide transition-all duration-300 hover:text-[#c9a962] text-white/80"
                >
                  {link.name}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger className="font-inter text-sm tracking-wide transition-all duration-300 hover:text-[#c9a962] flex items-center gap-1 text-white/80">
                  Services <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a1a] border-[#c9a962]/20">
                  {servicesLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link to={link.href} className="font-inter text-sm text-white/80 hover:text-[#c9a962] cursor-pointer">
                        {link.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-[10px] tracking-wider text-[#c9a962]/70 font-inter uppercase">{formatDate(currentTime)}</p>
                <p className="text-sm font-inter text-white/90 tabular-nums">{formatTime(currentTime)}</p>
              </div>
              <Link to={hotel ? `/hotel/${hotel.slug}/order` : '/Order'} className="relative p-2 rounded-full luxury-border hover:bg-[#c9a962]/10 transition-all duration-300">
                <ShoppingCart className="w-5 h-5 text-[#c9a962]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c9a962] text-[#0a0a0a] text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
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
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block font-inter text-lg text-white/80 transition-all hover:text-[#c9a962]"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-2 pb-2">
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-3">Services</p>
                  <div className="space-y-3 pl-3">
                    {servicesLinks.map((link) => (
                      <Link key={link.href} to={link.href} onClick={() => setIsMenuOpen(false)} className="block font-inter text-base text-white/70 hover:text-[#c9a962]">
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-[#c9a962]/20">
                  <p className="text-xs text-[#c9a962]/70">{formatDate(currentTime)}</p>
                  <p className="text-sm text-white/90">{formatTime(currentTime)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="pt-20">{children}</main>

      {/* Footer */}
      <footer className="bg-[#0f0f0f] border-t border-[#c9a962]/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
            <div className="md:col-span-2">
              <h2 className="font-playfair text-3xl gold-gradient mb-4">{hotel?.name || 'Hermanas Bites'}</h2>
              {hotel?.description && (
                <p className="font-cormorant text-lg text-white/60 leading-relaxed max-w-md">{hotel.description}</p>
              )}
              {hotel?.address && <p className="font-inter text-sm text-white/40 mt-3">{hotel.address}</p>}
              {hotel?.phone && <p className="font-inter text-sm text-[#c9a962]/70 mt-1">{hotel.phone}</p>}
            </div>
            <div className="self-start">
              <h3 className="font-inter text-sm tracking-wider text-[#c9a962] uppercase mb-6">Connect</h3>
              <div className="flex flex-wrap gap-3">
                {hotel?.social_instagram && <a href={hotel.social_instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full luxury-border flex items-center justify-center hover:bg-[#c9a962]/10 transition-all"><Instagram className="w-4 h-4 text-[#c9a962]" /></a>}
                {hotel?.social_facebook && <a href={hotel.social_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full luxury-border flex items-center justify-center hover:bg-[#c9a962]/10 transition-all"><Facebook className="w-4 h-4 text-[#c9a962]" /></a>}
                {hotel?.social_twitter && <a href={hotel.social_twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full luxury-border flex items-center justify-center hover:bg-[#c9a962]/10 transition-all"><Twitter className="w-4 h-4 text-[#c9a962]" /></a>}
                {hotel?.phone && <a href={`tel:${hotel.phone}`} className="w-10 h-10 rounded-full luxury-border flex items-center justify-center hover:bg-[#c9a962]/10 transition-all"><Phone className="w-4 h-4 text-[#c9a962]" /></a>}
                {(!hotel?.social_instagram && !hotel?.social_facebook && !hotel?.social_twitter && !hotel?.phone) && (
                  <p className="font-inter text-xs text-white/30">No social links added yet.</p>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-[#c9a962]/20 mt-12 pt-8 text-center">
            <p className="font-inter text-xs text-white/40">
              © {new Date().getFullYear()} {hotel?.name || 'Hermanas Bites'}. Part of the Hermanas Bites Network.
            </p>
          </div>
        </div>
      </footer>

      <Chatbot />
    </div>
  );
}