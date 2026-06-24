import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import MenuCard from '../menu/MenuCard';
import LuxuryButton from '../common/LuxuryButton';

const CACHE_KEY = 'hermanas_recommendations';
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

const loadCached = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (stored && Date.now() - stored.timestamp < CACHE_TTL) return stored.items;
  } catch {}
  return [];
};

const saveCache = (items) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ items, timestamp: Date.now() }));
};

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState(() => loadCached());
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 20),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['all-menu-items'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: likes = [] } = useQuery({
    queryKey: ['user-likes'],
    queryFn: () => base44.entities.Like.list('-created_date', 50),
  });

  const { data: customRequests = [] } = useQuery({
    queryKey: ['user-custom-requests'],
    queryFn: () => base44.entities.CustomFoodRequest.list('-created_date', 10),
  });

  const [error, setError] = useState(null);

  const generateRecommendations = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const orderedItems = orders.flatMap(o => o.items?.map(i => i.name) || []);
      const likedItemIds = likes.map(l => l.menu_item_id);
      const likedItems = menuItems.filter(m => likedItemIds.includes(m.id));
      
      const dietaryPreferences = [...new Set(
        customRequests.flatMap(r => r.dietary_preferences || [])
      )];
      
      const preferredCategories = [...new Set(
        customRequests.map(r => r.food_category).filter(Boolean)
      )];

      const prompt = `You are a luxury restaurant AI sommelier for Get OS, a seven-star dining establishment.

Based on the customer's profile:
- Previously ordered: ${orderedItems.join(', ') || 'None yet'}
- Liked items: ${likedItems.map(i => i.name).join(', ') || 'None yet'}
- Dietary preferences: ${dietaryPreferences.join(', ') || 'None specified'}
- Preferred categories: ${preferredCategories.join(', ') || 'All'}

Available menu items:
${menuItems.map(m => `- ${m.name} (${m.category}, KES ${m.price}) - ${m.description}`).join('\n')}

Please recommend 3-4 menu items that would be perfect for this customer. Consider their tastes, preferences, and dining history. Return ONLY the exact names of the dishes from the menu, one per line.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });

      const recommendedNames = response.split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean);

      const recommendedItems = menuItems.filter(item =>
        recommendedNames.some(name => 
          item.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(item.name.toLowerCase())
        )
      ).slice(0, 4);

      setRecommendations(recommendedItems);
      saveCache(recommendedItems);
    } catch (err) {
      setError('AI recommendations are currently unavailable. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (error) {
    return (
      <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-red-500/20 text-center">
        <p className="font-inter text-white/60">{error}</p>
      </div>
    );
  }

  if (recommendations.length === 0 && !isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-[#c9a962]/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-[#c9a962]" />
        </div>
        <h3 className="font-playfair text-2xl text-white mb-2">
          Personalized Recommendations
        </h3>
        <p className="font-inter text-white/60 mb-6 max-w-md mx-auto">
          Let our AI sommelier suggest dishes perfectly tailored to your taste
        </p>
        <LuxuryButton onClick={generateRecommendations}>
          <Sparkles className="w-4 h-4 mr-2" />
          Get My Recommendations
        </LuxuryButton>
      </motion.div>
    );
  }

  if (isGenerating) {
    return (
      <div className="bg-[#1a1a1a] rounded-2xl p-12 border border-[#c9a962]/10 text-center">
        <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin mx-auto mb-4" />
        <p className="font-inter text-white/60">Curating your perfect dining experience...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-[#c9a962]" />
          <h3 className="font-playfair text-2xl text-white">Recommended For You</h3>
        </div>
        <LuxuryButton variant="secondary" size="sm" onClick={generateRecommendations}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </LuxuryButton>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}