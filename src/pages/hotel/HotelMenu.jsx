import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Utensils } from 'lucide-react';
import MenuCard from '@/components/menu/MenuCard';
import SectionHeader from '@/components/common/SectionHeader';
import LuxuryButton from '@/components/common/LuxuryButton';
import HotelLayout from '@/components/hotel/HotelLayout';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'starters', label: 'Starters' },
  { key: 'main_dishes', label: 'Main Dishes' },
  { key: 'desserts', label: 'Desserts' },
  { key: 'drinks', label: 'Drinks' },
];

export default function HotelMenu() {
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

  const filtered = activeCategory === 'all' ? menuItems : menuItems.filter(i => i.category === activeCategory);

  if (loadingHotel) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" /></div>;

  if (!hotel) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Link to="/Hotels"><LuxuryButton>View All Locations</LuxuryButton></Link></div>;

  return (
    <HotelLayout hotel={hotel}>
      <div className="min-h-screen bg-[#0a0a0a] py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="Our Menu" subtitle={hotel.name} />
          <div className="flex flex-wrap gap-3 mb-10 justify-center">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-5 py-2 rounded-full font-inter text-sm transition-all ${activeCategory === cat.key ? 'bg-[#c9a962] text-[#0a0a0a]' : 'border border-[#c9a962]/20 text-white/60 hover:border-[#c9a962]/50'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {loadingMenu ? (
            <div className="flex justify-center py-12"><div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Utensils className="w-12 h-12 text-[#c9a962]/30 mx-auto mb-4" />
              <p className="font-inter text-white/40">No menu items yet for this location.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <MenuCard item={item} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </HotelLayout>
  );
}