import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertCircle, Lightbulb, RefreshCw } from 'lucide-react';
import LuxuryButton from '../common/LuxuryButton';

export default function AIInsights() {
  const [insights, setInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders-insights'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['admin-menu-insights'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['admin-comments-insights'],
    queryFn: () => base44.entities.Comment.list('-created_date', 100),
  });

  const { data: customRequests = [] } = useQuery({
    queryKey: ['admin-custom-insights'],
    queryFn: () => base44.entities.CustomFoodRequest.list('-created_date', 50),
  });

  const generateInsights = async () => {
    setIsGenerating(true);

    const totalRevenue = orders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const itemSales = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
      });
    });

    const topSellingItems = Object.entries(itemSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);

    const averageRating = comments.length > 0
      ? (comments.reduce((sum, c) => sum + (c.rating || 5), 0) / comments.length).toFixed(1)
      : 'N/A';

    const lowRatedItems = comments
      .filter(c => c.rating && c.rating < 3)
      .map(c => {
        const item = menuItems.find(m => m.id === c.menu_item_id);
        return item?.name;
      })
      .filter(Boolean);

    const requestedIngredients = customRequests
      .flatMap(r => r.ingredients_include || [])
      .reduce((acc, ing) => {
        acc[ing] = (acc[ing] || 0) + 1;
        return acc;
      }, {});

    const popularIngredients = Object.entries(requestedIngredients)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ing]) => ing);

    const dietaryTrends = customRequests
      .flatMap(r => r.dietary_preferences || [])
      .reduce((acc, pref) => {
        acc[pref] = (acc[pref] || 0) + 1;
        return acc;
      }, {});

    const prompt = `You are a restaurant business analyst AI for Hermanas Bites, a seven-star luxury dining establishment.

Based on the following data:
- Total Revenue: $${totalRevenue.toFixed(2)}
- Total Orders: ${orders.length}
- Top Selling Items: ${topSellingItems.join(', ')}
- Average Customer Rating: ${averageRating}/5
- Low-Rated Items: ${lowRatedItems.join(', ') || 'None'}
- Most Requested Custom Ingredients: ${popularIngredients.join(', ')}
- Dietary Preference Trends: ${Object.entries(dietaryTrends).map(([k, v]) => `${k} (${v})`).join(', ')}
- Current Menu Items: ${menuItems.length}
- Custom Requests: ${customRequests.length}

Please provide:
1. 3 NEW MENU ITEM SUGGESTIONS based on customer preferences and trends (be specific with dish names and descriptions)
2. 3 MENU IMPROVEMENTS for underperforming items
3. 2 BUSINESS INSIGHTS about trends and opportunities

Format as JSON:
{
  "newItems": [{"name": "...", "reason": "..."}],
  "improvements": [{"item": "...", "suggestion": "..."}],
  "insights": ["...", "..."]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          newItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                reason: { type: 'string' }
              }
            }
          },
          improvements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item: { type: 'string' },
                suggestion: { type: 'string' }
              }
            }
          },
          insights: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    setInsights(response);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-[#c9a962]" />
          <h3 className="font-playfair text-2xl text-white">AI Business Insights</h3>
        </div>
        <LuxuryButton onClick={generateInsights} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a] rounded-full animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Insights
            </>
          )}
        </LuxuryButton>
      </div>

      {insights ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Menu Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-[#c9a962]" />
              <h4 className="font-playfair text-xl text-white">New Menu Suggestions</h4>
            </div>
            <div className="space-y-4">
              {insights.newItems?.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#0a0a0a] border border-[#c9a962]/10">
                  <p className="font-inter font-medium text-white mb-2">{item.name}</p>
                  <p className="font-inter text-sm text-white/60">{item.reason}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Menu Improvements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#c9a962]" />
              <h4 className="font-playfair text-xl text-white">Improvement Suggestions</h4>
            </div>
            <div className="space-y-4">
              {insights.improvements?.map((imp, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#0a0a0a] border border-[#c9a962]/10">
                  <p className="font-inter font-medium text-[#c9a962] mb-2">{imp.item}</p>
                  <p className="font-inter text-sm text-white/60">{imp.suggestion}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Business Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10 lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-[#c9a962]" />
              <h4 className="font-playfair text-xl text-white">Strategic Insights</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.insights?.map((insight, i) => (
                <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-[#c9a962]/10 to-[#0a0a0a] border border-[#c9a962]/20">
                  <p className="font-inter text-sm text-white/80 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#1a1a1a] rounded-2xl p-12 border border-[#c9a962]/10 text-center"
        >
          <Brain className="w-16 h-16 text-[#c9a962]/30 mx-auto mb-4" />
          <p className="font-inter text-white/50">
            Click "Generate Insights" to get AI-powered recommendations based on your business data
          </p>
        </motion.div>
      )}
    </div>
  );
}