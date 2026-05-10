import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, AlertTriangle, Loader2, CheckCircle, BarChart2, Brain } from 'lucide-react';
import { toast } from 'sonner';
import LuxuryButton from '../common/LuxuryButton';

const METHOD_COLORS = {
  'Pay at Counter': 'text-[#c9a962] bg-[#c9a962]/10',
  'M-Pesa': 'text-green-400 bg-green-500/10',
  'Card': 'text-blue-400 bg-blue-500/10',
  'Cash': 'text-amber-400 bg-amber-500/10',
};

function StatCard({ label, value, sub, color = 'text-[#c9a962]', icon: IconComp }) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-4">
      {IconComp && <IconComp className={`w-5 h-5 ${color} mb-2`} />}
      <p className={`font-playfair text-2xl ${color}`}>{value}</p>
      <p className="font-inter text-xs text-white/50 mt-0.5">{label}</p>
      {sub && <p className="font-inter text-xs text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PaymentReconciliation() {
  const [dateRange, setDateRange] = useState('today');
  const [aiReport, setAiReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['reconciliation-orders', dateRange],
    queryFn: async () => {
      const all = await base44.entities.Order.list('-created_date', 500);
      const now = new Date();
      return all.filter(o => {
        const d = new Date(o.created_date);
        if (dateRange === 'today') return d.toDateString() === now.toDateString();
        if (dateRange === 'week') return (now - d) <= 7 * 86400000;
        if (dateRange === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
      });
    },
  });

  // Aggregate by payment method
  const byMethod = orders.reduce((acc, o) => {
    const method = o.payment_method || 'Pay at Counter';
    if (!acc[method]) acc[method] = { count: 0, total: 0, paid: 0, pending: 0 };
    acc[method].count++;
    acc[method].total += o.total_amount || 0;
    if (o.payment_status === 'paid') acc[method].paid += o.total_amount || 0;
    else acc[method].pending += o.total_amount || 0;
    return acc;
  }, {});

  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const paidRevenue = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (o.total_amount || 0), 0);
  const pendingRevenue = totalRevenue - paidRevenue;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed');

  const generateAIReport = async () => {
    setIsGenerating(true);
    try {
      const methodBreakdown = Object.entries(byMethod).map(([m, d]) =>
        `${m}: ${d.count} orders, KES ${d.total.toLocaleString()} total, KES ${d.paid.toLocaleString()} paid, KES ${d.pending.toLocaleString()} pending`
      ).join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a financial analyst for Digital Bites restaurant. Analyze this ${dateRange} payment data and provide reconciliation insights.

Period: ${dateRange}
Total Orders: ${orders.length}
Total Revenue: KES ${totalRevenue.toLocaleString()}
Paid Revenue: KES ${paidRevenue.toLocaleString()}
Pending Revenue: KES ${pendingRevenue.toLocaleString()}
Cancelled Orders: ${cancelledOrders.length}
Completed Orders: ${completedOrders.length}

Payment Method Breakdown:
${methodBreakdown}

Provide:
1. Summary assessment of financial health
2. Any discrepancies or flags
3. Revenue optimization suggestions
4. Collection rate analysis
5. Action items for management`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            collection_rate: { type: "string" },
            flags: { type: "array", items: { type: "string" } },
            optimizations: { type: "array", items: { type: "string" } },
            action_items: { type: "array", items: { type: "string" } },
            financial_health: { type: "string" }
          }
        }
      });

      setAiReport(response);
      toast.success('AI reconciliation report generated');
    } catch (e) {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-playfair text-2xl text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#c9a962]" /> Payment Reconciliation
          </h3>
          <p className="font-inter text-sm text-white/40 mt-1">End-of-day summaries & payment analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {['today', 'week', 'month', 'all'].map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-inter capitalize transition-all ${dateRange === r ? 'bg-[#c9a962] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10 hover:border-[#c9a962]/30'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} icon={TrendingUp} color="text-[#c9a962]" />
            <StatCard label="Collected" value={`KES ${paidRevenue.toLocaleString()}`} sub={`${orders.length > 0 ? Math.round(paidRevenue / totalRevenue * 100) : 0}% collection rate`} icon={CheckCircle} color="text-green-400" />
            <StatCard label="Pending" value={`KES ${pendingRevenue.toLocaleString()}`} icon={AlertTriangle} color="text-amber-400" />
            <StatCard label="Orders" value={orders.length} sub={`${completedOrders.length} completed · ${cancelledOrders.length} cancelled`} icon={BarChart2} color="text-blue-400" />
          </div>

          {/* By Payment Method */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-5">
            <h4 className="font-inter text-xs uppercase tracking-widest text-[#c9a962] mb-4">By Payment Method</h4>
            <div className="space-y-3">
              {Object.entries(byMethod).map(([method, data]) => (
                <div key={method} className="flex items-center justify-between bg-[#0a0a0a] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-inter ${METHOD_COLORS[method] || 'text-white/60 bg-white/10'}`}>{method}</span>
                    <span className="font-inter text-xs text-white/40">{data.count} orders</span>
                  </div>
                  <div className="text-right">
                    <p className="font-inter text-sm text-white font-medium">KES {data.total.toLocaleString()}</p>
                    <p className="font-inter text-xs text-white/40">
                      <span className="text-green-400">✓ {data.paid.toLocaleString()}</span> · <span className="text-amber-400">⏳ {data.pending.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              ))}
              {Object.keys(byMethod).length === 0 && (
                <p className="text-center text-white/30 font-inter text-sm py-6">No orders in this period</p>
              )}
            </div>
          </div>

          {/* AI Report */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-inter text-xs uppercase tracking-widest text-[#c9a962] flex items-center gap-2">
                <Brain className="w-3.5 h-3.5" /> AI Reconciliation Report
              </h4>
              <LuxuryButton size="sm" onClick={generateAIReport} disabled={isGenerating}>
                {isGenerating ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating...</> : 'Generate Report'}
              </LuxuryButton>
            </div>

            {!aiReport ? (
              <p className="font-inter text-sm text-white/30 text-center py-6">Click "Generate Report" for AI-powered financial insights</p>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl p-4">
                  <p className="font-inter text-xs text-[#c9a962] font-semibold uppercase tracking-wider mb-1">Financial Health: {aiReport.financial_health}</p>
                  <p className="font-inter text-sm text-white/80">{aiReport.summary}</p>
                  <p className="font-inter text-xs text-white/50 mt-2">Collection Rate: {aiReport.collection_rate}</p>
                </div>

                {aiReport.flags?.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <p className="font-inter text-xs text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Flags</p>
                    <ul className="space-y-1">{aiReport.flags.map((f, i) => <li key={i} className="font-inter text-sm text-red-300">• {f}</li>)}</ul>
                  </div>
                )}

                {aiReport.action_items?.length > 0 && (
                  <div className="bg-[#0a0a0a] rounded-xl p-4">
                    <p className="font-inter text-xs text-white/50 uppercase tracking-wider mb-2">Action Items</p>
                    <ul className="space-y-1">{aiReport.action_items.map((a, i) => <li key={i} className="font-inter text-sm text-white/70">→ {a}</li>)}</ul>
                  </div>
                )}

                {aiReport.optimizations?.length > 0 && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                    <p className="font-inter text-xs text-green-400 uppercase tracking-wider mb-2">Optimizations</p>
                    <ul className="space-y-1">{aiReport.optimizations.map((o, i) => <li key={i} className="font-inter text-sm text-green-300">💡 {o}</li>)}</ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}