import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Utensils, Calendar, Truck, ChefHat, Star, Coffee, LayoutDashboard, ArrowRight } from 'lucide-react';
import HotelLayout from '@/components/hotel/HotelLayout';
import LuxuryButton from '@/components/common/LuxuryButton';
import MenuCard from '@/components/menu/MenuCard';
import SectionHeader from '@/components/common/SectionHeader';

export default function HotelHome() {
  const { slug } = useParams();

  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['hotel', slug],
    queryFn: () => base44.entities.Hotel.filter({ slug }),
  });
  const hotel = hotels[0];

  const { data: featuredItems = [] } = useQuery({
    queryKey: ['hotel-featured', hotel?.id],
    queryFn: () => base44.entities.MenuItem.filter({ hotel_id: hotel.id, is_featured: true }),
    enabled: !!hotel?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 text-center">
        <div>
          <h2 className="font-playfair text-3xl text-white mb-4">Location Not Found</h2>
          <Link to="/Hotels"><LuxuryButton>View All Locations</LuxuryButton></Link>
        </div>
      </div>
    );
  }

  const base = `/hotel/${slug}`;

  const quickLinks = [
    { href: `${base}/menu`, icon: Utensils, label: 'View Menu', desc: 'Browse our full menu' },
    { href: `${base}/reservations`, icon: Calendar, label: 'Reserve a Table', desc: 'Book your dining experience' },
    { href: `${base}/track-order`, icon: Truck, label: 'Track Order', desc: 'Real-time order updates' },
    { href: `${base}/table-dining`, icon: Coffee, label: 'Table Dining', desc: 'Group ordering made easy' },
    { href: `${base}/customize`, icon: ChefHat, label: 'Customize Order', desc: 'Your dish, your way' },
    { href: `${base}/recommendations`, icon: Star, label: 'Recommendations', desc: 'AI-powered picks for you' },
  ];

  return (
    <HotelLayout hotel={hotel}>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Hero */}
        <section className="relative h-[60vh] min-h-[400px]">
          <img
            src={hotel.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600'}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 via-[#0a0a0a]/20 to-[#0a0a0a]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-inter text-xs tracking-[0.4em] text-[#c9a962] uppercase mb-4 block"
            >
              {hotel.location}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-playfair text-5xl md:text-7xl text-white mb-6"
            >
              {hotel.name}
            </motion.h1>
            {hotel.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-cormorant text-xl text-white/70 max-w-xl mb-8"
              >
                {hotel.description}
              </motion.p>
            )}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex gap-4 flex-wrap justify-center">
              <Link to={`${base}/menu`}><LuxuryButton size="lg">View Menu</LuxuryButton></Link>
              <Link to={`${base}/reservations`}><LuxuryButton variant="secondary" size="lg">Reserve a Table</LuxuryButton></Link>
            </motion.div>
          </div>
        </section>

        {/* Info Bar */}
        <section className="bg-[#1a1a1a] border-y border-[#c9a962]/10 py-4 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-6 items-center justify-center">
            {hotel.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#c9a962]" /><span className="font-inter text-sm text-white/60">{hotel.address}</span></div>}
            {hotel.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#c9a962]" /><span className="font-inter text-sm text-white/60">{hotel.phone}</span></div>}
            {hotel.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#c9a962]" /><span className="font-inter text-sm text-white/60">{hotel.email}</span></div>}
            {hotel.opening_hours && <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#c9a962]" /><span className="font-inter text-sm text-white/60">{hotel.opening_hours}</span></div>}
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <SectionHeader title="Explore & Order" subtitle="What would you like to do?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link to={link.href} className="group block bg-[#1a1a1a] border border-[#c9a962]/10 hover:border-[#c9a962]/40 rounded-2xl p-6 transition-all duration-300 hover:bg-[#1a1a1a]/80">
                    <div className="w-12 h-12 rounded-xl bg-[#c9a962]/10 flex items-center justify-center mb-4 group-hover:bg-[#c9a962]/20 transition-colors">
                      <link.icon className="w-6 h-6 text-[#c9a962]" />
                    </div>
                    <h3 className="font-playfair text-xl text-white mb-1 group-hover:text-[#c9a962] transition-colors">{link.label}</h3>
                    <p className="font-inter text-sm text-white/50 mb-4">{link.desc}</p>
                    <div className="flex items-center gap-1 text-[#c9a962] text-sm font-inter">
                      Go <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Items */}
        {featuredItems.length > 0 && (
          <section className="py-16 px-4 bg-[#0f0f0f]">
            <div className="max-w-7xl mx-auto">
              <SectionHeader title="Featured Dishes" subtitle="Chef's Picks" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredItems.slice(0, 6).map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <MenuCard item={item} cartKey={`hermanas_cart_${slug}`} hotelSlug={slug} />
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-10">
                <Link to={`${base}/menu`}><LuxuryButton variant="secondary">View Full Menu</LuxuryButton></Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </HotelLayout>
  );
}