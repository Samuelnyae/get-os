import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Flame, Clock } from 'lucide-react';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6am-midnight
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getHeatColor(score) {
  if (score === 0) return 'bg-white/5';
  if (score < 0.2) return 'bg-blue-900/60';
  if (score < 0.4) return 'bg-blue-500/60';
  if (score < 0.6) return 'bg-yellow-500/60';
  if (score < 0.8) return 'bg-orange-500/70';
  return 'bg-red-500/80';
}

function getLabel(score) {
  if (score === 0) return 'No data';
  if (score < 0.2) return 'Very Low';
  if (score < 0.4) return 'Low';
  if (score < 0.6) return 'Moderate';
  if (score < 0.8) return 'High';
  return 'Very High';
}

export default function DemandHeatmap() {
  const [view, setView] = useState('weekly');
  const [hovered, setHovered] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders-heatmap'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const heatmapData = useMemo(() => {
    // Build a 7x18 grid (day x hour)
    const grid = Array.from({ length: 7 }, () => Array(18).fill(0));
    orders.forEach(order => {
      if (!order.created_date) return;
      const d = new Date(order.created_date);
      const dayIdx = (d.getDay() + 6) % 7; // Mon=0
      const hourIdx = d.getHours() - 6;
      if (hourIdx >= 0 && hourIdx < 18) {
        grid[dayIdx][hourIdx] += (order.total_amount || 1);
      }
    });
    // Normalize
    const max = Math.max(...grid.flat(), 1);
    return grid.map(row => row.map(v => v / max));
  }, [orders]);

  const hourlyData = useMemo(() => {
    const hours = Array(18).fill(0);
    orders.forEach(order => {
      if (!order.created_date) return;
      const h = new Date(order.created_date).getHours() - 6;
      if (h >= 0 && h < 18) hours[h] += (order.total_amount || 1);
    });
    const max = Math.max(...hours, 1);
    return hours.map(v => v / max);
  }, [orders]);

  const peakDay = useMemo(() => {
    const dayTotals = heatmapData.map(row => row.reduce((a, b) => a + b, 0));
    return DAYS[dayTotals.indexOf(Math.max(...dayTotals))];
  }, [heatmapData]);

  const peakHour = useMemo(() => {
    const max = Math.max(...hourlyData);
    const idx = hourlyData.indexOf(max);
    const h = idx + 6;
    return `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
  }, [hourlyData]);

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-playfair text-2xl text-white">Peak Hours & Demand Heatmap</h2>
          <p className="font-inter text-sm text-white/50 mt-1">Visualize customer traffic and sales activity patterns</p>
        </div>
        <div className="flex gap-2">
          {['hourly', 'weekly'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg font-inter text-sm transition-all ${view === v ? 'bg-[#c9a962] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Peak Day', value: peakDay, color: 'text-orange-400' },
          { label: 'Peak Hour', value: peakHour, color: 'text-red-400' },
          { label: 'Total Orders', value: orders.length, color: 'text-[#c9a962]' },
          { label: 'Avg/Hour', value: `KSh ${orders.length ? Math.round(orders.reduce((s,o)=>s+(o.total_amount||0),0)/18).toLocaleString() : 0}`, color: 'text-green-400' },
        ].map((s, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <p className={`font-inter text-lg font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-white/50 font-inter text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-white/50 font-inter text-xs">Traffic:</span>
        {['Very Low', 'Low', 'Moderate', 'High', 'Very High'].map((l, i) => (
          <div key={l} className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded ${['bg-blue-900/60','bg-blue-500/60','bg-yellow-500/60','bg-orange-500/70','bg-red-500/80'][i]}`} />
            <span className="text-white/50 font-inter text-xs">{l}</span>
          </div>
        ))}
      </div>

      {view === 'weekly' && (
        <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-6 overflow-x-auto">
          <h3 className="font-inter text-white font-semibold mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" /> Weekly Demand Heatmap
          </h3>
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex gap-1 mb-1 ml-10">
              {HOURS.map(h => (
                <div key={h} className="flex-1 text-center text-white/30 font-inter" style={{ fontSize: 9 }}>
                  {h > 12 ? `${h-12}p` : `${h}a`}
                </div>
              ))}
            </div>
            {DAYS.map((day, di) => (
              <div key={day} className="flex gap-1 mb-1 items-center">
                <div className="w-8 text-white/50 font-inter text-xs text-right pr-2">{day}</div>
                {heatmapData[di].map((score, hi) => (
                  <div
                    key={hi}
                    className={`flex-1 h-8 rounded cursor-pointer transition-all hover:ring-1 hover:ring-white/40 ${getHeatColor(score)}`}
                    onMouseEnter={() => setHovered({ day, hour: HOURS[hi], score })}
                    onMouseLeave={() => setHovered(null)}
                  />
                ))}
              </div>
            ))}
          </div>
          {hovered && (
            <div className="mt-3 p-3 bg-[#0a0a0a] border border-[#c9a962]/20 rounded-lg inline-block">
              <p className="font-inter text-xs text-white">
                <span className="text-[#c9a962]">{hovered.day}</span> at <span className="text-[#c9a962]">{hovered.hour > 12 ? hovered.hour-12 : hovered.hour}:00 {hovered.hour >= 12 ? 'PM' : 'AM'}</span> — <span className="text-white/70">{getLabel(hovered.score)}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {view === 'hourly' && (
        <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-6">
          <h3 className="font-inter text-white font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#c9a962]" /> Hourly Demand (All Days)
          </h3>
          <div className="flex items-end gap-1 h-48 overflow-x-auto">
            {hourlyData.map((score, i) => {
              const h = i + 6;
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[28px]">
                  <div
                    className={`w-full rounded-t transition-all hover:opacity-80 cursor-pointer ${getHeatColor(score)}`}
                    style={{ height: `${Math.max(score * 160, 4)}px` }}
                    title={`${h}:00 — ${getLabel(score)}`}
                  />
                  <span className="text-white/30 font-inter" style={{ fontSize: 9 }}>
                    {h > 12 ? `${h-12}p` : `${h}a`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}