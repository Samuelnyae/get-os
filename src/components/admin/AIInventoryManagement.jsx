import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Sparkles, TrendingUp, AlertTriangle, Package, 
  Calendar, Loader2, ShoppingCart, CheckCircle, ArrowUpRight
} from 'lucide-react';
import LuxuryButton from '../common/LuxuryButton';
import { toast } from 'sonner';

export default function AIInventoryManagement() {
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationPlan, setOptimizationPlan] = useState(null);

  const queryClient = useQueryClient();

  const { data: menuItems = [] } = useQuery({
    queryKey: ['inventory-menu'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['inventory-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory-menu']);
    },
  });

  const analyzeInventoryData = () => {
    // Calculate historical demand
    const itemDemand = {};
    const monthlyDemand = {};
    
    orders.forEach(order => {
      const orderDate = new Date(order.created_date);
      const month = orderDate.toLocaleString('default', { month: 'short' });
      
      if (!monthlyDemand[month]) {
        monthlyDemand[month] = {};
      }
      
      order.items?.forEach(item => {
        itemDemand[item.name] = (itemDemand[item.name] || 0) + item.quantity;
        monthlyDemand[month][item.name] = (monthlyDemand[month][item.name] || 0) + item.quantity;
      });
    });

    // Find trending items
    const recentOrders = orders.slice(0, 50);
    const recentDemand = {};
    recentOrders.forEach(order => {
      order.items?.forEach(item => {
        recentDemand[item.name] = (recentDemand[item.name] || 0) + item.quantity;
      });
    });

    return { itemDemand, monthlyDemand, recentDemand };
  };

  const generateDemandPredictions = async () => {
    setIsPredicting(true);
    try {
      const analysis = analyzeInventoryData();

      // Get current date info
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentSeason = ['December', 'January', 'February'].includes(currentMonth) ? 'Winter' :
                           ['March', 'April', 'May'].includes(currentMonth) ? 'Spring' :
                           ['June', 'July', 'August'].includes(currentMonth) ? 'Summer' : 'Fall';

      const prompt = `You are an inventory management expert for "Get OS" luxury restaurant. Analyze the order history and predict ingredient demand for the next 7 days.

Current Month: ${currentMonth}
Current Season: ${currentSeason}
Total Historical Orders: ${orders.length}

Menu Items and Stock Levels:
${menuItems.map(item => 
  `- ${item.name}: Current stock: ${item.stock_count || 0}, Low threshold: ${item.low_stock_threshold || 10}, Ingredients: ${item.ingredients?.join(', ') || 'N/A'}`
).join('\n')}

Historical Item Demand (all time):
${Object.entries(analysis.itemDemand).slice(0, 20).map(([name, count]) => `- ${name}: ${count} orders`).join('\n')}

Recent Demand (last 50 orders):
${Object.entries(analysis.recentDemand).slice(0, 15).map(([name, count]) => `- ${name}: ${count} orders`).join('\n')}

Provide predictions for:
1. Expected demand for each menu item over next 7 days
2. Ingredient requirements based on recipes
3. Items at risk of stockout
4. Seasonal trends affecting demand
5. Reorder recommendations with quantities

Consider:
- Day of week patterns (weekends vs weekdays)
- Seasonal preferences
- Popular item trends
- Lead time for ingredient procurement (2-3 days typical)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            weekly_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item_name: { type: "string" },
                  predicted_demand: { type: "number" },
                  confidence: { type: "string" },
                  trend: { type: "string" }
                }
              }
            },
            stockout_risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item_name: { type: "string" },
                  current_stock: { type: "number" },
                  predicted_need: { type: "number" },
                  days_until_stockout: { type: "number" },
                  urgency: { type: "string" }
                }
              }
            },
            reorder_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item_name: { type: "string" },
                  suggested_quantity: { type: "number" },
                  reason: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            seasonal_insights: { type: "string" }
          }
        }
      });

      setPredictions(response);
      toast.success('Demand predictions generated');
    } catch (error) {
      toast.error('Failed to generate predictions: ' + error.message);
    } finally {
      setIsPredicting(false);
    }
  };

  const optimizeStockLevels = async () => {
    setIsOptimizing(true);
    try {
      const analysis = analyzeInventoryData();

      const prompt = `As an inventory optimization expert, create a stock level optimization plan for Get OS.

Current Inventory:
${menuItems.map(item => 
  `- ${item.name}: Stock: ${item.stock_count || 0}, Threshold: ${item.low_stock_threshold || 10}`
).join('\n')}

Historical Demand:
${Object.entries(analysis.itemDemand).slice(0, 20).map(([name, count]) => `- ${name}: ${count} total orders`).join('\n')}

Goals:
1. Minimize waste (items shouldn't sit too long)
2. Ensure availability (prevent stockouts)
3. Optimize reorder timing (2-3 days lead time)
4. Balance storage costs vs availability

For each menu item, provide:
- Recommended optimal stock level
- Recommended reorder point
- Reasoning based on demand patterns
- Waste reduction strategies
- Expected shelf life consideration`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            optimization_plan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item_name: { type: "string" },
                  current_stock: { type: "number" },
                  optimal_stock: { type: "number" },
                  reorder_point: { type: "number" },
                  reasoning: { type: "string" },
                  waste_reduction_tip: { type: "string" }
                }
              }
            },
            overall_strategy: { type: "string" },
            estimated_waste_reduction: { type: "string" }
          }
        }
      });

      setOptimizationPlan(response);
      toast.success('Optimization plan generated');
    } catch (error) {
      toast.error('Failed to optimize: ' + error.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const applyOptimization = async (item) => {
    const menuItem = menuItems.find(m => m.name === item.item_name);
    if (!menuItem) return;

    try {
      await updateMenuItemMutation.mutateAsync({
        id: menuItem.id,
        data: {
          ...menuItem,
          stock_count: item.optimal_stock,
          low_stock_threshold: item.reorder_point
        }
      });
      toast.success(`Updated stock levels for ${item.item_name}`);
    } catch (error) {
      toast.error('Failed to update: ' + error.message);
    }
  };

  const lowStockItems = menuItems.filter(item => 
    item.stock_count <= (item.low_stock_threshold || 10)
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[#c9a962]" />
            <span className="font-inter text-xs text-white/50 uppercase tracking-wider">Total Items</span>
          </div>
          <p className="font-playfair text-3xl text-white">{menuItems.length}</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-red-500/10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="font-inter text-xs text-white/50 uppercase tracking-wider">Low Stock</span>
          </div>
          <p className="font-playfair text-3xl text-white">{lowStockItems.length}</p>
          <p className="font-inter text-xs text-red-400 mt-1">Needs attention</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-blue-500/10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="font-inter text-xs text-white/50 uppercase tracking-wider">Orders Analyzed</span>
          </div>
          <p className="font-playfair text-3xl text-white">{orders.length}</p>
          <p className="font-inter text-xs text-white/40 mt-1">Historical data</p>
        </div>
      </div>

      {/* AI Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
          <Sparkles className="w-8 h-8 text-[#c9a962] mb-3" />
          <h3 className="font-playfair text-xl text-white mb-2">Demand Prediction</h3>
          <p className="font-inter text-sm text-white/60 mb-6">
            Predict ingredient demand for next 7 days based on order history, seasonality, and trends
          </p>
          <LuxuryButton onClick={generateDemandPredictions} disabled={isPredicting} className="w-full">
            {isPredicting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Generate Predictions
              </>
            )}
          </LuxuryButton>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
          <Package className="w-8 h-8 text-[#c9a962] mb-3" />
          <h3 className="font-playfair text-xl text-white mb-2">Stock Optimization</h3>
          <p className="font-inter text-sm text-white/60 mb-6">
            Optimize stock levels to minimize waste while ensuring availability
          </p>
          <LuxuryButton onClick={optimizeStockLevels} disabled={isOptimizing} className="w-full">
            {isOptimizing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Optimize Stock
              </>
            )}
          </LuxuryButton>
        </div>
      </div>

      {/* Predictions */}
      {predictions && (
        <div className="space-y-4">
          <h3 className="font-playfair text-xl text-white">Demand Forecast (Next 7 Days)</h3>

          {/* Seasonal Insights */}
          {predictions.seasonal_insights && (
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-inter text-sm text-blue-300 font-medium mb-1">Seasonal Insights</p>
                  <p className="font-inter text-sm text-white/70">{predictions.seasonal_insights}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stockout Risks */}
          {predictions.stockout_risks?.length > 0 && (
            <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-6">
              <h4 className="font-playfair text-lg text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                High Priority: Stockout Risks
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predictions.stockout_risks.map((risk, i) => (
                  <div key={i} className="bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-inter text-sm text-white font-medium">{risk.item_name}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-inter ${
                        risk.urgency === 'high' ? 'bg-red-500/20 text-red-300' :
                        risk.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {risk.urgency} priority
                      </span>
                    </div>
                    <div className="space-y-1 text-xs font-inter text-white/60">
                      <p>Current: {risk.current_stock} units</p>
                      <p>Predicted need: {risk.predicted_need} units</p>
                      <p className="text-red-400">Days until stockout: ~{risk.days_until_stockout}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reorder Suggestions */}
          {predictions.reorder_suggestions?.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
              <h4 className="font-playfair text-lg text-white mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#c9a962]" />
                Reorder Recommendations
              </h4>
              <div className="space-y-3">
                {predictions.reorder_suggestions.map((suggestion, i) => (
                  <div key={i} className="bg-[#0a0a0a] rounded-lg p-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-inter text-sm text-white font-medium">{suggestion.item_name}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-inter ${
                          suggestion.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                          suggestion.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-[#c9a962]/20 text-[#c9a962]'
                        }`}>
                          {suggestion.priority}
                        </span>
                      </div>
                      <p className="font-inter text-xs text-white/60 mb-2">{suggestion.reason}</p>
                      <p className="font-inter text-sm text-[#c9a962]">
                        Order: {suggestion.suggested_quantity} units
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Forecast */}
          {predictions.weekly_forecast?.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
              <h4 className="font-playfair text-lg text-white mb-4">Weekly Demand Forecast</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {predictions.weekly_forecast.slice(0, 9).map((forecast, i) => (
                  <div key={i} className="bg-[#0a0a0a] rounded-lg p-3">
                    <p className="font-inter text-sm text-white mb-1">{forecast.item_name}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-playfair text-xl text-[#c9a962]">{forecast.predicted_demand}</p>
                        <p className="font-inter text-xs text-white/50">units</p>
                      </div>
                      <div className="text-right">
                        <p className="font-inter text-xs text-white/70">{forecast.confidence}</p>
                        <div className="flex items-center gap-1 text-xs text-white/50">
                          <ArrowUpRight className={`w-3 h-3 ${
                            forecast.trend === 'increasing' ? 'text-green-400' :
                            forecast.trend === 'decreasing' ? 'text-red-400' : 'text-white/40'
                          }`} />
                          {forecast.trend}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optimization Plan */}
      {optimizationPlan && (
        <div className="space-y-4">
          <h3 className="font-playfair text-xl text-white">Stock Optimization Plan</h3>

          {/* Strategy Overview */}
          <div className="bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-[#c9a962] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-inter text-sm text-[#c9a962] font-medium mb-2">Optimization Strategy</p>
                <p className="font-inter text-sm text-white/80 leading-relaxed mb-3">
                  {optimizationPlan.overall_strategy}
                </p>
                <p className="font-inter text-xs text-white/60">
                  Expected waste reduction: {optimizationPlan.estimated_waste_reduction}
                </p>
              </div>
            </div>
          </div>

          {/* Individual Items */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
            <h4 className="font-playfair text-lg text-white mb-4">Item-by-Item Recommendations</h4>
            <div className="space-y-3">
              {optimizationPlan.optimization_plan?.map((item, i) => (
                <div key={i} className="bg-[#0a0a0a] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-inter text-sm text-white font-medium mb-1">{item.item_name}</p>
                      <div className="grid grid-cols-3 gap-3 mb-2">
                        <div>
                          <p className="font-inter text-xs text-white/50">Current</p>
                          <p className="font-inter text-sm text-white">{item.current_stock}</p>
                        </div>
                        <div>
                          <p className="font-inter text-xs text-white/50">Optimal</p>
                          <p className="font-inter text-sm text-[#c9a962]">{item.optimal_stock}</p>
                        </div>
                        <div>
                          <p className="font-inter text-xs text-white/50">Reorder at</p>
                          <p className="font-inter text-sm text-yellow-400">{item.reorder_point}</p>
                        </div>
                      </div>
                      <p className="font-inter text-xs text-white/60 mb-2">{item.reasoning}</p>
                      <p className="font-inter text-xs text-green-300">💡 {item.waste_reduction_tip}</p>
                    </div>
                    <LuxuryButton 
                      size="sm" 
                      variant="secondary"
                      onClick={() => applyOptimization(item)}
                    >
                      Apply
                    </LuxuryButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}