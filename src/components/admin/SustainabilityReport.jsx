import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Leaf, Zap, Droplets, Trash2, Wind, RefreshCw, TrendingDown, Award } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

const METRICS = [
  { key: 'electricity_kwh', label: 'Electricity Usage', unit: 'kWh', icon: Zap, color: 'text-yellow-400', input: true },
  { key: 'water_liters', label: 'Water Usage', unit: 'Liters', icon: Droplets, color: 'text-blue-400', input: true },
  { key: 'food_waste_kg', label: 'Food Waste', unit: 'kg', icon: Trash2, color: 'text-orange-400', input: true },
  { key: 'plastic_kg', label: 'Plastic Usage', unit: 'kg', icon: Leaf, color: 'text-green-400', input: true },
];

export default function SustainabilityReport() {
  const [inputs, setInputs] = useState({ electricity_kwh: '', water_liters: '', food_waste_kg: '', plastic_kg: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sustainability & ESG analyst for a luxury hotel and restaurant.

Monthly usage data:
- Electricity: ${inputs.electricity_kwh || 0} kWh
- Water: ${inputs.water_liters || 0} liters
- Food waste: ${inputs.food_waste_kg || 0} kg
- Plastic usage: ${inputs.plastic_kg || 0} kg

Calculate:
1. Carbon footprint (kg CO2 equivalent): electricity × 0.5, food_waste × 2.5, plastic × 6
2. Sustainability score (0-100) based on industry benchmarks
3. Monthly carbon total
4. Waste reduction progress (vs hospitality industry average)

Return JSON with:
- carbon_total_kg: number
- sustainability_score: number (0-100)
- electricity_co2: number
- food_waste_co2: number
- plastic_co2: number
- water_usage_score: number (0-100, 100=excellent)
- grade: "A+" | "A" | "B" | "C" | "D"
- eco_practices: array of 4 current eco-friendly practices to highlight
- recommendations: array of 5 AI recommendations
- annual_projection: {carbon_kg: number, cost_savings_ksh: number}
- industry_comparison: {your_score: number, industry_avg: number, top_performers: number}`,
      response_json_schema: {
        type: 'object',
        properties: {
          carbon_total_kg: { type: 'number' },
          sustainability_score: { type: 'number' },
          electricity_co2: { type: 'number' },
          food_waste_co2: { type: 'number' },
          plastic_co2: { type: 'number' },
          water_usage_score: { type: 'number' },
          grade: { type: 'string' },
          eco_practices: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          annual_projection: {
            type: 'object',
            properties: { carbon_kg: { type: 'number' }, cost_savings_ksh: { type: 'number' } }
          },
          industry_comparison: {
            type: 'object',
            properties: { your_score: { type: 'number' }, industry_avg: { type: 'number' }, top_performers: { type: 'number' } }
          }
        }
      }
    });
    setReport(result);
    setLoading(false);
  };

  const gradeColor = (g) => {
    if (!g) return 'text-white';
    if (g.startsWith('A')) return 'text-green-400';
    if (g === 'B') return 'text-[#c9a962]';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-playfair text-2xl text-white">Carbon Footprint & Sustainability</h2>
          <p className="font-inter text-sm text-white/50 mt-1">Track environmental impact and generate ESG reports</p>
        </div>
      </div>

      {/* Input Panel */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-6">
        <h3 className="font-inter text-white font-semibold mb-4 flex items-center gap-2">
          <Leaf className="w-4 h-4 text-green-400" /> Enter Monthly Usage Data
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {METRICS.map(m => (
            <div key={m.key}>
              <label className="font-inter text-xs text-white/50 mb-1 flex items-center gap-1">
                <m.icon className={`w-3 h-3 ${m.color}`} /> {m.label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={inputs[m.key]}
                  onChange={e => setInputs(prev => ({ ...prev, [m.key]: e.target.value }))}
                  placeholder="0"
                  className="flex-1 bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm"
                />
                <span className="text-white/30 font-inter text-xs">{m.unit}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-inter text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-all"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wind className="w-4 h-4" />}
          {loading ? 'Generating Report...' : 'Generate Sustainability Report'}
        </button>
      </div>

      {loading && (
        <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-12 text-center">
          <div className="w-12 h-12 border-2 border-green-400/20 border-t-green-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 font-inter">Calculating carbon footprint and sustainability score...</p>
        </div>
      )}

      {report && !loading && (
        <>
          {/* Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-transparent border border-green-400/30 rounded-xl p-5 col-span-2 md:col-span-1">
              <p className="font-inter text-xs text-green-400 uppercase tracking-wider mb-1">Sustainability Grade</p>
              <p className={`font-playfair text-5xl font-bold ${gradeColor(report.grade)}`}>{report.grade}</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
              <p className="font-inter text-xs text-white/50 uppercase tracking-wider mb-1">Sustainability Score</p>
              <p className="font-playfair text-3xl text-white">{report.sustainability_score}<span className="text-lg text-white/50">/100</span></p>
              <div className="mt-2 bg-white/10 rounded-full h-1.5">
                <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${report.sustainability_score}%` }} />
              </div>
            </div>
            <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
              <p className="font-inter text-xs text-white/50 uppercase tracking-wider mb-1">Monthly Carbon</p>
              <p className="font-playfair text-3xl text-white">{report.carbon_total_kg?.toFixed(0)}</p>
              <p className="text-white/30 font-inter text-xs mt-1">kg CO₂e</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
              <p className="font-inter text-xs text-white/50 uppercase tracking-wider mb-1">Annual Carbon</p>
              <p className="font-playfair text-3xl text-white">{((report.annual_projection?.carbon_kg||0)/1000).toFixed(1)}</p>
              <p className="text-white/30 font-inter text-xs mt-1">tonnes CO₂e/year</p>
            </div>
          </div>

          {/* CO2 Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
              <h3 className="font-inter text-white font-semibold mb-4">Carbon Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Electricity', value: report.electricity_co2, color: 'bg-yellow-400', icon: Zap },
                  { label: 'Food Waste', value: report.food_waste_co2, color: 'bg-orange-400', icon: Trash2 },
                  { label: 'Plastic', value: report.plastic_co2, color: 'bg-green-400', icon: Leaf },
                ].map((item, i) => {
                  const total = (report.carbon_total_kg || 1);
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-white/50 shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-inter text-xs text-white/70">{item.label}</span>
                          <span className="font-inter text-xs text-white/50">{item.value?.toFixed(1)} kg CO₂</span>
                        </div>
                        <div className="bg-white/10 rounded-full h-2">
                          <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 p-3 bg-green-400/10 border border-green-400/20 rounded-lg">
                <p className="font-inter text-xs text-green-400 font-semibold">💰 Potential Annual Savings</p>
                <p className="font-inter text-sm text-white mt-1">KSh {report.annual_projection?.cost_savings_ksh?.toLocaleString()} through sustainability improvements</p>
              </div>
            </div>

            {/* Industry Comparison */}
            <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
              <h3 className="font-inter text-white font-semibold mb-4">Industry Comparison</h3>
              {[
                { label: 'Your Score', value: report.industry_comparison?.your_score, color: 'bg-[#c9a962]' },
                { label: 'Industry Average', value: report.industry_comparison?.industry_avg, color: 'bg-blue-400' },
                { label: 'Top Performers', value: report.industry_comparison?.top_performers, color: 'bg-green-400' },
              ].map((item, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-inter text-xs text-white/70">{item.label}</span>
                    <span className="font-inter text-xs text-white">{item.value}</span>
                  </div>
                  <div className="bg-white/10 rounded-full h-3">
                    <div className={`${item.color} h-3 rounded-full`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}

              <div className="mt-5">
                <h4 className="font-inter text-xs text-white/50 uppercase mb-3">Eco Practices to Highlight</h4>
                <div className="space-y-2">
                  {report.eco_practices?.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <p className="font-inter text-xs text-white/70">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
            <h3 className="font-inter text-white font-semibold mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-green-400" /> AI Sustainability Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.recommendations?.map((r, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-green-400/5 border border-green-400/10 rounded-lg">
                  <Leaf className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
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