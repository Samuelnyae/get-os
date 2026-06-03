import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Plus, X, Sparkles, ExternalLink, Flag } from 'lucide-react';

const PLATFORM_CONFIG = {
  google:      { label: 'Google',      icon: '🔍', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  tripadvisor: { label: 'TripAdvisor', icon: '🦉', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  booking:     { label: 'Booking.com', icon: '🏨', color: 'text-blue-300',   bg: 'bg-blue-400/10 border-blue-400/20' },
  yelp:        { label: 'Yelp',        icon: '⭐', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  other:       { label: 'Other',       icon: '💬', color: 'text-white/50',   bg: 'bg-white/5 border-white/10' },
};

const EMPTY = { platform: 'google', reviewer_name: '', rating: 5, review_text: '', review_date: '', url: '', response: '' };

export default function ReviewManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState('all');

  const { data: reviews = [] } = useQuery({ queryKey: ['reviews'], queryFn: () => base44.entities.Review.list('-created_date') });

  const save = useMutation({
    mutationFn: () => base44.entities.Review.create({ ...form, status: 'new' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews'] }); setShowForm(false); setForm(EMPTY); },
  });

  const respond = useMutation({
    mutationFn: ({ id }) => base44.entities.Review.update(id, { response: responseText, responded_at: new Date().toISOString(), status: 'responded' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews'] }); setRespondingId(null); setResponseText(''); },
  });

  const flag = useMutation({
    mutationFn: (id) => base44.entities.Review.update(id, { status: 'flagged' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.Review.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });

  const generateResponse = async (review) => {
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a professional, warm hotel management response to this ${review.rating}-star ${review.platform} review from "${review.reviewer_name}": "${review.review_text}". Keep it under 100 words. Acknowledge their feedback. Hotel: Digital Bites. Sign off as "The Digital Bites Team".`,
    });
    setResponseText(result);
    setAiLoading(false);
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  const unresponded = reviews.filter(r => r.status === 'new').length;
  const filtered = reviews.filter(r => filterPlatform === 'all' || r.platform === filterPlatform);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Review Manager</h3>
          <p className="text-white/40 text-sm">⭐ {avgRating} avg · {unresponded} awaiting response</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> Add Review
        </Button>
      </div>

      {/* Platform stats */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterPlatform('all')} className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${filterPlatform === 'all' ? 'border-[#c9a962]/40 bg-[#c9a962]/10 text-[#c9a962]' : 'border-white/10 text-white/40'}`}>
          All ({reviews.length})
        </button>
        {Object.entries(PLATFORM_CONFIG).map(([k, v]) => {
          const count = reviews.filter(r => r.platform === k).length;
          if (!count) return null;
          return (
            <button key={k} onClick={() => setFilterPlatform(k)} className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${filterPlatform === k ? `${v.bg} ${v.color}` : 'border-white/10 text-white/40'}`}>
              {v.icon} {v.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {filtered.map(r => {
          const cfg = PLATFORM_CONFIG[r.platform] || PLATFORM_CONFIG.other;
          const isResponding = respondingId === r.id;
          return (
            <div key={r.id} className={`bg-[#1a1a1a] border rounded-2xl overflow-hidden ${r.status === 'flagged' ? 'border-red-500/20' : 'border-white/10'}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{cfg.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-medium">{r.reviewer_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        {r.status === 'responded' && <span className="text-xs px-2 py-0.5 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">Responded</span>}
                        {r.status === 'flagged' && <span className="text-xs px-2 py-0.5 rounded-full border text-red-400 bg-red-500/10 border-red-500/20">Flagged</span>}
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-[#c9a962] fill-[#c9a962]' : 'text-white/20'}`} />)}
                        {r.review_date && <span className="text-white/30 text-xs ml-2">{r.review_date}</span>}
                      </div>
                      {r.review_text && <p className="text-white/60 text-sm italic">"{r.review_text}"</p>}
                      {r.response && (
                        <div className="mt-3 pl-3 border-l-2 border-[#c9a962]/30">
                          <div className="text-[#c9a962] text-xs mb-1">Your Response:</div>
                          <p className="text-white/50 text-sm">{r.response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white"><ExternalLink className="w-3.5 h-3.5" /></a>}
                    {r.status !== 'flagged' && <button onClick={() => flag.mutate(r.id)} className="p-1.5 rounded-lg border border-white/10 text-white/40 hover:text-red-400"><Flag className="w-3.5 h-3.5" /></button>}
                    <button onClick={() => del.mutate(r.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {r.status === 'new' && (
                  <button onClick={() => { setRespondingId(isResponding ? null : r.id); setResponseText(''); }}
                    className="mt-3 text-xs px-3 py-1.5 rounded-lg border border-[#c9a962]/20 text-[#c9a962] bg-[#c9a962]/5 hover:bg-[#c9a962]/10">
                    {isResponding ? 'Cancel' : '✍️ Write Response'}
                  </button>
                )}
              </div>

              {isResponding && (
                <div className="border-t border-white/5 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Your response</span>
                    <button onClick={() => generateResponse(r)} disabled={aiLoading} className="flex items-center gap-1 text-xs text-[#c9a962] hover:text-[#b8944f] disabled:opacity-40">
                      <Sparkles className="w-3 h-3" /> {aiLoading ? 'Writing...' : 'AI Suggest'}
                    </button>
                  </div>
                  <textarea value={responseText} onChange={e=>setResponseText(e.target.value)} rows={3}
                    placeholder="Write a response..." className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
                  <Button onClick={() => respond.mutate({ id: r.id })} disabled={!responseText || respond.isPending}
                    className="bg-[#c9a962] hover:bg-[#b8944f] text-black text-xs">Submit Response</Button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-white/30"><Star className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No reviews yet</p></div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Add Review</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-2 block">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PLATFORM_CONFIG).map(([k,v]) => (
                    <button key={k} onClick={() => setForm(f=>({...f,platform:k}))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${form.platform === k ? `${v.bg} ${v.color}` : 'border-white/10 text-white/40'}`}>
                      {v.icon} {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/60 text-xs mb-1 block">Reviewer Name</label>
                  <Input value={form.reviewer_name} onChange={e=>setForm(f=>({...f,reviewer_name:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Rating</label>
                  <div className="flex gap-1 pt-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setForm(f=>({...f,rating:s}))}>
                        <Star className={`w-6 h-6 transition-all ${s <= form.rating ? 'text-[#c9a962] fill-[#c9a962]' : 'text-white/20'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div><label className="text-white/60 text-xs mb-1 block">Review Text</label>
                <textarea value={form.review_text} onChange={e=>setForm(f=>({...f,review_text:e.target.value}))}
                  rows={3} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/60 text-xs mb-1 block">Date</label>
                  <Input type="date" value={form.review_date} onChange={e=>setForm(f=>({...f,review_date:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">URL (optional)</label>
                  <Input value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <Button onClick={() => save.mutate()} disabled={!form.reviewer_name || save.isPending} className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">Save Review</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}