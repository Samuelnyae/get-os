import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Star } from 'lucide-react';
import HotelLayout from '@/components/hotel/HotelLayout';
import SectionHeader from '@/components/common/SectionHeader';
import LuxuryButton from '@/components/common/LuxuryButton';

export default function HotelAbout() {
  const { slug } = useParams();
  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['hotel', slug],
    queryFn: () => base44.entities.Hotel.filter({ slug }),
  });
  const hotel = hotels[0];

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" /></div>;
  if (!hotel) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Link to="/Hotels"><LuxuryButton>View All Locations</LuxuryButton></Link></div>;

  return (
    <HotelLayout hotel={hotel}>
      <div className="min-h-screen bg-[#0a0a0a] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <SectionHeader title={`About ${hotel.name}`} subtitle="Our Story" />

          {/* Hero Image */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden mb-12 h-72 md:h-96">
            <img
              src={hotel.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600'}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Description */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10 mb-8">
            <p className="font-cormorant text-xl text-white/80 leading-relaxed">
              {hotel.description || `${hotel.name} is a premier dining destination in ${hotel.location}, offering an exceptional culinary journey with the finest ingredients, expertly crafted dishes, and impeccable service. We invite you to experience the art of fine dining.`}
            </p>
          </motion.div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              { icon: MapPin, label: 'Location', value: hotel.address || hotel.location },
              { icon: Phone, label: 'Phone', value: hotel.phone },
              { icon: Mail, label: 'Email', value: hotel.email },
              { icon: Clock, label: 'Opening Hours', value: hotel.opening_hours },
            ].filter(d => d.value).map((detail, i) => (
              <motion.div
                key={detail.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="bg-[#1a1a1a] rounded-xl p-6 border border-[#c9a962]/10 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-[#c9a962]/10 flex items-center justify-center flex-shrink-0">
                  <detail.icon className="w-5 h-5 text-[#c9a962]" />
                </div>
                <div>
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">{detail.label}</p>
                  <p className="font-inter text-sm text-white/80">{detail.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Experience Highlights */}
          <SectionHeader title="The Experience" subtitle="What Sets Us Apart" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Exquisite Cuisine', desc: 'Every dish is crafted with premium ingredients and culinary artistry.' },
              { title: 'Warm Hospitality', desc: 'Our staff is dedicated to making every visit a memorable occasion.' },
              { title: 'Elegant Ambiance', desc: 'A stunning setting that perfectly complements the dining experience.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1a1a1a] rounded-xl p-6 border border-[#c9a962]/10 text-center"
              >
                <Star className="w-8 h-8 text-[#c9a962] mx-auto mb-4" />
                <h3 className="font-playfair text-xl text-white mb-2">{item.title}</h3>
                <p className="font-inter text-sm text-white/50">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </HotelLayout>
  );
}