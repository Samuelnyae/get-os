import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Phone, Plus, X, Sparkles, Send, CheckCheck } from 'lucide-react';

const TYPE_CONFIG = {
  sms:      { label: 'SMS',       icon: MessageSquare, color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/20' },
  whatsapp: { label: 'WhatsApp',  icon: Phone,         color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

const AUDIENCE_LABELS = {
  all_guests: 'All Guests', vip: 'VIP Only', loyalty_gold: 'Gold & Platinum',
  post_stay: 'Post-Stay', custom: 'Custom List',
};

const EMPTY = { name: '', type: 'whatsapp', body: '', audience: 'all_guests', scheduled_at: '' };

export default function BulkMessaging() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [aiLoading, setAiLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const { data: allCampaigns = [] } = useQuery({
    queryKey: ['campaigns-msg'],
    queryFn: () => base44.entities.Campaign.list('-created_date'),
  });

  const campaigns = allCampaigns.filter(c =>
    (filterType === 'all' || c.type === filterType) && c.type !== 'email'
  );

  const save = useMutation({
    mutationFn: () => base44.entities.Campaign.create({ ...form, status: form.scheduled_at ? 'scheduled' : 'draft' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns-msg'] }); setShowForm(false); setForm(EMPTY); },
  });

  const markSent = useMutation({
    mutationFn: (id) => base44.entities.Campaign.update(id, { status: 'sent', sent_at: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns-msg'] }),
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.Campaign.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns-msg'] }),
  });

  const generateBody = async () => {
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a short ${form.type === 'whatsapp' ? 'WhatsApp' : 'SMS'} marketing message for a luxury hotel campaign: "${form.name}". Keep it under 160 chars for SMS or 300 chars for WhatsApp. Warm, engaging, with a clear offer. Hotel: Digital Bites.`,
    });
    setForm(f => ({ ...f, body: result }));
    setAiLoading(false);
  };

  const charCount = form.body.length;
  const charWarning = form.type === 'sms' && charCount > 160;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">SMS & WhatsApp Messaging</h3>
          <p className="text-white/40 text-sm">Bulk outreach campaigns</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> New Blast
        </Button>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2">
        {[['all','All'],['sms','SMS'],['whatsapp','WhatsApp']].map(([k,l]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-4 py-2 rounded-xl border text-sm transition-all ${filterType === k ? 'bg-[#c9a962]/20 border-[#c9a962]/40 text-[#c9a962]' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {campaigns.map(c => {
          const cfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.sms;
          const Icon = cfg.icon;
          return (
            <div key={c.id} className={`border rounded-2xl p-5 ${cfg.bg}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className={`w-5 h-5 mt-0.5 ${cfg.color} shrink-0`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-medium">{c.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${c.status === 'sent' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>{c.status}</span>
                    </div>
                    <div className="text-white/40 text-xs">{AUDIENCE_LABELS[c.audience]} {c.scheduled_at ? `· ${c.scheduled_at}` : ''}</div>
                    {c.body && <div className="text-white/50 text-sm mt-1 italic line-clamp-2">"{c.body}"</div>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {c.status !== 'sent' && (
                    <button onClick={() => markSent.mutate(c.id)} className={`p-1.5 rounded-lg border hover:opacity-80 ${cfg.bg} ${cfg.color}`}>
                      <CheckCheck className="w-3.5 h-3.5" />
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
          <div className="text-center py-10 text-white/30"><MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No messages yet</p></div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">New Bulk Message</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                {Object.entries(TYPE_CONFIG).map(([k,v]) => (
                  <button key={k} onClick={() => setForm(f=>({...f,type:k}))}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.type === k ? `${v.bg} ${v.color}` : 'border-white/10 text-white/40'}`}>
                    {v.label}
                  </button>
                ))}
              </div>
              <div><label className="text-white/60 text-xs mb-1 block">Campaign Name</label>
                <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Audience</label>
                <select value={form.audience} onChange={e=>setForm(f=>({...f,audience:e.target.value}))} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  {Object.entries(AUDIENCE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white/60 text-xs">Message {charWarning && <span className="text-red-400 ml-1">({charCount} chars — may split into 2 SMS)</span>}</label>
                  <button onClick={generateBody} disabled={aiLoading || !form.name} className="flex items-center gap-1 text-xs text-[#c9a962] hover:text-[#b8944f] disabled:opacity-40">
                    <Sparkles className="w-3 h-3" /> {aiLoading ? 'Generating...' : 'AI Write'}
                  </button>
                </div>
                <textarea value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))}
                  rows={4} placeholder="Write message or use AI..."
                  className={`w-full bg-[#111] border rounded-lg px-3 py-2 text-white text-sm resize-none ${charWarning ? 'border-red-500/40' : 'border-white/10'}`} />
                <div className="text-right text-xs text-white/30 mt-0.5">{charCount} chars</div>
              </div>
              <div><label className="text-white/60 text-xs mb-1 block">Schedule (optional)</label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={e=>setForm(f=>({...f,scheduled_at:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              <Button onClick={() => save.mutate()} disabled={!form.name || !form.body || save.isPending} className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">Save Campaign</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}