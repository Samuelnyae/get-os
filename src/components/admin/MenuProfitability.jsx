import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, TrendingUp, TrendingDown, Zap, AlertTriangle, RefreshCw, DollarSign } from 'lucide-react';

const CATEGORIES = {
  star: { label: '⭐ Stars', desc: 'High Sales + High Profit', color: 'text-yellow-400', border: 'border-yellow-400/30', bg: 'bg-yellow-400/10' },
  workhorse: { label: '🐎 Workhorses', desc: 'High Sales + Low Profit', color: 'text-blue-400', border: 'border-blue-400/30', bg: 'bg-blue-400/10' },
  gem: { label: '💎 Hidden Gems', desc: 'Low Sales + High Profit', color: 'text-purple-400', border: 'border-purple-400/30', bg: 'bg-purple-400/10' },
  dog: { label: '🐕 Underperformers', desc: 'Low Sales + Low Profit', color: 'text-red-400', border: 'border-red-400/30', bg: 'bg-red-400/10' },
};

export default function MenuProfitability() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCat, setSelectedCat] = useState('all');

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-profitability'],
    queryFn: () => base44.entities.MenuItem.list('-created_date', 100),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders-profitability'],
    queryFn: () => base44.entities.Order.list('-created_date', 300),
  });

  const runAnalysis = async () => {
    setLoading(true);
    const itemSummary = menuItems.slice(0, 20).map(item => ({
      name: item.name,
      price: item.price,
      category: item.category,
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a restaurant profitability analyst. Analyze these menu items and categorize them.

Menu items: ${JSON.stringify(itemSummary)}
Total orders: ${orders.length}
Total revenue: KSh ${orders.reduce((s,o)=>s+(o.total_amount||0),0).toLocaleString()}

For each menu item, estimate:
- ingredient_cost (about 30-40% of price)
- prep_cost (about 10-15% of price)
- profit_margin (percentage)
- popularity_score (1-10)
- category: "star" | "workhorse" | "gem" | "dog"

Return JSON with:
- items: array of {name, price, ingredient_cost, prep_cost, profit_margin, popularity_score, category}
- recommendations: array of 4 strings
- total_analyzed: number`,
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                price: { type: 'number' },
                ingredient_cost: { type: 'number' },
                prep_cost: { type: 'number' },
                profit_margin: { type: 'number' },
                popularity_score: { type: 'number' },
                category: { type: 'string' },
              }
            }
          },
          recommendations: { type: 'array', items: { type: 'string' } },
          total_analyzed: { type: 'number' },
        }
      }
    });
    setAnalysis(result);
    setLoading(false);
  };

  const filtered = analysis?.items?.filter(i => selectedCat === 'all' || i.category === selectedCat) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-playfair text-2xl text-white">Menu Item Profitability</h2>
          <p className="font-inter text-sm text-white/50 mt-1">Analyze profit margins, popularity, and strategic categories</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading || menuItems.length === 0}
          className="flex items-center gap-2 px-5 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90 disabled:opacity-50 transition-all"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const count = analysis?.items?.filter(i => i.category === key).length || 0;
          return (
            <button key={key} onClick={() => setSelectedCat(selectedCat === key ? 'all' : key)}
              className={`p-4 rounded-xl border text-left transition-all ${cat.bg} ${cat.border} ${selectedCat === key ? 'ring-1 ring-white/40' : ''}`}>
              <p className={`font-inter text-sm font-semibold ${cat.color}`}>{cat.label}</p>
              <p className="font-inter text-xs text-white/50 mt-1">{cat.desc}</p>
              {analysis && <p className={`font-playfair text-2xl mt-2 ${cat.color}`}>{count}</p>}
            </button>
          );
        })}
      </div>

      {!analysis && !loading && (
        <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-12 text-center">
          <DollarSign className="w-12 h-12 text-[#c9a962]/40 mx-auto mb-4" />
          <p className="text-white/50 font-inter">Click "Run Analysis" to categorize your {menuItems.length} menu items</p>
        </div>
      )}

      {loading && (
        <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-12 text-center">
          <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 font-inter">Analyzing profitability of {menuItems.length} menu items...</p>
        </div>
      )}

      {analysis && !loading && (
        <>
          {/* Items Table */}
          <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#c9a962]/10 flex items-center justify-between">
              <h3 className="font-inter text-white font-semibold">Item Analysis ({filtered.length})</h3>
              <button onClick={() => setSelectedCat('all')} className="text-[#c9a962] font-inter text-xs hover:underline">
                {selectedCat !== 'all' ? 'Show All' : ''}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Item', 'Price', 'Ingredient Cost', 'Prep Cost', 'Profit Margin', 'Popularity', 'Category'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-inter text-xs text-white/40 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => {
                    const cat = CATEGORIES[item.category];
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="px-4 py-3 font-inter text-sm text-white">{item.name}</td>
                        <td className="px-4 py-3 font-inter text-sm text-white/70">KSh {item.price?.toLocaleString()}</td>
                        <td className="px-4 py-3 font-inter text-sm text-red-400">KSh {item.ingredient_cost?.toLocaleString()}</td>
                        <td className="px-4 py-3 font-inter text-sm text-orange-400">KSh {item.prep_cost?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-white/10 rounded-full h-1.5">
                              <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${item.profit_margin}%` }} />
                            </div>
                            <span className="text-green-400 font-inter text-xs">{item.profit_margin?.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-0.5">
                            {[...Array(10)].map((_, j) => (
                              <div key={j} className={`w-2 h-2 rounded-full ${j < item.popularity_score ? 'bg-[#c9a962]' : 'bg-white/10'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {cat && <span className={`font-inter text-xs px-2 py-1 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
            <h3 className="font-inter text-white font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#c9a962]" /> AI Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.recommendations?.map((r, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-[#c9a962]/5 border border-[#c9a962]/10 rounded-lg">
                  <span className="text-[#c9a962] font-inter text-xs font-bold mt-0.5">{i+1}.</span>
                  <p className="text-white/70 font-inter text-xs">{r}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}