import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, ArrowLeft, Utensils } from 'lucide-react';
import MenuCard from '@/components/menu/MenuCard';
import SectionHeader from '@/components/common/SectionHeader';
import LuxuryButton from '@/components/common/LuxuryButton';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'starters', label: 'Starters' },
  { key: 'main_dishes', label: 'Main Dishes' },
  { key: 'desserts', label: 'Desserts' },
  { key: 'drinks', label: 'Drinks' },
];

export default function HotelPage() {
  const { slug } = useParams();
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: hotels = [], isLoading: loadingHotel } = useQuery({
    queryKey: ['hotel', slug],
    queryFn: () => base44.entities.Hotel.filter({ slug }),
  });

  const hotel = hotels[0];

  const { data: menuItems = [], isLoading: loadingMenu } = useQuery({
    queryKey: ['hotel-menu', hotel?.id],
    queryFn: () => base44.entities.MenuItem.filter({ hotel_id: hotel.id }),
    enabled: !!hotel?.id,
  });

  const filtered = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(i => i.category === activeCategory);

  if (loadingHotel) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="font-playfair text-3xl text-white mb-4">Location Not Found</h2>
          <p className="font-inter text-white/50 mb-6">This hotel location doesn't exist.</p>
          <Link to="/Hotels">
            <LuxuryButton>View All Locations</LuxuryButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <section className="relative h-72 md:h-96">
        <img
          src={hotel.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600'}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 via-transparent to-[#0a0a0a]" />
        <div className="absolute top-6 left-6">
          <Link to="/Hotels" className="flex items-center gap-2 text-white/70 hover:text-[#c9a962] transition-colors font-inter text-sm">
            <ArrowLeft className="w-4 h-4" />
            All Locations
          </Link>
        </div>
        <div className="absolute bottom-8 left-0 right-0 px-6 max-w-7xl mx-auto">
          <span className="font-inter text-xs tracking-[0.3em] text-[#c9a962] uppercase mb-2 block">
            {hotel.location}
          </span>
          <h1 className="font-playfair text-4xl md:text-5xl text-white">{hotel.name}</h1>
        </div>
      </section>

      {/* Info Bar */}
      <section className="bg-[#1a1a1a] border-y border-[#c9a962]/10 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-6 items-center">
          {hotel.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#c9a962]" />
              <span className="font-inter text-sm text-white/60">{hotel.address}</span>
            </div>
          )}
          {hotel.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#c9a962]" />
              <span className="font-inter text-sm text-white/60">{hotel.phone}</span>
            </div>
          )}
          {hotel.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#c9a962]" />
              <span className="font-inter text-sm text-white/60">{hotel.email}</span>
            </div>
          )}
          {hotel.opening_hours && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#c9a962]" />
              <span className="font-inter text-sm text-white/60">{hotel.opening_hours}</span>
            </div>
          )}
        </div>
      </section>

      {/* Menu */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="Our Menu" subtitle={hotel.name} />

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mb-10 justify-center">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-5 py-2 rounded-full font-inter text-sm transition-all ${
                  activeCategory === cat.key
                    ? 'bg-[#c9a962] text-[#0a0a0a]'
                    : 'border border-[#c9a962]/20 text-white/60 hover:border-[#c9a962]/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loadingMenu ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Utensils className="w-12 h-12 text-[#c9a962]/30 mx-auto mb-4" />
              <p className="font-inter text-white/40">No menu items yet for this location.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <MenuCard item={item} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}