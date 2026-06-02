import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Plus, X, Cake, Heart, Star, Send, RefreshCw, Sparkles } from 'lucide-react';

const TYPE_CONFIG = {
  birthday:     { label: 'Birthday',      icon: Cake,   color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20' },
  anniversary:  { label: 'Anniversary',   icon: Heart,  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  loyalty_tier: { label: 'Tier Upgrade',  icon: Star,   color: 'text-[#c9a962]',  bg: 'bg-[#c9a962]/10 border-[#c9a962]/20' },
  post_stay:    { label: 'Post-Stay',     icon: Send,   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  win_back:     { label: 'Win-Back',      icon: RefreshCw, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
};

const STATUS_CONFIG = {
  scheduled: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  sent:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  failed:    'text-red-400 bg-red-500/10 border-red-500/20',
};

const EMPTY = { campaign_type: 'birthday', guest_name: '', guest_email: '', scheduled_date: '', message: '', offer: '' };

export default function AutoCampaigns() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [generating, setGenerating] = useState(false);

  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: () => base44.entities.AutoCampaign.list('-created_date') });
  const { data: loyalty = [] } = useQuery({ queryKey: ['loyalty'], queryFn: () => base44.entities.LoyaltyAccount.list() });

  const save = useMutation({
    mutationFn: () => base44.entities.AutoCampaign.create({ ...form, status: 'scheduled' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setShowForm(false); setForm(EMPTY); },
  });

  const markSent = useMutation({
    mutationFn: (id) => base44.entities.AutoCampaign.update(id, { status: 'sent', sent_at: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.AutoCampaign.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const generateMessage = async () => {
    setGenerating(true);
    const typeName = TYPE_CONFIG[form.campaign_type]?.label || form.campaign_type;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a short, warm, luxury hotel ${typeName} campaign message for guest: ${form.guest_name || 'valued guest'}. Include the offer: "${form.offer || 'a special surprise'}". Keep it under 100 words. Warm, personal, elegant tone.`
    });
    setForm(f => ({ ...f, message: result }));
    setGenerating(false);
  };

  // Auto-detect upcoming birthdays/anniversaries from loyalty accounts
  const today = new Date();
  const upcomingBirthdays = loyalty.filter(acc => {
    if (!acc.date_of_birth) return false;
    const bday = new Date(acc.date_of_birth);
    const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    return (next - today) / 86400000 <= 14;
  });

  const stats = { scheduled: 0, sent: 0, failed: 0 };
  campaigns.forEach(c => { if (stats[c.status] !== undefined) stats[c.status]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Auto Campaigns</h3>
          <p className="text-white/40 text-sm">Birthday, anniversary & loyalty campaigns</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[['scheduled','Scheduled','text-amber-400'],['sent','Sent','text-emerald-400'],['failed','Failed','text-red-400']].map(([k,l,c]) => (
          <div key={k} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <div className={`text-2xl font-bold ${c}`}>{stats[k]}</div>
            <div className="text-white/40 text-xs">{l}</div>
          </div>
        ))}
      </div>

      {/* Upcoming Birthdays Alert */}
      {upcomingBirthdays.length > 0 && (
        <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cake className="w-4 h-4 text-pink-400" />
            <span className="text-pink-400 text-sm font-medium">Upcoming Birthdays (next 14 days)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {upcomingBirthdays.map(acc => (
              <button key={acc.id} onClick={() => { setForm(f => ({ ...f, campaign_type: 'birthday', guest_name: acc.guest_name, guest_email: acc.guest_email })); setShowForm(true); }}
                className="text-xs px-3 py-1.5 rounded-full bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-all">
                🎂 {acc.guest_name} ({acc.date_of_birth})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Campaign List */}
      <div className="space-y-3">
        {campaigns.map(c => {
          const typeCfg = TYPE_CONFIG[c.campaign_type] || TYPE_CONFIG.post_stay;
          const Icon = typeCfg.icon;
          return (
            <div key={c.id} className={`border rounded-2xl p-5 ${typeCfg.bg}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className={`w-5 h-5 mt-0.5 ${typeCfg.color} shrink-0`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-sm font-medium ${typeCfg.color}`}>{typeCfg.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_CONFIG[c.status]}`}>{c.status}</span>
                    </div>
                    <div className="text-white text-sm">{c.guest_name} · {c.guest_email}</div>
                    {c.offer && <div className="text-white/50 text-xs mt-0.5">🎁 {c.offer}</div>}
                    {c.message && <div className="text-white/40 text-xs mt-1 italic line-clamp-2">"{c.message}"</div>}
                    <div className="text-white/30 text-xs mt-1">📅 {c.scheduled_date || 'No date set'}</div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {c.status === 'scheduled' && (
                    <button onClick={() => markSent.mutate(c.id)} className="text-xs px-2 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30">
                      Mark Sent
                    </button>
                  )}
                  <button onClick={() => del.mutate(c.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {campaigns.length === 0 && (
          <div className="text-center py-12 text-white/30"><Gift className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No campaigns yet</p></div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">New Campaign</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-1 block">Campaign Type</label>
                <select value={form.campaign_type} onChange={e=>setForm(f=>({...f,campaign_type:e.target.value}))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  {Object.entries(TYPE_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/60 text-xs mb-1 block">Guest Name</label>
                  <Input value={form.guest_name} onChange={e=>setForm(f=>({...f,guest_name:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">Email</label>
                  <Input type="email" value={form.guest_email} onChange={e=>setForm(f=>({...f,guest_email:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Special Offer</label>
                <Input value={form.offer} onChange={e=>setForm(f=>({...f,offer:e.target.value}))} placeholder="e.g. 20% off next stay, free spa" className="bg-[#111] border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Scheduled Date</label>
                <Input type="date" value={form.scheduled_date} onChange={e=>setForm(f=>({...f,scheduled_date:e.target.value}))} className="bg-[#111] border-white/10 text-white" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white/60 text-xs">Message</label>
                  <button onClick={generateMessage} disabled={generating}
                    className="flex items-center gap-1 text-xs text-[#c9a962] hover:text-[#b8944f] disabled:opacity-50">
                    <Sparkles className="w-3 h-3" /> {generating ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))}
                  rows={4} placeholder="Write message or use AI generate..."
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              </div>
              <Button onClick={() => save.mutate()} disabled={!form.guest_name || !form.guest_email || save.isPending}
                className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">Schedule Campaign</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}