import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Plus, X, Sparkles, Send, Clock, Users } from 'lucide-react';

const AUDIENCE_LABELS = {
  all_guests: 'All Guests', vip: 'VIP Only', loyalty_gold: 'Gold & Platinum',
  post_stay: 'Post-Stay', custom: 'Custom List',
};

const STATUS_COLORS = {
  draft: 'text-white/50 bg-white/5 border-white/10',
  scheduled: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  sent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  failed: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const EMPTY = { name: '', type: 'email', subject: '', body: '', audience: 'all_guests', scheduled_at: '' };

export default function EmailCampaignBuilder() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns-crm'],
    queryFn: () => base44.entities.Campaign.filter({ type: 'email' }, '-created_date'),
  });

  const save = useMutation({
    mutationFn: () => base44.entities.Campaign.create({ ...form, status: form.scheduled_at ? 'scheduled' : 'draft' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns-crm'] }); setShowForm(false); setForm(EMPTY); },
  });

  const markSent = useMutation({
    mutationFn: (id) => base44.entities.Campaign.update(id, { status: 'sent', sent_at: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns-crm'] }),
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.Campaign.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns-crm'] }),
  });

  const generateBody = async () => {
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a luxury hotel email campaign body for: "${form.name}". Subject: "${form.subject}". Audience: ${AUDIENCE_LABELS[form.audience]}. Keep it elegant, warm, ~150 words. Include a clear call-to-action. Hotel name: Digital Bites.`,
    });
    setForm(f => ({ ...f, body: result }));
    setAiLoading(false);
  };

  const stats = { draft: 0, scheduled: 0, sent: 0 };
  campaigns.forEach(c => { if (stats[c.status] !== undefined) stats[c.status]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Email Campaigns</h3>
          <p className="text-white/40 text-sm">{campaigns.length} campaigns total</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[['draft','Drafts','text-white/50'],['scheduled','Scheduled','text-amber-400'],['sent','Sent','text-emerald-400']].map(([k,l,c]) => (
          <div key={k} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <div className={`text-2xl font-bold ${c}`}>{stats[k]}</div>
            <div className="text-white/40 text-xs">{l}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {campaigns.map(c => (
          <div key={c.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <Mail className="w-5 h-5 text-[#c9a962] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white font-medium">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </div>
                  {c.subject && <div className="text-white/50 text-sm">Subject: {c.subject}</div>}
                  <div className="text-white/30 text-xs mt-0.5">{AUDIENCE_LABELS[c.audience]} {c.scheduled_at ? `· Scheduled ${c.scheduled_at}` : ''}</div>
                  {c.body && <div className="text-white/30 text-xs mt-1 line-clamp-2 italic">{c.body}</div>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {c.status !== 'sent' && (
                  <button onClick={() => markSent.mutate(c.id)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20">
                    <Send className="w-3 h-3" />
                  </button>
                )}
                <button onClick={() => del.mutate(c.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="text-center py-10 text-white/30"><Mail className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No email campaigns yet</p></div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">New Email Campaign</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-white/60 text-xs mb-1 block">Campaign Name</label>
                <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              <div><label className="text-white/60 text-xs mb-1 block">Subject Line</label>
                <Input value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Audience</label>
                <select value={form.audience} onChange={e=>setForm(f=>({...f,audience:e.target.value}))} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  {Object.entries(AUDIENCE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white/60 text-xs">Email Body</label>
                  <button onClick={generateBody} disabled={aiLoading || !form.name} className="flex items-center gap-1 text-xs text-[#c9a962] hover:text-[#b8944f] disabled:opacity-40">
                    <Sparkles className="w-3 h-3" /> {aiLoading ? 'Generating...' : 'AI Write'}
                  </button>
                </div>
                <textarea value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))}
                  rows={6} placeholder="Write your email body or use AI..."
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              </div>
              <div><label className="text-white/60 text-xs mb-1 block">Schedule Date/Time (optional)</label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={e=>setForm(f=>({...f,scheduled_at:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending} className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">
                {form.scheduled_at ? 'Schedule Campaign' : 'Save as Draft'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}