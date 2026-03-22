import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, ArrowRight } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';

export default function Hotels() {
  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => base44.entities.Hotel.filter({ is_active: true }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title="Our Locations"
          subtitle="Hermanas Bites Network"
        />

        {hotels.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-inter text-white/50">No locations available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map((hotel, index) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/hotel/${hotel.slug}`} className="block group">
                  <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#c9a962]/10 hover:border-[#c9a962]/40 transition-all duration-300 h-full">
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={hotel.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-[#c9a962]/20 border border-[#c9a962]/40 font-inter text-xs text-[#c9a962] uppercase tracking-wider">
                          {hotel.location}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-playfair text-2xl text-white mb-2 group-hover:text-[#c9a962] transition-colors">
                        {hotel.name}
                      </h3>
                      {hotel.description && (
                        <p className="font-inter text-sm text-white/50 mb-4 line-clamp-2">
                          {hotel.description}
                        </p>
                      )}

                      <div className="space-y-2 mb-6">
                        {hotel.address && (
                          <div className="flex items-center gap-2 text-white/50">
                            <MapPin className="w-3.5 h-3.5 text-[#c9a962] flex-shrink-0" />
                            <span className="font-inter text-xs">{hotel.address}</span>
                          </div>
                        )}
                        {hotel.phone && (
                          <div className="flex items-center gap-2 text-white/50">
                            <Phone className="w-3.5 h-3.5 text-[#c9a962] flex-shrink-0" />
                            <span className="font-inter text-xs">{hotel.phone}</span>
                          </div>
                        )}
                        {hotel.opening_hours && (
                          <div className="flex items-center gap-2 text-white/50">
                            <Clock className="w-3.5 h-3.5 text-[#c9a962] flex-shrink-0" />
                            <span className="font-inter text-xs">{hotel.opening_hours}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[#c9a962] font-inter text-sm">
                        View Menu & Order
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}