import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, Loader2, RefreshCw, Send, CheckCircle, Zap, Bot } from 'lucide-react';
import { toast } from 'sonner';
import LuxuryButton from '../common/LuxuryButton';

export default function AIInventoryReorderAgent() {
  const [isRunning, setIsRunning] = useState(false);
  const [reorderPlan, setReorderPlan] = useState(null);
  const [acknowledged, setAcknowledged] = useState(new Set());
  const qc = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory-reorder'],
    queryFn: () => base44.entities.Inventory.list(),
    refetchInterval: 30000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders-for-reorder'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const updateInventory = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Inventory.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory-reorder'] }),
  });

  const criticalItems = inventory.filter(i => i.current_stock <= i.low_stock_threshold);
  const outOfStock = inventory.filter(i => i.current_stock === 0);

  const runReorderAgent = async () => {
    setIsRunning(true);
    try {
      // Calculate demand velocity from recent orders
      const itemDemand = {};
      orders.slice(0, 100).forEach(o => {
        o.items?.forEach(item => {
          const inv = inventory.find(i => i.linked_menu_item_ids?.includes(item.menu_item_id));
          if (inv) {
            itemDemand[inv.id] = (itemDemand[inv.id] || 0) + (item.quantity * (inv.deduct_per_order || 1));
          }
        });
      });

      const inventorySummary = inventory.map(i => ({
        id: i.id,
        name: i.name,
        current_stock: i.current_stock,
        threshold: i.low_stock_threshold,
        unit: i.unit,
        supplier: i.supplier || 'unknown',
        daily_demand: Math.round((itemDemand[i.id] || 0) / 14), // avg over 2 weeks
        days_remaining: i.current_stock > 0 ? Math.round(i.current_stock / Math.max(1, (itemDemand[i.id] || 1) / 14)) : 0,
        status: i.current_stock === 0 ? 'OUT_OF_STOCK' : i.current_stock <= i.low_stock_threshold ? 'LOW' : 'OK'
      }));

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an autonomous inventory reorder agent for Digital Bites restaurant. Analyze current stock and generate reorder orders.

INVENTORY STATUS:
${inventorySummary.map(i => `- ${i.name}: ${i.current_stock} ${i.unit} | Threshold: ${i.threshold} | Status: ${i.status} | ~${i.daily_demand}/day | ~${i.days_remaining} days left | Supplier: ${i.supplier}`).join('\n')}

RULES:
- For OUT_OF_STOCK items: urgent order, quantity = 30 days supply
- For LOW items: standard order, quantity = 21 days supply  
- For OK items: skip unless < 7 days remaining
- Consider lead time of 2-3 days
- Group by supplier when possible

Generate reorder recommendations with exact quantities and urgency levels.`,
        response_json_schema: {
          type: "object",
          properties: {
            reorders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  inventory_id: { type: "string" },
                  item_name: { type: "string" },
                  current_stock: { type: "number" },
                  reorder_quantity: { type: "number" },
                  unit: { type: "string" },
                  urgency: { type: "string" },
                  supplier: { type: "string" },
                  reason: { type: "string" },
                  estimated_cost: { type: "string" }
                }
              }
            },
            summary: { type: "string" },
            total_items_to_reorder: { type: "number" }
          }
        }
      });

      setReorderPlan(response);
      toast.success(`AI reorder plan ready — ${response.total_items_to_reorder || response.reorders?.length} items flagged`);
    } catch (e) {
      toast.error('Agent failed: ' + e.message);
    } finally {
      setIsRunning(false);
    }
  };

  const acknowledgeReorder = (idx) => {
    setAcknowledged(prev => new Set([...prev, idx]));
    toast.success('Reorder acknowledged');
  };

  const markRestocked = async (item, qty) => {
    const inv = inventory.find(i => i.id === item.inventory_id || i.name === item.item_name);
    if (!inv) return;
    await updateInventory.mutateAsync({ id: inv.id, data: { current_stock: (inv.current_stock || 0) + qty } });
    toast.success(`${item.item_name} restocked +${qty} ${item.unit}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-2xl text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#c9a962]" /> Autonomous Reorder Agent
          </h3>
          <p className="font-inter text-sm text-white/40 mt-1">AI-powered stock monitoring and supplier reorder planning</p>
        </div>
        <LuxuryButton onClick={runReorderAgent} disabled={isRunning}>
          {isRunning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Agent Running...</> : <><Zap className="w-4 h-4 mr-2" />Run Reorder Agent</>}
        </LuxuryButton>
      </div>

      {/* Alert Banners */}
      {outOfStock.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-inter font-semibold text-red-400 text-sm">⚠ {outOfStock.length} items OUT OF STOCK</p>
            <p className="font-inter text-white/60 text-xs mt-0.5">{outOfStock.map(i => i.name).join(', ')}</p>
          </div>
        </div>
      )}
      {criticalItems.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-inter font-semibold text-amber-400 text-sm">{criticalItems.length} items below threshold</p>
            <p className="font-inter text-white/60 text-xs mt-0.5">{criticalItems.map(i => `${i.name} (${i.current_stock} ${i.unit})`).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Live Inventory Status */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 overflow-hidden">
          <div className="p-4 border-b border-[#c9a962]/10">
            <h4 className="font-inter text-xs uppercase tracking-widest text-[#c9a962]">Live Inventory ({inventory.length} items)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#c9a962]/5">
                  {['Item', 'Stock', 'Threshold', 'Status', 'Quick Restock'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-inter text-xs text-[#c9a962]/60 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => {
                  const pct = item.low_stock_threshold > 0 ? item.current_stock / item.low_stock_threshold : 1;
                  return (
                    <tr key={item.id} className="border-b border-[#c9a962]/5 hover:bg-[#c9a962]/5 transition-colors">
                      <td className="px-4 py-3 font-inter text-sm text-white">{item.name}</td>
                      <td className="px-4 py-3 font-inter text-sm text-white">{item.current_stock} <span className="text-white/40 text-xs">{item.unit}</span></td>
                      <td className="px-4 py-3 font-inter text-xs text-white/40">{item.low_stock_threshold} {item.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-inter ${
                          item.current_stock === 0 ? 'bg-red-500/20 text-red-400' :
                          pct <= 1 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {item.current_stock === 0 ? 'Out of Stock' : pct <= 1 ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => updateInventory.mutate({ id: item.id, data: { current_stock: item.current_stock + 10 } })}
                          className="text-xs px-3 py-1 rounded-lg bg-[#c9a962]/10 text-[#c9a962] hover:bg-[#c9a962]/20 transition-all font-inter">
                          +10
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Reorder Plan */}
      {reorderPlan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl p-4">
            <p className="font-inter text-sm text-[#c9a962] font-semibold mb-1">Agent Summary</p>
            <p className="font-inter text-sm text-white/70">{reorderPlan.summary}</p>
          </div>

          <div className="space-y-3">
            {reorderPlan.reorders?.map((item, i) => (
              <div key={i} className={`bg-[#1a1a1a] rounded-xl border p-4 transition-all ${
                acknowledged.has(i) ? 'border-green-500/20 opacity-60' : item.urgency === 'urgent' ? 'border-red-500/30' : 'border-[#c9a962]/10'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-inter text-sm text-white font-semibold">{item.item_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-inter ${
                        item.urgency === 'urgent' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>{item.urgency}</span>
                    </div>
                    <p className="font-inter text-xs text-white/50 mb-1">{item.reason}</p>
                    <div className="flex items-center gap-4 text-xs font-inter">
                      <span className="text-white/60">Current: {item.current_stock} {item.unit}</span>
                      <span className="text-[#c9a962] font-semibold">Order: {item.reorder_quantity} {item.unit}</span>
                      {item.supplier !== 'unknown' && <span className="text-white/40">📦 {item.supplier}</span>}
                      {item.estimated_cost && <span className="text-green-400">{item.estimated_cost}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!acknowledged.has(i) && (
                      <button onClick={() => acknowledgeReorder(i)}
                        className="px-3 py-1.5 rounded-lg bg-[#c9a962]/10 text-[#c9a962] text-xs font-inter hover:bg-[#c9a962]/20 transition-all">
                        Acknowledge
                      </button>
                    )}
                    <button onClick={() => markRestocked(item, item.reorder_quantity)}
                      className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-inter hover:bg-green-500/20 transition-all flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Mark Restocked
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}