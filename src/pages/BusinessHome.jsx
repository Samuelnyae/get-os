import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  UtensilsCrossed, CalendarCheck, Truck, LayoutGrid, ClipboardList,
  BedDouble, PartyPopper, Sparkles, Clock, MapPin, Phone, Mail,
  ArrowRight, Instagram, Facebook, Twitter, MessageCircle
} from 'lucide-react';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import MenuCard from '@/components/menu/MenuCard';

const INDUSTRY_HERO_IMAGES = {
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600',
  cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600',
  bar: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1600',
  resort: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600',
  lodge: 'https://images.unsplash.com/photo-1542293661-3a94264f929f?w=1600',
  guest_house: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600',
  hostel: 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=1600',
  conference_center: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1600',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=1600',
  fast_food: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=1600',
  bakery: 'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=1600',
  night_club: 'https://images.unsplash.com/photo-1571266028243-d220c8c3c4d0?w=1600',
  food_court: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600',
  coffee_shop: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1600',
  event_venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600',
  other: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600',
};

const SERVICES = [
  { title: 'Browse Menu', desc: 'Explore our full culinary offerings', page: 'Menu', icon: UtensilsCrossed, modules: ['pos'] },
  { title: 'Reservations', desc: 'Book your table in advance', page: 'Reservations', icon: CalendarCheck, modules: ['reservations'] },
  { title: 'Track Order', desc: 'Follow your order in real-time', page: 'OrderTracking', icon: Truck, modules: ['pos'] },
  { title: 'Table Dining', desc: 'Dine in with our table service', page: 'TableDining', icon: LayoutGrid, modules: ['pos'] },
  { title: 'Custom Orders', desc: 'Personalize your meal', page: 'CustomFood', icon: ClipboardList, modules: ['pos'] },
  { title: 'Rooms & Suites', desc: 'Book your stay with us', page: 'Rooms', icon: BedDouble, modules: ['hotel_management'] },
  { title: 'Event Bookings', desc: 'Host your special occasions', page: 'Events', icon: PartyPopper, modules: ['hotel_management'] },
  { title: 'Spa & Amenities', desc: 'Relax and rejuvenate', page: 'SpaAmenities', icon: Sparkles, modules: ['hotel_management'] },
];

