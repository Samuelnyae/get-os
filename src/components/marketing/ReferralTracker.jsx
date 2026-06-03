import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, X, Gift, CheckCircle, Copy } from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  converted: { label: 'Converted', color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  rewarded:  { label: 'Rewarded',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

const EMPTY = { referrer_name: '', referrer_email: '', referred_name: '', referred_email: '', reward_type: '10% off next stay' };

function genCode() {
  return 'REF' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

export default function ReferralTracker() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [copied, setCopied] = useState(null);

  const { data: referrals = [] } = useQuery({ queryKey: ['referrals'], queryFn: () => base44.entities.Referral.list('-created_date') });

  const save = useMutation({
    mutationFn: () => base44.entities.Referral.create({ ...form, referral_code: genCode(), status: 'pending', reward_given: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['referrals'] }); setShowForm(false); setForm(EMPTY); },
  });

  const convert = useMutation({
    mutationFn: (id) => base44.entities.Referral.update(id, { status: 'converted', converted_at: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referrals'] }),
  });

  const reward = useMutation({
    mutationFn: (id) => base44.entities.Referral.update(id, { status: 'rewarded', reward_given: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referrals'] }),
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.Referral.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referrals'] }),
  });

  const copyCode = (code) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 1500); };

  const stats = { pending: 0, converted: 0, rewarded: 0 };
  referrals.forEach(r => { if (stats[r.status] !== undefined) stats[r.status]++; });
  const conversionRate = referrals.length ? Math.round(((stats.converted + stats.rewarded) / referrals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Referral Program</h3>
          <p className="text-white/40 text-sm">{referrals.length} referrals · {conversionRate}% conversion</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> New Referral
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[['pending','Pending','text-amber-400'],['converted','Converted','text-blue-400'],['rewarded','Rewarded','text-emerald-400']].map(([k,l,c]) => (
          <div key={k} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <div className={`text-2xl font-bold ${c}`}>{stats[k]}</div>
            <div className="text-white/40 text-xs">{l}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {referrals.map(ref => {
          const cfg = STATUS_CONFIG[ref.status];
          return (
            <div key={ref.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <button onClick={() => copyCode(ref.referral_code)} className="font-mono text-[#c9a962] font-bold tracking-wider flex items-center gap-1 hover:text-[#e4d5a7]">
                      {ref.referral_code}<Copy className="w-3 h-3 opacity-60" />
                    </button>
                    {copied === ref.referral_code && <span className="text-xs text-emerald-400">Copied!</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-white/30 text-xs mb-0.5">Referrer</div>
                      <div className="text-white font-medium">{ref.referrer_name}</div>
                      <div className="text-white/40 text-xs">{ref.referrer_email}</div>
                    </div>
                    {ref.referred_name && (
                      <div>
                        <div className="text-white/30 text-xs mb-0.5">Referred</div>
                        <div className="text-white font-medium">{ref.referred_name}</div>
                        <div className="text-white/40 text-xs">{ref.referred_email}</div>
                      </div>
                    )}
                  </div>
                  {ref.reward_type && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-[#c9a962]" />
                      <span className="text-[#c9a962]/70 text-xs">{ref.reward_type}</span>
                      {ref.reward_given && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-1" />}
                    </div>
                  )}
                  {ref.converted_at && <div className="text-white/30 text-xs mt-1">Converted: {new Date(ref.converted_at).toLocaleDateString()}</div>}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {ref.status === 'pending' && (
                    <button onClick={() => convert.mutate(ref.id)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 whitespace-nowrap">Mark Converted</button>
                  )}
                  {ref.status === 'converted' && (
                    <button onClick={() => reward.mutate(ref.id)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 whitespace-nowrap">Give Reward</button>
                  )}
                  <button onClick={() => del.mutate(ref.id)} className="text-xs px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-center">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
        {referrals.length === 0 && (
          <div className="text-center py-10 text-white/30"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No referrals yet</p></div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">New Referral</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div className="border border-[#c9a962]/10 rounded-xl p-4 bg-[#c9a962]/5">
                <div className="text-[#c9a962] text-xs uppercase tracking-wider mb-3">Referrer (existing guest)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-white/60 text-xs mb-1 block">Name</label>
                    <Input value={form.referrer_name} onChange={e=>setForm(f=>({...f,referrer_name:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                  <div><label className="text-white/60 text-xs mb-1 block">Email</label>
                    <Input type="email" value={form.referrer_email} onChange={e=>setForm(f=>({...f,referrer_email:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                </div>
              </div>
              <div className="border border-white/10 rounded-xl p-4">
                <div className="text-white/40 text-xs uppercase tracking-wider mb-3">Referred (new guest — optional)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-white/60 text-xs mb-1 block">Name</label>
                    <Input value={form.referred_name} onChange={e=>setForm(f=>({...f,referred_name:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                  <div><label className="text-white/60 text-xs mb-1 block">Email</label>
                    <Input type="email" value={form.referred_email} onChange={e=>setForm(f=>({...f,referred_email:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                </div>
              </div>
              <div><label className="text-white/60 text-xs mb-1 block">Reward for Referrer</label>
                <Input value={form.reward_type} onChange={e=>setForm(f=>({...f,reward_type:e.target.value}))} placeholder="e.g. 10% off, 500 loyalty pts" className="bg-[#111] border-white/10 text-white" /></div>
              <Button onClick={() => save.mutate()} disabled={!form.referrer_name || !form.referrer_email || save.isPending} className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">Create Referral</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}