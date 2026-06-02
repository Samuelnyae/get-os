import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Plus, X, Gift, TrendingUp, Award } from 'lucide-react';

const TIER_CONFIG = {
  bronze:   { label: 'Bronze',   color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20',  min: 0,    max: 999 },
  silver:   { label: 'Silver',   color: 'text-slate-300',   bg: 'bg-slate-500/10 border-slate-500/20',    min: 1000, max: 4999 },
  gold:     { label: 'Gold',     color: 'text-[#c9a962]',   bg: 'bg-[#c9a962]/10 border-[#c9a962]/30',   min: 5000, max: 14999 },
  platinum: { label: 'Platinum', color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20',  min: 15000,max: Infinity },
};

function getTier(points) {
  if (points >= 15000) return 'platinum';
  if (points >= 5000) return 'gold';
  if (points >= 1000) return 'silver';
  return 'bronze';
}

const EMPTY = { guest_name: '', guest_email: '', phone: '', date_of_birth: '', anniversary_date: '' };

export default function LoyaltyProgram() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showPoints, setShowPoints] = useState(null); // account id
  const [form, setForm] = useState(EMPTY);
  const [pointsForm, setPointsForm] = useState({ desc: '', pts: '', type: 'earn' });
  const [search, setSearch] = useState('');

  const { data: accounts = [] } = useQuery({ queryKey: ['loyalty'], queryFn: () => base44.entities.LoyaltyAccount.list('-points') });

  const create = useMutation({
    mutationFn: () => base44.entities.LoyaltyAccount.create({ ...form, points: 0, tier: 'bronze', points_history: [] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loyalty'] }); setShowForm(false); setForm(EMPTY); },
  });

  const addPoints = useMutation({
    mutationFn: ({ account }) => {
      const pts = Number(pointsForm.pts);
      const newPoints = pointsForm.type === 'earn' ? account.points + pts : Math.max(0, account.points - pts);
      const history = [...(account.points_history || []), {
        date: new Date().toISOString().split('T')[0],
        description: pointsForm.desc,
        points: pts,
        type: pointsForm.type,
      }];
      return base44.entities.LoyaltyAccount.update(account.id, {
        points: newPoints, tier: getTier(newPoints), points_history: history,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loyalty'] }); setShowPoints(null); setPointsForm({ desc: '', pts: '', type: 'earn' }); },
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.LoyaltyAccount.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty'] }),
  });

  const filtered = accounts.filter(a =>
    `${a.guest_name} ${a.guest_email}`.toLowerCase().includes(search.toLowerCase())
  );

  const totals = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  accounts.forEach(a => { if (totals[a.tier] !== undefined) totals[a.tier]++; });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-lg">Loyalty & Rewards</h3>
          <p className="text-white/40 text-sm">{accounts.length} members enrolled</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> Enroll Guest
        </Button>
      </div>

      {/* Tier Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(TIER_CONFIG).map(([k, v]) => (
          <div key={k} className={`rounded-xl border p-4 ${v.bg}`}>
            <Award className={`w-5 h-5 mb-2 ${v.color}`} />
            <div className={`text-xl font-bold ${v.color}`}>{totals[k]}</div>
            <div className="text-white/40 text-xs">{v.label}</div>
            <div className="text-white/20 text-[10px] mt-1">{k === 'platinum' ? '15000+' : `${v.min}–${v.max}`} pts</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#c9a962]/40" />

      {/* Members */}
      <div className="space-y-3">
        {filtered.map(acc => {
          const tier = TIER_CONFIG[acc.tier] || TIER_CONFIG.bronze;
          const nextTier = Object.entries(TIER_CONFIG).find(([, v]) => v.min > acc.points);
          const pctToNext = nextTier ? Math.min(100, ((acc.points - TIER_CONFIG[acc.tier].min) / (nextTier[1].min - TIER_CONFIG[acc.tier].min)) * 100) : 100;
          return (
            <div key={acc.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white font-medium">{acc.guest_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color}`}>{tier.label}</span>
                  </div>
                  <div className="text-white/40 text-xs">{acc.guest_email} {acc.phone ? `· ${acc.phone}` : ''}</div>
                  {acc.date_of_birth && <div className="text-white/30 text-xs mt-0.5">🎂 {acc.date_of_birth}</div>}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={tier.color}>{(acc.points || 0).toLocaleString()} pts</span>
                      {nextTier && <span className="text-white/30">{nextTier[1].min.toLocaleString()} for {TIER_CONFIG[nextTier[0]].label}</span>}
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${acc.tier === 'gold' || acc.tier === 'platinum' ? 'bg-[#c9a962]' : 'bg-white/40'}`} style={{ width: `${pctToNext}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setShowPoints(acc.id)} className="text-xs px-3 py-1.5 rounded-lg bg-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/20 hover:bg-[#c9a962]/20">
                    + Points
                  </button>
                  <button onClick={() => del.mutate(acc.id)} className="text-xs px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Points Modal inline */}
              {showPoints === acc.id && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Input value={pointsForm.desc} onChange={e => setPointsForm(f => ({ ...f, desc: e.target.value }))}
                        placeholder="Description (e.g. Room stay)" className="bg-[#111] border-white/10 text-white text-xs" />
                    </div>
                    <Input type="number" value={pointsForm.pts} onChange={e => setPointsForm(f => ({ ...f, pts: e.target.value }))}
                      placeholder="Points" className="bg-[#111] border-white/10 text-white text-xs" />
                  </div>
                  <div className="flex gap-2">
                    {['earn', 'redeem'].map(t => (
                      <button key={t} onClick={() => setPointsForm(f => ({ ...f, type: t }))}
                        className={`flex-1 py-1.5 rounded-lg border text-xs capitalize transition-all ${pointsForm.type === t ? 'bg-[#c9a962]/20 border-[#c9a962]/40 text-[#c9a962]' : 'border-white/10 text-white/40'}`}>
                        {t}
                      </button>
                    ))}
                    <button onClick={() => addPoints.mutate({ account: acc })} disabled={!pointsForm.desc || !pointsForm.pts}
                      className="flex-1 py-1.5 rounded-lg bg-[#c9a962] text-black text-xs font-medium hover:bg-[#b8944f] disabled:opacity-40">
                      Save
                    </button>
                    <button onClick={() => setShowPoints(null)} className="px-3 py-1.5 rounded-lg border border-white/10 text-white/40 text-xs">Cancel</button>
                  </div>
                  {/* History */}
                  {(acc.points_history || []).length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {[...(acc.points_history || [])].reverse().slice(0, 5).map((h, i) => (
                        <div key={i} className="flex justify-between text-xs text-white/40">
                          <span>{h.date} · {h.description}</span>
                          <span className={h.type === 'earn' ? 'text-emerald-400' : 'text-red-400'}>{h.type === 'earn' ? '+' : '-'}{h.points}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-white/30"><Gift className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No loyalty members yet</p></div>
        )}
      </div>

      {/* Enroll Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Enroll Guest</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-3">
              {[['guest_name','Full Name','text'],['guest_email','Email','email'],['phone','Phone','tel']].map(([k,l,t]) => (
                <div key={k}><label className="text-white/60 text-xs mb-1 block">{l}</label>
                  <Input type={t} value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/60 text-xs mb-1 block">Birthday</label>
                  <Input type="date" value={form.date_of_birth} onChange={e=>setForm(f=>({...f,date_of_birth:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">Anniversary</label>
                  <Input type="date" value={form.anniversary_date} onChange={e=>setForm(f=>({...f,anniversary_date:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <Button onClick={() => create.mutate()} disabled={!form.guest_name || !form.guest_email || create.isPending}
                className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black mt-2">Enroll</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}