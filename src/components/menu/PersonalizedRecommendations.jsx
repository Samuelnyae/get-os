import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, RefreshCw, User } from 'lucide-react';
import MenuCard from './MenuCard';
import LuxuryButton from '../common/LuxuryButton';

const PREC_CACHE_KEY = 'db_personalized_recs_cache';
const PREC_CACHE_TTL = 1000 * 60 * 60 * 4; // 4 hours

const loadPrecsCache = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(PREC_CACHE_KEY) || 'null');
    if (stored && Date.now() - stored.timestamp < PREC_CACHE_TTL) return stored.data;
  } catch {}
  return null;
};

export default function PersonalizedRecommendations({ cartItems = [] }) {
  const [recommendations, setRecommendations] = useState(() => loadPrecsCache());
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewedItems, setViewedItems] = useState([]);

  const { data: allMenuItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => base44.entities.MenuItem.list('-created_date'),
  });

  const { data: userOrders = [] } = useQuery({
    queryKey: ['user-order-history'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return await base44.entities.Order.filter({ customer_email: user.email }, '-created_date', 20);
      } catch {
        return [];
      }
    },
  });

  // Track browsing behavior
  useEffect(() => {
    const viewed = JSON.parse(localStorage.getItem('hermanas_viewed_items') || '[]');
    setViewedItems(viewed);
  }, []);

  const generatePersonalizedRecommendations = async () => {
    if (allMenuItems.length === 0) return;
    
    setIsGenerating(true);
    try {
      // Analyze order history
      const orderFrequency = {};
      const categoryPreference = {};
      
      userOrders.forEach(order => {
        order.items?.forEach(item => {
          orderFrequency[item.name] = (orderFrequency[item.name] || 0) + 1;
          const menuItem = allMenuItems.find(m => m.name === item.name);
          if (menuItem) {
            categoryPreference[menuItem.category] = (categoryPreference[menuItem.category] || 0) + 1;
          }
        });
      });

      const favoriteItems = Object.entries(orderFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      const preferredCategories = Object.entries(categoryPreference)
        .sort((a, b) => b[1] - a[1])
        .map(([cat]) => cat);

      const cartItemNames = cartItems.map(item => item.name);
      const recentlyViewedNames = viewedItems.slice(0, 10);

      const prompt = `You are an AI personalization engine for "Hermanas Bites" luxury restaurant. Analyze customer behavior and provide highly personalized menu recommendations.

CUSTOMER PROFILE:
Order History: ${userOrders.length} orders
Favorite Items: ${favoriteItems.length > 0 ? favoriteItems.join(', ') : 'No history yet'}
Preferred Categories: ${preferredCategories.length > 0 ? preferredCategories.join(', ') : 'No preference detected'}
Recently Viewed: ${recentlyViewedNames.length > 0 ? recentlyViewedNames.join(', ') : 'None'}
Current Cart: ${cartItemNames.length > 0 ? cartItemNames.join(', ') : 'Empty'}

AVAILABLE MENU:
${allMenuItems.map(item => 
  `- ${item.id}: ${item.name} (${item.category}, KES ${item.price}) - ${item.description || 'No description'}, Likes: ${item.likes_count || 0}`
).join('\n')}

TASK:
Recommend 4-6 items that:
1. Match their taste preferences based on order history
2. Complement items in their cart
3. Are similar to items they've viewed
4. Introduce variety while staying within preferred categories
5. Include both familiar favorites and exciting new discoveries

Provide personalized reasoning for each recommendation.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item_id: { type: "string" },
                  reason: { type: "string" },
                  match_score: { type: "number" }
                }
              }
            },
            personalization_summary: { type: "string" }
          }
        }
      });

      const recommendedItems = response.recommendations
        .map(rec => ({
          ...allMenuItems.find(item => item.id === rec.item_id),
          reason: rec.reason,
          match_score: rec.match_score
        }))
        .filter(item => item.id)
        .slice(0, 6);

      const result = {
        items: recommendedItems,
        summary: response.personalization_summary
      };
      setRecommendations(result);
      localStorage.setItem(PREC_CACHE_KEY, JSON.stringify({ data: result, timestamp: Date.now() }));
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (allMenuItems.length > 0 && !recommendations && !isGenerating) {
      generatePersonalizedRecommendations();
    }
  }, [allMenuItems]);

  if (isGenerating && !recommendations) {
    return (
      <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10">
        <div className="flex items-center justify-center gap-3 text-[#c9a962]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="font-inter text-sm">Analyzing your preferences...</p>
        </div>
      </div>
    );
  }

  if (!recommendations) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-2xl p-8 border border-[#c9a962]/10"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-playfair text-2xl text-white mb-2 flex items-center gap-2">
            <User className="w-6 h-6 text-[#c9a962]" />
            Personalized For You
          </h3>
          <p className="font-inter text-sm text-white/60 max-w-2xl">
            {recommendations.summary}
          </p>
        </div>
        <LuxuryButton 
          variant="ghost" 
          size="sm" 
          onClick={generatePersonalizedRecommendations}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </LuxuryButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.items.map((item) => (
          <div key={item.id} className="relative">
            <MenuCard item={item} />
            {item.reason && (
              <div className="mt-2 bg-[#c9a962]/10 rounded-lg p-2">
                <p className="font-inter text-xs text-[#c9a962] flex items-start gap-1">
                  <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {item.reason}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}