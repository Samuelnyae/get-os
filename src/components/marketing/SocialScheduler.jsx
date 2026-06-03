import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Plus, X, Sparkles, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400' },
  { id: 'facebook',  label: 'Facebook',  icon: Facebook,  color: 'text-blue-400' },
  { id: 'twitter',   label: 'X/Twitter', icon: Twitter,   color: 'text-sky-400' },
  { id: 'tiktok',    label: 'TikTok',    icon: Share2,    color: 'text-white' },
  { id: 'youtube',   label: 'YouTube',   icon: Youtube,   color: 'text-red-400' },
];

const STATUS_COLORS = {
  draft: 'text-white/50 bg-white/5 border-white/10',
  scheduled: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  published: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  failed: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const EMPTY = { content: '', platforms: [], image_url: '', hashtags: [], scheduled_date: '', scheduled_time: '', notes: '' };

export default function SocialScheduler() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [hashtagInput, setHashtagInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { data: posts = [] } = useQuery({ queryKey: ['social-posts'], queryFn: () => base44.entities.SocialPost.list('-created_date') });

  const save = useMutation({
    mutationFn: () => base44.entities.SocialPost.create({ ...form, status: form.scheduled_date ? 'scheduled' : 'draft' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['social-posts'] }); setShowForm(false); setForm(EMPTY); },
  });

  const publish = useMutation({
    mutationFn: (id) => base44.entities.SocialPost.update(id, { status: 'published', published_at: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-posts'] }),
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.SocialPost.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-posts'] }),
  });

  const togglePlatform = (id) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(id) ? f.platforms.filter(p => p !== id) : [...f.platforms, id],
    }));
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace('#', '');
    if (tag && !form.hashtags.includes(tag)) {
      setForm(f => ({ ...f, hashtags: [...f.hashtags, tag] }));
    }
    setHashtagInput('');
  };

  const generateCaption = async () => {
    setAiLoading(true);
    const platforms = form.platforms.map(p => PLATFORMS.find(pl => pl.id === p)?.label).join(', ') || 'social media';
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write an engaging ${platforms} caption for Digital Bites luxury hotel. ${form.notes ? `Context: ${form.notes}` : 'Highlight the luxury dining and accommodation experience.'}. Keep it compelling, max 2-3 sentences. Do NOT include hashtags (we add those separately).`,
    });
    setForm(f => ({ ...f, content: result }));
    setAiLoading(false);
  };

  const stats = { draft: 0, scheduled: 0, published: 0 };
  posts.forEach(p => { if (stats[p.status] !== undefined) stats[p.status]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Social Media Scheduler</h3>
          <p className="text-white/40 text-sm">{stats.scheduled} scheduled · {stats.published} published</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> New Post
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[['draft','Drafts','text-white/50'],['scheduled','Scheduled','text-amber-400'],['published','Published','text-emerald-400']].map(([k,l,c]) => (
          <div key={k} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <div className={`text-2xl font-bold ${c}`}>{stats[k]}</div>
            <div className="text-white/40 text-xs">{l}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {(post.platforms || []).map(pId => {
                    const p = PLATFORMS.find(pl => pl.id === pId);
                    if (!p) return null;
                    const Icon = p.icon;
                    return <Icon key={pId} className={`w-4 h-4 ${p.color}`} />;
                  })}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[post.status]}`}>{post.status}</span>
                  {post.scheduled_date && <span className="text-white/30 text-xs">📅 {post.scheduled_date} {post.scheduled_time}</span>}
                </div>
                <p className="text-white/80 text-sm mb-2">{post.content}</p>
                {(post.hashtags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.map(h => (
                      <span key={h} className="text-xs text-[#c9a962]/60">#{h}</span>
                    ))}
                  </div>
                )}
                {post.image_url && <div className="text-white/30 text-xs mt-1">🖼 Image attached</div>}
              </div>
              <div className="flex gap-1 shrink-0">
                {post.status !== 'published' && (
                  <button onClick={() => publish.mutate(post.id)} className="text-xs px-2 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20">Publish</button>
                )}
                <button onClick={() => del.mutate(post.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="text-center py-10 text-white/30"><Share2 className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No posts yet</p></div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">New Social Post</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-2 block">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => {
                    const Icon = p.icon;
                    const active = form.platforms.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${active ? `border-[#c9a962]/40 bg-[#c9a962]/10 ${p.color}` : 'border-white/10 text-white/40'}`}>
                        <Icon className="w-3.5 h-3.5" />{p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div><label className="text-white/60 text-xs mb-1 block">Context / Notes (for AI)</label>
                <Input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. New spa opening, weekend offer..." className="bg-[#111] border-white/10 text-white" /></div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white/60 text-xs">Caption</label>
                  <button onClick={generateCaption} disabled={aiLoading} className="flex items-center gap-1 text-xs text-[#c9a962] hover:text-[#b8944f] disabled:opacity-40">
                    <Sparkles className="w-3 h-3" /> {aiLoading ? 'Writing...' : 'AI Write'}
                  </button>
                </div>
                <textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))}
                  rows={4} placeholder="Write caption or use AI..." className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Hashtags</label>
                <div className="flex gap-2">
                  <Input value={hashtagInput} onChange={e=>setHashtagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHashtag()}
                    placeholder="Type tag + Enter" className="bg-[#111] border-white/10 text-white flex-1" />
                  <Button onClick={addHashtag} variant="outline" className="border-white/10 text-white/50 bg-transparent hover:bg-white/5">Add</Button>
                </div>
                {form.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.hashtags.map(h => (
                      <span key={h} className="flex items-center gap-1 text-xs bg-[#c9a962]/10 text-[#c9a962] px-2 py-0.5 rounded-full border border-[#c9a962]/20">
                        #{h} <button onClick={() => setForm(f=>({...f,hashtags:f.hashtags.filter(x=>x!==h)}))}><X className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div><label className="text-white/60 text-xs mb-1 block">Image URL (optional)</label>
                <Input value={form.image_url} onChange={e=>setForm(f=>({...f,image_url:e.target.value}))} placeholder="https://..." className="bg-[#111] border-white/10 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/60 text-xs mb-1 block">Date</label>
                  <Input type="date" value={form.scheduled_date} onChange={e=>setForm(f=>({...f,scheduled_date:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">Time</label>
                  <Input type="time" value={form.scheduled_time} onChange={e=>setForm(f=>({...f,scheduled_time:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <Button onClick={() => save.mutate()} disabled={!form.content || form.platforms.length === 0 || save.isPending} className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">
                {form.scheduled_date ? 'Schedule Post' : 'Save Draft'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}