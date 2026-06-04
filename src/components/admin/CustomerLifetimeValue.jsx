import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, TrendingUp, RefreshCw, Crown, Heart, AlertTriangle, UserPlus } from 'lucide-react';

const SEGMENTS = {
  vip: { label: 'VIP', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', desc: 'Highest spenders' },
  loyal: { label: 'Loyal', icon: Heart, color: 'text-[#c9a962]', bg: 'bg-[#c9a962]/10', border: 'border-[#c9a962]/30', desc: 'Frequent visitors' },
  at_risk: { label: 'At-Risk', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', desc: 'Not visited recently' },
  new: { label: 'New', icon: UserPlus, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', desc: 'Recently acquired' },
};

export default function CustomerLifetimeValue() {
  const [clvData, setClvData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSeg, setSelectedSeg] = useState('all');

  const { data: guests = [] } = useQuery({
    queryKey: ['guests-clv'],
    queryFn: () => base44.entities.GuestProfile.list('-total_spent', 100),
  });

  const { data: loyalty = [] } = useQuery({
    queryKey: ['loyalty-clv'],
    queryFn: () => base44.entities.LoyaltyAccount.list('-total_spent', 100),
  });

  const quickStats = useMemo(() => {
    const totalSpend = guests.reduce((s, g) => s + (g.total_spent || 0), 0);
    const totalVisits = guests.reduce((s, g) => s + (g.total_stays || 0), 0);
    return {
      totalGuests: guests.length,
      totalSpend,
      avgSpend: guests.length ? Math.round(totalSpend / guests.length) : 0,
      avgVisits: guests.length ? (totalVisits / guests.length).toFixed(1) : 0,
    };
  }, [guests]);

  const runAnalysis = async () => {
    setLoading(true);
    const guestData = guests.slice(0, 30).map(g => ({
      name: g.full_name,
      total_spent: g.total_spent || 0,
      total_stays: g.total_stays || 0,
      loyalty_points: g.loyalty_points || 0,
      last_stay: g.last_stay_date || null,
      vip: g.vip_status,
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Customer Lifetime Value (CLV) analyst for a luxury hotel & restaurant. Analyze these guests and segment them.

Guests: ${JSON.stringify(guestData)}
Current date: ${new Date().toDateString()}

For each guest, calculate:
- clv_score: estimated lifetime value in KSh
- segment: "vip" | "loyal" | "at_risk" | "new"
- predicted_future_value: KSh
- avg_order_value: KSh
- days_since_visit: number

Return JSON with:
- customers: array of {name, total_spent, visits, avg_order_value, clv_score, predicted_future_value, segment, days_since_visit}
- segment_counts: {vip: number, loyal: number, at_risk: number, new: number}
- total_clv: number
- retention_rate: number (percentage)
- churn_risk_count: number
- marketing_actions: array of 4 strings`,
      response_json_schema: {
        type: 'object',
        properties: {
          customers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                total_spent: { type: 'number' },
                visits: { type: 'number' },
                avg_order_value: { type: 'number' },
                clv_score: { type: 'number' },
                predicted_future_value: { type: 'number' },
                segment: { type: 'string' },
                days_since_visit: { type: 'number' },
              }
            }
          },
          segment_counts: { type: 'object' },
          total_clv: { type: 'number' },
          retention_rate: { type: 'number' },
          churn_risk_count: { type: 'number' },
          marketing_actions: { type: 'array', items: { type: 'string' } },
        }
      }
    });
    setClvData(result);
    setLoading(false);
  };

  const filtered = clvData?.customers?.filter(c => selectedSeg === 'all' || c.segment === selectedSeg) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-playfair text-2xl text-white">Customer Lifetime Value (CLV)</h2>
          <p className="font-inter text-sm text-white/50 mt-1">Revenue each customer generates over time, with segment analysis</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading || guests.length === 0}
          className="flex items-center gap-2 px-5 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90 disabled:opacity-50 transition-all"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Analyze CLV'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Guests', value: quickStats.totalGuests, color: 'text-[#c9a962]' },
          { label: 'Total Revenue', value: `KSh ${quickStats.totalSpend.toLocaleString()}`, color: 'text-green-400' },
          { label: 'Avg Spend/Guest', value: `KSh ${quickStats.avgSpend.toLocaleString()}`, color: 'text-blue-400' },
          { label: 'Avg Visits', value: quickStats.avgVisits, color: 'text-purple-400' },
        ].map((s, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <p className={`font-inter text-lg font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-white/50 font-inter text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Segment Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(SEGMENTS).map(([key, seg]) => {
          const count = clvData?.segment_counts?.[key] || 0;
          return (
            <button key={key} onClick={() => setSelectedSeg(selectedSeg === key ? 'all' : key)}
              className={`p-4 rounded-xl border text-left transition-all ${seg.bg} ${seg.border} ${selectedSeg === key ? 'ring-1 ring-white/40' : ''}`}>
              <seg.icon className={`w-5 h-5 ${seg.color} mb-2`} />
              <p className={`font-inter text-sm font-semibold ${seg.color}`}>{seg.label}</p>
              <p className="font-inter text-xs text-white/40">{seg.desc}</p>
              {clvData && <p className={`font-playfair text-2xl mt-1 ${seg.color}`}>{count}</p>}
            </button>
          );
        })}
      </div>

      {!clvData && !loading && (
        <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-[#c9a962]/40 mx-auto mb-4" />
          <p className="text-white/50 font-inter">Click "Analyze CLV" to segment your {guests.length} guests</p>
        </div>
      )}

      {loading && (
        <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-12 text-center">
          <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 font-inter">Calculating lifetime value for {guests.length} guests...</p>
        </div>
      )}

      {clvData && !loading && (
        <>
          {/* CLV Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#c9a962]/20 to-transparent border border-[#c9a962]/30 rounded-xl p-5">
              <p className="text-[#c9a962] font-inter text-xs uppercase tracking-wider mb-1">Total CLV Portfolio</p>
              <p className="font-playfair text-3xl text-white">KSh {clvData.total_clv?.toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
              <p className="text-white/50 font-inter text-xs uppercase tracking-wider mb-1">Retention Rate</p>
              <div className="flex items-end gap-2">
                <p className="font-playfair text-3xl text-white">{clvData.retention_rate}%</p>
                <div className="flex-1 bg-white/10 rounded-full h-2 mb-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: `${clvData.retention_rate}%` }} />
                </div>
              </div>
            </div>
            <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-5">
              <p className="text-red-400 font-inter text-xs uppercase tracking-wider mb-1">Churn Risk Customers</p>
              <p className="font-playfair text-3xl text-white">{clvData.churn_risk_count}</p>
            </div>
          </div>

          {/* Customer Table */}
          <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#c9a962]/10">
              <h3 className="font-inter text-white font-semibold">Customer Profiles ({filtered.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Customer', 'Total Spent', 'Visits', 'Avg Order', 'CLV Score', 'Future Value', 'Segment'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-inter text-xs text-white/40 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const seg = SEGMENTS[c.segment];
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="px-4 py-3 font-inter text-sm text-white">{c.name}</td>
                        <td className="px-4 py-3 font-inter text-sm text-green-400">KSh {c.total_spent?.toLocaleString()}</td>
                        <td className="px-4 py-3 font-inter text-sm text-white/70">{c.visits}</td>
                        <td className="px-4 py-3 font-inter text-sm text-white/70">KSh {c.avg_order_value?.toLocaleString()}</td>
                        <td className="px-4 py-3 font-inter text-sm text-[#c9a962]">KSh {c.clv_score?.toLocaleString()}</td>
                        <td className="px-4 py-3 font-inter text-sm text-blue-400">KSh {c.predicted_future_value?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {seg && (
                            <span className={`font-inter text-xs px-2 py-1 rounded-full ${seg.bg} ${seg.color}`}>
                              {seg.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Marketing Actions */}
          <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
            <h3 className="font-inter text-white font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#c9a962]" /> Marketing Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clvData.marketing_actions?.map((a, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-[#c9a962]/5 border border-[#c9a962]/10 rounded-lg">
                  <span className="text-[#c9a962] font-bold font-inter text-xs mt-0.5">{i+1}.</span>
                  <p className="text-white/70 font-inter text-xs">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}