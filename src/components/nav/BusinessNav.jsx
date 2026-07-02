import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BedDouble, UtensilsCrossed, HelpCircle, CalendarCheck, Bot,
  Sparkles, PartyPopper, Wine, LayoutGrid, Truck, ClipboardList,
  Info, Mail, ShoppingCart, LayoutDashboard, CreditCard, QrCode,
  ChevronDown, Menu, X, MoreHorizontal,
} from 'lucide-react';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useOrganization, getIndustryTagline } from '@/lib/OrganizationContext';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';

const NAV_GROUPS = [
  {
    id: 'stay',
    label: 'Stay & Rooms',
    icon: BedDouble,
    modules: ['hotel_management'],
    items: [
      { name: 'Reservations', page: 'Reservations', icon: CalendarCheck },
      { name: 'AI Concierge', page: 'GuestPortal', icon: Bot },
      { name: 'Rooms & Suites', page: 'Rooms', icon: BedDouble },
      { name: 'Spa & Amenities', page: 'SpaAmenities', icon: Sparkles },
      { name: 'Event Bookings', page: 'Events', icon: PartyPopper },
    ],
  },
  {
    id: 'dining',
    label: 'Dining',
    icon: UtensilsCrossed,
    modules: ['pos'],
    items: [
      { name: 'Full Menu', page: 'Menu', icon: UtensilsCrossed },
      { name: 'Drinks', page: 'Drinks', icon: Wine },
      { name: 'Table Dining', page: 'TableDining', icon: LayoutGrid },
      { name: 'Track Order', page: 'OrderTracking', icon: Truck },
      { name: 'Custom Orders', page: 'CustomFood', icon: ClipboardList },
    ],
  },
  {
    id: 'help',
    label: 'Help & Info',
    icon: HelpCircle,
    modules: [],
    items: [
      { name: 'About Us', page: 'About', icon: Info },
      { name: 'Contact', page: 'Contact', icon: Mail },
      { name: 'FAQ', page: 'Contact', icon: HelpCircle },
    ],
  },
];

const STAFF_LINKS = [
  { name: 'Dashboard', page: 'Admin', icon: LayoutDashboard },
  { name: 'Billing', page: 'Billing', icon: CreditCard },
  { name: 'QR Code', page: 'QRCode', icon: QrCode },
];

