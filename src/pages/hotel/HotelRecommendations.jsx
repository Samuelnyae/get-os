import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import HotelLayout from '@/components/hotel/HotelLayout';
import LuxuryButton from '@/components/common/LuxuryButton';
import SectionHeader from '@/components/common/SectionHeader';
import MenuCard from '@/components/menu/MenuCard';

export default function HotelRecommendations() {
  const { slug } = useParams();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const { data: hotels = [], isLoading: hotelLoading } = useQuery({
    queryKey: ['hotel', slug],
    queryFn: () => base44.entities.Hotel.filter({ slug }),
  });
  const hotel = hotels[0];

  const { data: menuItems = [] } = useQuery({
    queryKey: ['hotel-menu', hotel?.id],
    queryFn: () => base44.entities.MenuItem.filter({ hotel_id: hotel.id }),
    enabled: !!hotel?.id,
  });

  const generateRecommendations = async () => {
    if (!menuItems.length) return;
    setLoading(true);
    try {
      const menuSummary = menuItems.map(i => `${i.name} (${i.category}, KES ${i.price})`).join(', ');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a culinary AI for ${hotel?.name}. Based on the menu: ${menuSummary}. Pick 6 must-try dishes that offer a balanced experience across categories. Return just the dish names as an array.`,
        response_json_schema: {
          type: 'object',
          properties: { recommended_names: { type: 'array', items: { type: 'string' } } }
        }
      });
      const names = result?.recommended_names || [];
      const matched = names
        .map(name => menuItems.find(i => i.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(i.name.toLowerCase())))
        .filter(Boolean);
      setRecommendations(matched.length ? matched : menuItems.slice(0, 6));
      setGenerated(true);
    } catch {
      setRecommendations(menuItems.slice(0, 6));
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  if (hotelLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" /></div>;
  if (!hotel) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Link to="/Hotels"><LuxuryButton>View All Locations</LuxuryButton></Link></div>;

  return (
    <HotelLayout hotel={hotel}>
      <div className="min-h-screen bg-[#0a0a0a] py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="AI Recommendations" subtitle="Curated Just For You" />

          {!generated ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
              <div className="w-24 h-24 rounded-full bg-[#c9a962]/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-[#c9a962]" />
              </div>
              <h3 className="font-playfair text-2xl text-white mb-3">Discover Your Perfect Meal</h3>
              <p className="font-inter text-white/50 mb-8 max-w-md mx-auto">
                Our AI sommelier will curate a personalized selection from {hotel.name}'s menu just for you.
              </p>
              <LuxuryButton onClick={generateRecommendations} disabled={loading || !menuItems.length} size="lg">
                {loading ? 'Curating...' : 'Get Recommendations'}
              </LuxuryButton>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                {recommendations.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <MenuCard item={item} />
                  </motion.div>
                ))}
              </div>
              <div className="text-center">
                <LuxuryButton variant="secondary" onClick={generateRecommendations} disabled={loading}>
                  <RefreshCw className="w-4 h-4 mr-2 inline" />
                  {loading ? 'Refreshing...' : 'Refresh Picks'}
                </LuxuryButton>
              </div>
            </>
          )}
        </div>
      </div>
    </HotelLayout>
  );
}