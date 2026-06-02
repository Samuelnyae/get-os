import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThumbsUp, ThumbsDown, Minus, Plus, X, TrendingUp } from 'lucide-react';
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CATEGORY_CONFIG = {
  promoter:  { label: 'Promoters',  color: '#10b981', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', range: '9-10' },
  passive:   { label: 'Passives',   color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',   range: '7-8' },
  detractor: { label: 'Detractors', color: '#ef4444', bg: 'bg-red-500/10 border-red-500/20 text-red-400',         range: '0-6' },
};

function getCategory(score) {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

const EMPTY = { guest_name: '', guest_email: '', score: 8, feedback: '', room_number: '', stay_date: '' };

export default function NPSTracker() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [hoverScore, setHoverScore] = useState(null);

  const { data: surveys = [] } = useQuery({ queryKey: ['nps'], queryFn: () => base44.entities.NPSSurvey.list('-created_date') });

  const submit = useMutation({
    mutationFn: () => base44.entities.NPSSurvey.create({ ...form, category: getCategory(form.score) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); setShowForm(false); setForm(EMPTY); },
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.NPSSurvey.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nps'] }),
  });

  const promoters = surveys.filter(s => s.category === 'promoter').length;
  const detractors = surveys.filter(s => s.category === 'detractor').length;
  const total = surveys.length;
  const nps = total ? Math.round(((promoters - detractors) / total) * 100) : 0;
  const npsColor = nps >= 50 ? '#10b981' : nps >= 0 ? '#f59e0b' : '#ef4444';

  const pieData = ['promoter','passive','detractor'].map(c => ({
    name: CATEGORY_CONFIG[c].label,
    value: surveys.filter(s => s.category === c).length,
    color: CATEGORY_CONFIG[c].color,
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">NPS Tracker</h3>
          <p className="text-white/40 text-sm">{total} responses collected</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> Add Response
        </Button>
      </div>

      {/* NPS Score + Breakdown */}
      {total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center">
            <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Net Promoter Score</div>
            <div className="text-7xl font-bold mb-2" style={{ color: npsColor }}>{nps > 0 ? '+' : ''}{nps}</div>
            <div className="text-white/30 text-sm">
              {nps >= 70 ? 'Excellent 🏆' : nps >= 50 ? 'Good 👍' : nps >= 0 ? 'Needs Improvement' : 'Critical ⚠️'}
            </div>
            <div className="w-full mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0,(nps+100)/2)}%`, background: npsColor }} />
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
            <div className="text-white/40 text-xs uppercase tracking-wider mb-4">Breakdown</div>
            <div className="space-y-3">
              {['promoter','passive','detractor'].map(c => {
                const count = surveys.filter(s => s.category === c).length;
                const pct = total ? Math.round((count / total) * 100) : 0;
                const cfg = CATEGORY_CONFIG[c];
                return (
                  <div key={c}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={cfg.bg.split(' ').find(s => s.startsWith('text-'))}>{cfg.label} ({cfg.range})</span>
                      <span className="text-white/50">{count} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Responses */}
      <div className="space-y-3">
        {surveys.map(s => {
          const cfg = CATEGORY_CONFIG[s.category] || CATEGORY_CONFIG.passive;
          return (
            <div key={s.id} className={`border rounded-2xl p-4 ${cfg.bg}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border" style={{ borderColor: cfg.color + '40', backgroundColor: cfg.color + '20', color: cfg.color }}>
                    {s.score}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{s.guest_name}</div>
                    <div className="text-white/40 text-xs">{s.guest_email} {s.room_number ? `· Room ${s.room_number}` : ''} {s.stay_date ? `· ${s.stay_date}` : ''}</div>
                    {s.feedback && <div className="text-white/60 text-sm mt-1 italic">"{s.feedback}"</div>}
                  </div>
                </div>
                <button onClick={() => del.mutate(s.id)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {surveys.length === 0 && (
          <div className="text-center py-12 text-white/30"><TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No NPS responses yet</p></div>
        )}
      </div>

      {/* Add Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Record NPS Response</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/60 text-xs mb-1 block">Guest Name</label>
                  <Input value={form.guest_name} onChange={e=>setForm(f=>({...f,guest_name:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">Email</label>
                  <Input type="email" value={form.guest_email} onChange={e=>setForm(f=>({...f,guest_email:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-2 block">
                  Score: <span className={`font-bold ${getCategory(form.score) === 'promoter' ? 'text-emerald-400' : getCategory(form.score) === 'passive' ? 'text-amber-400' : 'text-red-400'}`}>{form.score}/10 — {CATEGORY_CONFIG[getCategory(form.score)].label}</span>
                </label>
                <div className="flex gap-1">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n => {
                    const cat = getCategory(n);
                    const active = form.score === n;
                    const colors = { promoter: 'bg-emerald-500 text-white', passive: 'bg-amber-500 text-white', detractor: 'bg-red-500 text-white' };
                    return (
                      <button key={n} onClick={() => setForm(f => ({ ...f, score: n }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${active ? colors[cat] : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Feedback (optional)</label>
                <textarea value={form.feedback} onChange={e=>setForm(f=>({...f,feedback:e.target.value}))}
                  rows={2} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/60 text-xs mb-1 block">Room #</label>
                  <Input value={form.room_number} onChange={e=>setForm(f=>({...f,room_number:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">Stay Date</label>
                  <Input type="date" value={form.stay_date} onChange={e=>setForm(f=>({...f,stay_date:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <Button onClick={() => submit.mutate()} disabled={!form.guest_name || !form.guest_email || submit.isPending}
                className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}