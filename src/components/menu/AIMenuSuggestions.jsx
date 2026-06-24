import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, ShoppingCart, Loader2 } from 'lucide-react';
import MenuCard from './MenuCard';
import LuxuryButton from '../common/LuxuryButton';

export default function AIMenuSuggestions({ currentItemId, cartItems = [] }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: allMenuItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => base44.entities.MenuItem.list('-created_date'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return await base44.entities.Order.filter({ customer_email: user.email }, '-created_date', 10);
      } catch {
        return [];
      }
    },
  });

  const generateSuggestions = async () => {
    if (allMenuItems.length === 0) return;
    
    setIsGenerating(true);
    try {
      // Build context from past orders and current cart
      const pastOrderItems = orders.flatMap(order => 
        order.items?.map(item => item.name) || []
      );
      const cartItemNames = cartItems.map(item => item.name);
      const currentItem = currentItemId 
        ? allMenuItems.find(item => item.id === currentItemId)
        : null;

      const context = {
        pastOrders: pastOrderItems.slice(0, 10),
        currentCart: cartItemNames,
        currentlyViewing: currentItem?.name,
        availableItems: allMenuItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          likes: item.likes_count || 0
        }))
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI sommelier and food pairing expert for Get OS, a luxury restaurant.

Context:
- Customer's past orders: ${context.pastOrders.length > 0 ? context.pastOrders.join(', ') : 'No past orders'}
- Current cart items: ${context.currentCart.length > 0 ? context.currentCart.join(', ') : 'Empty cart'}
- Currently viewing: ${context.currentlyViewing || 'Browse menu'}

Available menu items:
${context.availableItems.map(item => `- ${item.name} (${item.category}): ${item.description}`).join('\n')}

Suggest 3-4 menu items that would complement their selections or match their preferences. Consider:
1. Complementary flavors and food pairings
2. Popular items (higher likes count)
3. Variety across categories
4. Their ordering history

Return ONLY the IDs of suggested items, no duplicates.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_item_ids: {
              type: "array",
              items: { type: "string" },
              description: "Array of menu item IDs to recommend"
            },
            reason: {
              type: "string",
              description: "Brief explanation of why these items were suggested"
            }
          }
        }
      });

      const suggestedItems = response.suggested_item_ids
        .map(id => allMenuItems.find(item => item.id === id))
        .filter(Boolean)
        .slice(0, 4);

      setSuggestions({ items: suggestedItems, reason: response.reason });
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (allMenuItems.length > 0 && !isGenerating && suggestions.length === 0) {
      generateSuggestions();
    }
  }, [allMenuItems, currentItemId, cartItems]);

  if (!suggestions.items || suggestions.items.length === 0) {
    if (isGenerating) {
      return (
        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10">
          <div className="flex items-center justify-center gap-3 text-[#c9a962]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="font-inter text-sm">Curating personalized recommendations...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-playfair text-2xl text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#c9a962]" />
            Recommended For You
          </h3>
          {suggestions.reason && (
            <p className="font-inter text-sm text-white/60 max-w-2xl">
              {suggestions.reason}
            </p>
          )}
        </div>
        <LuxuryButton 
          variant="ghost" 
          size="sm" 
          onClick={generateSuggestions}
          disabled={isGenerating}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh
        </LuxuryButton>
      </div>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {suggestions.items.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </motion.div>
  );
}