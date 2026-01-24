import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Zap, Package, Loader2, TrendingUp } from 'lucide-react';
import MenuCard from './MenuCard';
import LuxuryButton from '../common/LuxuryButton';

export default function DailySpecials() {
  const [specials, setSpecials] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => base44.entities.MenuItem.list('-created_date'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const generateDailySpecials = async () => {
    if (menuItems.length === 0) return;

    setIsGenerating(true);
    try {
      // Analyze popular combinations
      const itemPairings = {};
      orders.forEach(order => {
        const items = order.items?.map(i => i.name) || [];
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const pair = [items[i], items[j]].sort().join(' + ');
            itemPairings[pair] = (itemPairings[pair] || 0) + 1;
          }
        }
      });

      const topPairings = Object.entries(itemPairings)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      // Calculate item popularity
      const itemPopularity = {};
      orders.forEach(order => {
        order.items?.forEach(item => {
          itemPopularity[item.name] = (itemPopularity[item.name] || 0) + 1;
        });
      });

      const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });

      const prompt = `You are the head chef at "Hermanas Bites" designing today's specials and bundle offers.

TODAY'S DATE: ${currentDate}

AVAILABLE MENU ITEMS:
${menuItems.map(item => 
  `- ${item.name} (${item.category}, $${item.price}): ${item.description || 'No description'}, Stock: ${item.stock_count || 0}, Likes: ${item.likes_count || 0}`
).join('\n')}

POPULAR COMBINATIONS (from order history):
${topPairings.map(([pair, count]) => `- ${pair}: ordered together ${count} times`).join('\n')}

POPULAR ITEMS:
${Object.entries(itemPopularity).slice(0, 15).map(([name, count]) => `- ${name}: ${count} orders`).join('\n')}

CREATE:
1. Today's Special (1-2 spotlight items with 10-15% discount)
2. Bundle Offers (2-3 meal combinations at special prices)

Consider:
- Items with high stock that need to move
- Popular pairings that complement each other
- Seasonal appropriateness
- Balance across categories (starter + main, main + drink, etc.)
- Value proposition (bundles should save 15-20%)

For each, provide the item IDs, bundle composition, pricing, and compelling marketing description.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            featured_special: {
              type: "object",
              properties: {
                item_name: { type: "string" },
                original_price: { type: "number" },
                special_price: { type: "number" },
                description: { type: "string" },
                reason: { type: "string" }
              }
            },
            bundle_offers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bundle_name: { type: "string" },
                  items: { type: "array", items: { type: "string" } },
                  original_price: { type: "number" },
                  bundle_price: { type: "number" },
                  savings: { type: "number" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSpecials({
        date: currentDate,
        featured: response.featured_special,
        bundles: response.bundle_offers
      });
    } catch (error) {
      console.error('Failed to generate specials:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Check if we already generated specials today
    const cached = localStorage.getItem('hermanas_daily_specials');
    if (cached) {
      const parsed = JSON.parse(cached);
      const today = new Date().toDateString();
      if (parsed.date === today) {
        setSpecials(parsed.data);
        return;
      }
    }

    if (menuItems.length > 0 && orders.length > 0 && !specials && !isGenerating) {
      generateDailySpecials().then(() => {
        if (specials) {
          localStorage.setItem('hermanas_daily_specials', JSON.stringify({
            date: new Date().toDateString(),
            data: specials
          }));
        }
      });
    }
  }, [menuItems, orders]);

  if (isGenerating && !specials) {
    return (
      <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10">
        <div className="flex items-center justify-center gap-3 text-[#c9a962]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="font-inter text-sm">Crafting today's specials...</p>
        </div>
      </div>
    );
  }

  if (!specials) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Featured Special */}
      {specials.featured && (
        <div className="bg-gradient-to-r from-[#c9a962]/20 to-[#e4d5a7]/10 rounded-2xl p-8 border border-[#c9a962]/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-[#c9a962]" />
                <span className="font-inter text-xs text-[#c9a962] uppercase tracking-wider">
                  Today's Special - {specials.date}
                </span>
              </div>
              <h3 className="font-playfair text-3xl text-white mb-2">
                {specials.featured.item_name}
              </h3>
              <p className="font-inter text-sm text-white/70 mb-3">
                {specials.featured.description}
              </p>
              <p className="font-inter text-xs text-white/50 italic">
                {specials.featured.reason}
              </p>
            </div>
            <div className="text-right">
              <div className="font-inter text-sm text-white/50 line-through">
                ${specials.featured.original_price.toFixed(2)}
              </div>
              <div className="font-playfair text-3xl text-[#c9a962]">
                ${specials.featured.special_price.toFixed(2)}
              </div>
              <div className="font-inter text-xs text-green-400 mt-1">
                Save ${(specials.featured.original_price - specials.featured.special_price).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bundle Offers */}
      {specials.bundles && specials.bundles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-[#c9a962]" />
            <h3 className="font-playfair text-2xl text-white">Bundle Offers</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specials.bundles.map((bundle, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1a1a1a] rounded-xl p-6 border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-playfair text-xl text-white">
                    {bundle.bundle_name}
                  </h4>
                  <Zap className="w-5 h-5 text-[#c9a962]" />
                </div>

                <p className="font-inter text-sm text-white/60 mb-4">
                  {bundle.description}
                </p>

                <div className="space-y-2 mb-4">
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider">
                    Includes:
                  </p>
                  {bundle.items.map((item, j) => (
                    <div key={j} className="font-inter text-sm text-white/70 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#c9a962]" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#c9a962]/10 pt-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="font-inter text-xs text-white/50 line-through">
                        ${bundle.original_price.toFixed(2)}
                      </div>
                      <div className="font-playfair text-2xl text-[#c9a962]">
                        ${bundle.bundle_price.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-inter text-xs text-green-400">
                        Save ${bundle.savings.toFixed(2)}
                      </div>
                      <div className="font-inter text-xs text-white/50">
                        {((bundle.savings / bundle.original_price) * 100).toFixed(0)}% off
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <LuxuryButton 
          variant="ghost" 
          size="sm"
          onClick={() => {
            localStorage.removeItem('hermanas_daily_specials');
            setSpecials(null);
            generateDailySpecials();
          }}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <TrendingUp className="w-4 h-4 mr-2" />
          )}
          Regenerate Specials
        </LuxuryButton>
      </div>
    </motion.div>
  );
}