export default function BusinessHome() {
  const { name, tagline, description, address, phone, email, openingHours, imageUrl, industry, enabledModules, socialLinks, whatsapp } = useBusinessInfo();

  const { data: featuredItems = [], isLoading } = useQuery({
    queryKey: ['featured-menu-items'],
    queryFn: () => base44.entities.MenuItem.filter({ is_featured: true }, '-created_date', 6),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const heroImage = imageUrl || INDUSTRY_HERO_IMAGES[industry] || INDUSTRY_HERO_IMAGES.other;
  const availableServices = SERVICES.filter(s => s.modules.some(m => enabledModules.includes(m)));
  const socials = [
    { icon: Instagram, href: socialLinks.instagram, label: 'Instagram' },
    { icon: Facebook, href: socialLinks.facebook, label: 'Facebook' },
    { icon: Twitter, href: socialLinks.twitter, label: 'Twitter' },
    { icon: MessageCircle, href: whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}` : null, label: 'WhatsApp' },
  ].filter(s => s.href);

  return (
    <div className="bg-[#0a0a0a]">
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt={name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/60 to-[#0a0a0a]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-inter text-sm tracking-[0.4em] text-[#c9a962] uppercase mb-4"
          >
            {tagline}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-playfair text-5xl md:text-7xl text-white mb-6"
          >
            {name}
          </motion.h1>
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="font-cormorant text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-10"
            >
              {description.length > 180 ? description.substring(0, 180) + '...' : description}
            </motion.p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            {enabledModules.includes('pos') && (
              <Link to="/Menu" className="px-8 py-3 rounded-full bg-gradient-to-r from-[#c9a962] to-[#e4d5a7] text-[#0a0a0a] font-inter text-sm font-medium hover:opacity-90 transition-all">
                View Menu
              </Link>
            )}
            {enabledModules.includes('reservations') && (
              <Link to="/Reservations" className="px-8 py-3 rounded-full border border-[#c9a962]/30 text-white font-inter text-sm font-medium hover:bg-[#c9a962]/10 transition-all">
                Book a Table
              </Link>
            )}
            {enabledModules.includes('hotel_management') && (
              <Link to="/Rooms" className="px-8 py-3 rounded-full border border-[#c9a962]/30 text-white font-inter text-sm font-medium hover:bg-[#c9a962]/10 transition-all">
                Book a Room
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Quick Info Bar */}
      {(openingHours || address || phone) && (
        <section className="border-y border-[#c9a962]/10 bg-[#0f0f0f]">
          <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {openingHours && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#c9a962] flex-shrink-0" />
                <div>
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider">Hours</p>
                  <p className="font-inter text-sm text-white/80">{openingHours}</p>
                </div>
              </div>
            )}
            {address && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#c9a962] flex-shrink-0" />
                <div>
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider">Location</p>
                  <p className="font-inter text-sm text-white/80">{address}</p>
                </div>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#c9a962] flex-shrink-0" />
                <div>
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider">Contact</p>
                  <p className="font-inter text-sm text-white/80">{phone}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Menu */}
      {enabledModules.includes('pos') && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="font-inter text-sm tracking-[0.3em] text-[#c9a962] uppercase mb-3">Chef's Selection</p>
              <h2 className="font-playfair text-4xl text-white">Featured Dishes</h2>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
              </div>
            ) : featuredItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredItems.slice(0, 6).map((item) => (
                    <MenuCard key={item.id} item={item} onAddToCart={() => {}} />
                  ))}
                </div>
                <div className="text-center mt-10">
                  <Link to="/Menu" className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-[#c9a962]/30 text-white/80 hover:text-[#c9a962] hover:border-[#c9a962] transition-all font-inter text-sm">
                    View Full Menu <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-center text-white/40 font-inter py-12">Menu coming soon. Check back shortly!</p>
            )}
          </div>
        </section>
      )}

      {/* Services */}
      {availableServices.length > 0 && (
        <section className="py-20 px-4 bg-[#0f0f0f]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="font-inter text-sm tracking-[0.3em] text-[#c9a962] uppercase mb-3">What We Offer</p>
              <h2 className="font-playfair text-4xl text-white">Our Services</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {availableServices.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link
                    to={`/${service.page}`}
                    className="block p-6 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10 hover:border-[#c9a962]/40 hover:bg-[#1a1a1a] transition-all duration-300 group h-full"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#c9a962]/10 flex items-center justify-center mb-4 group-hover:bg-[#c9a962]/20 transition-colors">
                      <service.icon className="w-5 h-5 text-[#c9a962]" />
                    </div>
                    <h3 className="font-playfair text-lg text-white mb-2">{service.title}</h3>
                    <p className="font-inter text-sm text-white/50">{service.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Teaser */}
      {description && (
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-inter text-sm tracking-[0.3em] text-[#c9a962] uppercase mb-3">Our Story</p>
            <h2 className="font-playfair text-4xl text-white mb-6">About {name}</h2>
            <p className="font-cormorant text-xl text-white/60 leading-relaxed">
              {description.length > 300 ? description.substring(0, 300) + '...' : description}
            </p>
            <Link to="/About" className="inline-flex items-center gap-2 mt-8 text-[#c9a962] font-inter text-sm hover:gap-3 transition-all">
              Learn More <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Visit Us */}
      <section className="py-20 px-4 bg-[#0f0f0f]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-inter text-sm tracking-[0.3em] text-[#c9a962] uppercase mb-3">Get In Touch</p>
          <h2 className="font-playfair text-4xl text-white mb-8">Visit Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {address && (
              <div className="p-6 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10">
                <MapPin className="w-6 h-6 text-[#c9a962] mx-auto mb-3" />
                <p className="font-inter text-sm text-white/70">{address}</p>
              </div>
            )}
            {phone && (
              <div className="p-6 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10">
                <Phone className="w-6 h-6 text-[#c9a962] mx-auto mb-3" />
                <p className="font-inter text-sm text-white/70">{phone}</p>
              </div>
            )}
            {email && (
              <div className="p-6 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10">
                <Mail className="w-6 h-6 text-[#c9a962] mx-auto mb-3" />
                <p className="font-inter text-sm text-white/70">{email}</p>
              </div>
            )}
          </div>
          {socials.length > 0 && (
            <div className="flex justify-center gap-4">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full border border-[#c9a962]/30 flex items-center justify-center hover:bg-[#c9a962]/10 transition-all"
                >
                  <social.icon className="w-4 h-4 text-[#c9a962]" />
                </a>
              ))}
            </div>
          )}
          <Link to="/Contact" className="inline-flex items-center gap-2 mt-8 px-8 py-3 rounded-full border border-[#c9a962]/30 text-white/80 hover:text-[#c9a962] hover:border-[#c9a962] transition-all font-inter text-sm">
            Contact Us <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}