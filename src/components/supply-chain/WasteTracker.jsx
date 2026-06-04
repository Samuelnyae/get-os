import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, Trash2, RefreshCw, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WASTE_TYPES = ['food_spoilage', 'food_preparation', 'food_plate', 'beverage_spill', 'beverage_expired', 'packaging', 'cleaning', 'other'];
const DEPTS = ['kitchen', 'bar', 'housekeeping', 'maintenance', 'restaurant', 'other'];
const EMPTY = { item_name: '', waste_type: 'food_spoilage', quantity: '', unit: 'kg', cost_per_unit: '', reason: '', staff_member: '', department: 'kitchen', waste_date: new Date().toISOString().split('T')[0] };

export default function WasteTracker() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [aiRecs, setAiRecs] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('week');
  const qc = useQueryClient();

  const { data: wasteLogs = [] } = useQuery({
    queryKey: ['waste-logs'],
    queryFn: () => base44.entities.WasteLog.list('-created_date', 500),
  });

  const create = useMutation({
    mutationFn: (data) => {
      const total_cost = (+data.quantity) * (+data.cost_per_unit || 0);
      return base44.entities.WasteLog.create({ ...data, quantity: +data.quantity, cost_per_unit: +data.cost_per_unit, total_cost });
    },
    onSuccess: () => { qc.invalidateQueries(['waste-logs']); setShowForm(false); setForm(EMPTY); }
  });

  const now = new Date();
  const filteredLogs = useMemo(() => {
    return wasteLogs.filter(w => {
      if (!w.waste_date) return true;
      const d = new Date(w.waste_date);
      if (dateFilter === 'week') return (now - d) / 86400000 <= 7;
      if (dateFilter === 'month') return (now - d) / 86400000 <= 30;
      return true;
    });
  }, [wasteLogs, dateFilter]);

  const totalCost = filteredLogs.reduce((s, w) => s + (w.total_cost || 0), 0);
  const byType = WASTE_TYPES.map(t => ({
    name: t.replace(/_/g, ' '),
    cost: filteredLogs.filter(w => w.waste_type === t).reduce((s, w) => s + (w.total_cost || 0), 0),
    count: filteredLogs.filter(w => w.waste_type === t).length,
  })).filter(t => t.count > 0);

  const getAIRecs = async () => {
    setAiLoading(true);
    const summary = byType.map(t => `${t.name}: ${t.count} incidents, KSh ${t.cost.toLocaleString()}`).join('\n');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a hospitality waste reduction expert. Analyze this waste data and give 5 specific actionable recommendations.

Waste data (${dateFilter}):
${summary}
Total waste cost: KSh ${totalCost.toLocaleString()}

Return JSON with:
- recommendations: array of 5 strings (specific, actionable advice)
- highest_waste_category: string
- estimated_savings_ksh: number (if recommendations are followed)`,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: { type: 'array', items: { type: 'string' } },
          highest_waste_category: { type: 'string' },
          estimated_savings_ksh: { type: 'number' },
        }
      }
    });
    setAiRecs(result);
    setAiLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-inter text-white font-semibold text-lg">Waste Tracking</h3>
          <p className="text-white/40 font-inter text-xs mt-0.5">Record and analyze waste to reduce costs</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-[#1a1a1a] border border-[#c9a962]/10 rounded-lg p-1">
            {['week','month','all'].map(d=>(
              <button key={d} onClick={()=>setDateFilter(d)}
                className={`px-3 py-1 rounded-md font-inter text-xs capitalize transition-all ${dateFilter===d?'bg-[#c9a962] text-[#0a0a0a]':'text-white/50'}`}>{d}</button>
            ))}
          </div>
          <button onClick={()=>setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90">
            <Plus className="w-4 h-4" /> Log Waste
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Waste Cost', value: `KSh ${totalCost.toLocaleString()}`, color: 'text-red-400' },
          { label: 'Incidents', value: filteredLogs.length, color: 'text-orange-400' },
          { label: 'Top Category', value: byType.sort((a,b)=>b.cost-a.cost)[0]?.name || '—', color: 'text-yellow-400' },
          { label: 'Avg per Incident', value: `KSh ${filteredLogs.length ? Math.round(totalCost/filteredLogs.length).toLocaleString() : 0}`, color: 'text-white' },
        ].map((s,i)=>(
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <p className={`font-inter text-lg font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-white/40 font-inter text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {byType.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
          <h4 className="font-inter text-white font-semibold text-sm mb-4">Waste Cost by Type</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{fill:'#ffffff60',fontSize:10}} />
              <YAxis tick={{fill:'#ffffff60',fontSize:10}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v=>[`KSh ${v.toLocaleString()}`,'Cost']} contentStyle={{background:'#1a1a1a',border:'1px solid #c9a96230',color:'#fff'}} />
              <Bar dataKey="cost" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-inter text-white font-semibold text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-[#c9a962]" />AI Waste Reduction Recommendations</h4>
          <button onClick={getAIRecs} disabled={aiLoading || filteredLogs.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#c9a962]/10 border border-[#c9a962]/20 text-[#c9a962] rounded-lg font-inter text-xs hover:bg-[#c9a962]/20 disabled:opacity-50">
            {aiLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
            {aiLoading ? 'Analyzing...' : 'Get Recommendations'}
          </button>
        </div>
        {aiRecs ? (
          <div>
            {aiRecs.estimated_savings_ksh && (
              <div className="p-3 bg-green-400/10 border border-green-400/20 rounded-lg mb-3">
                <p className="text-green-400 font-inter text-xs font-semibold">Potential Savings: KSh {aiRecs.estimated_savings_ksh?.toLocaleString()}/period</p>
              </div>
            )}
            <div className="space-y-2">
              {aiRecs.recommendations?.map((r, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-[#c9a962]/5 border border-[#c9a962]/10 rounded-lg">
                  <span className="text-[#c9a962] font-bold font-inter text-xs mt-0.5">{i+1}.</span>
                  <p className="text-white/70 font-inter text-xs">{r}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-white/30 font-inter text-xs">Log waste entries then click "Get Recommendations" for AI analysis.</p>
        )}
      </div>

      {/* Log Table */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5"><h4 className="font-inter text-white font-semibold text-sm">Waste Log ({filteredLogs.length})</h4></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5">{['Date','Item','Type','Qty','Unit','Cost','Dept','Staff'].map(h=>(
              <th key={h} className="px-4 py-2 text-left font-inter text-xs text-white/40 uppercase tracking-wider">{h}</th>
            ))}</tr></thead>
            <tbody>
              {filteredLogs.slice(0,50).map(w=>(
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2 font-inter text-xs text-white/60">{w.waste_date}</td>
                  <td className="px-4 py-2 font-inter text-xs text-white">{w.item_name}</td>
                  <td className="px-4 py-2 font-inter text-xs text-orange-400 capitalize">{w.waste_type?.replace(/_/g,' ')}</td>
                  <td className="px-4 py-2 font-inter text-xs text-white/60">{w.quantity}</td>
                  <td className="px-4 py-2 font-inter text-xs text-white/40">{w.unit}</td>
                  <td className="px-4 py-2 font-inter text-xs text-red-400">KSh {(w.total_cost||0).toLocaleString()}</td>
                  <td className="px-4 py-2 font-inter text-xs text-white/60 capitalize">{w.department}</td>
                  <td className="px-4 py-2 font-inter text-xs text-white/60">{w.staff_member||'—'}</td>
                </tr>
              ))}
              {filteredLogs.length===0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-white/30 font-inter text-sm">No waste logs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-inter text-white font-semibold">Log Waste</h3>
              <button onClick={()=>setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="font-inter text-xs text-white/50 mb-1 block">Item Name</label>
                <input value={form.item_name} onChange={e=>setForm(p=>({...p,item_name:e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Waste Type</label>
                <select value={form.waste_type} onChange={e=>setForm(p=>({...p,waste_type:e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                  {WASTE_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Department</label>
                <select value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                  {DEPTS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Quantity</label>
                <input type="number" value={form.quantity} onChange={e=>setForm(p=>({...p,quantity:e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Unit</label>
                <input value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Cost per Unit (KSh)</label>
                <input type="number" value={form.cost_per_unit} onChange={e=>setForm(p=>({...p,cost_per_unit:e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Staff Member</label>
                <input value={form.staff_member} onChange={e=>setForm(p=>({...p,staff_member:e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Date</label>
                <input type="date" value={form.waste_date} onChange={e=>setForm(p=>({...p,waste_date:e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
              <div className="col-span-2">
                <label className="font-inter text-xs text-white/50 mb-1 block">Reason</label>
                <textarea value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))} rows={2}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowForm(false)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm">Cancel</button>
              <button onClick={()=>create.mutate(form)} disabled={!form.item_name||!form.quantity||create.isPending}
                className="flex-1 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                {create.isPending?'Logging...':'Log Waste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}