function TabBarLink({ to, icon: Icon, label, active, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 transition-all ${
        active ? 'text-[#c9a962]' : 'text-white/50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-inter text-[10px]">{label}</span>
    </Link>
  );
}

export default function BusinessNav({ currentPageName }) {
  const { org, user: orgUser } = useOrganization();
  const { enabledModules } = useBusinessInfo();
  const isAdmin = orgUser?.role === 'admin' || orgUser?.role === 'owner' || orgUser?.role === 'platform_admin';
  const isPlatformAdmin = orgUser?.role === 'platform_admin';

  const [openDropdown, setOpenDropdown] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleGroups = NAV_GROUPS.filter(
    (g) => g.modules.length === 0 || g.modules.some((m) => enabledModules.includes(m))
  );

  const staffLinks = [
    ...STAFF_LINKS,
    ...(isPlatformAdmin
      ? [{ name: 'Super Admin', page: 'SuperAdmin', icon: LayoutDashboard }]
      : []),
  ];

  const isGroupActive = (group) => group.items.some((item) => item.page === currentPageName);

  const navLinkClass = (page) =>
    `font-inter text-sm tracking-wide transition-all duration-300 hover:text-[#c9a962] ${
      currentPageName === page ? 'text-[#c9a962]' : 'text-white/80'
    }`;

  const isTabActive = (pages) => Array.isArray(pages) ? pages.includes(currentPageName) : currentPageName === pages;

  return (
    <>
      {/* Top Bar */}
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass-effect shadow-2xl' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/Home" className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a962] to-[#e4d5a7] flex items-center justify-center">
                <span className="font-playfair text-xl text-[#0a0a0a] font-bold">
                  {(org?.name || 'GO').charAt(0)}
                </span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-playfair text-xl font-semibold gold-gradient">
                  {org?.name || 'Get OS'}
                </h1>
                <p className="text-[10px] tracking-[0.3em] text-[#c9a962]/70 font-inter uppercase">
                  {org ? getIndustryTagline(org.industry) : 'Hospitality'}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <Link to="/Home" className={navLinkClass('Home')}>
                Home
              </Link>

              {visibleGroups.map((group) => (
                <div key={group.id} className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === group.id ? null : group.id)}
                    className={`font-inter text-sm tracking-wide transition-all duration-300 hover:text-[#c9a962] flex items-center gap-1 ${
                      isGroupActive(group) ? 'text-[#c9a962]' : 'text-white/80'
                    }`}
                  >
                    {group.label}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${
                        openDropdown === group.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openDropdown === group.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 p-3 rounded-2xl glass-effect border border-[#c9a962]/20 shadow-2xl"
                      >
                        <div className="grid grid-cols-2 gap-1">
                          {group.items.map((item) => (
                            <Link
                              key={item.page + item.name}
                              to={`/${item.page}`}
                              onClick={() => setOpenDropdown(null)}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#c9a962]/10 transition-all"
                            >
                              <div className="w-9 h-9 rounded-lg bg-[#c9a962]/10 flex items-center justify-center">
                                <item.icon className="w-4 h-4 text-[#c9a962]" />
                              </div>
                              <span
                                className={`font-inter text-sm ${
                                  currentPageName === item.page ? 'text-[#c9a962]' : 'text-white/80'
                                }`}
                              >
                                {item.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Cart */}
              <Link
                to="/Order"
                className="relative p-2 rounded-full luxury-border hover:bg-[#c9a962]/10 transition-all duration-300"
              >
                <ShoppingCart className="w-5 h-5 text-[#c9a962]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c9a962] text-[#0a0a0a] text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Language Switcher — desktop */}
              <div className="hidden lg:block">
                <LanguageSwitcher />
              </div>

              {/* Staff Dashboard — desktop, admin only */}
              {isAdmin && (
                <Link
                  to="/Admin"
                  className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a962]/10 border border-[#c9a962]/30 text-[#c9a962] font-inter text-sm hover:bg-[#c9a962]/20 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              )}

              {/* Burger — mobile */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="lg:hidden p-2 rounded-full luxury-border hover:bg-[#c9a962]/10 transition-all"
              >
                <Menu className="w-5 h-5 text-[#c9a962]" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-effect border-t border-[#c9a962]/20">
        <div className="flex items-center justify-around h-16">
          <TabBarLink to="/Home" icon={Home} label="Home" active={isTabActive('Home')} />
          <TabBarLink to="/Menu" icon={UtensilsCrossed} label="Menu" active={isTabActive(['Menu', 'Drinks'])} />
          <TabBarLink to="/Rooms" icon={BedDouble} label="Rooms" active={isTabActive(['Rooms', 'Reservations', 'SpaAmenities', 'Events', 'GuestPortal'])} />
          <TabBarLink
            to="#"
            icon={MoreHorizontal}
            label="More"
            active={isDrawerOpen}
            onClick={(e) => {
              e.preventDefault();
              setIsDrawerOpen(true);
            }}
          />
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto glass-effect border-t border-[#c9a962]/20 rounded-t-3xl"
            >
              {/* Drawer Header */}
              <div className="sticky top-0 glass-effect px-5 py-4 border-b border-[#c9a962]/10 flex items-center justify-between z-10">
                <h2 className="font-playfair text-lg text-white">{org?.name || 'Menu'}</h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-full hover:bg-[#c9a962]/10 transition-all"
                >
                  <X className="w-5 h-5 text-[#c9a962]" />
                </button>
              </div>

              <div className="p-5 space-y-6 pb-8">
                {/* Nav Groups — Grid Layout */}
                {visibleGroups.map((group) => (
                  <div key={group.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <group.icon className="w-4 h-4 text-[#c9a962]" />
                      <h3 className="font-inter text-xs tracking-[0.2em] text-[#c9a962] uppercase">
                        {group.label}
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {group.items.map((item) => (
                        <Link
                          key={item.page + item.name}
                          to={`/${item.page}`}
                          onClick={() => setIsDrawerOpen(false)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                            currentPageName === item.page
                              ? 'bg-[#c9a962]/15 border border-[#c9a962]/30'
                              : 'bg-[#1a1a1a]/50 border border-transparent hover:border-[#c9a962]/20'
                          }`}
                        >
                          <item.icon className="w-5 h-5 text-[#c9a962]" />
                          <span className="font-inter text-xs text-white/80 text-center">
                            {item.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Staff Tools — separated from guest nav */}
                {isAdmin && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <LayoutDashboard className="w-4 h-4 text-[#c9a962]" />
                      <h3 className="font-inter text-xs tracking-[0.2em] text-[#c9a962] uppercase">
                        Staff Tools
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {staffLinks.map((link) => (
                        <Link
                          key={link.page}
                          to={`/${link.page}`}
                          onClick={() => setIsDrawerOpen(false)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                            currentPageName === link.page
                              ? 'bg-[#c9a962]/15 border border-[#c9a962]/30'
                              : 'bg-[#1a1a1a]/50 border border-transparent hover:border-[#c9a962]/20'
                          }`}
                        >
                          <link.icon className="w-5 h-5 text-[#c9a962]" />
                          <span className="font-inter text-xs text-white/80 text-center">
                            {link.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Settings */}
                <div>
                  <h3 className="font-inter text-xs tracking-[0.2em] text-[#c9a962] uppercase mb-3">
                    Settings
                  </h3>
                  <LanguageSwitcher />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}