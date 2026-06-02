import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Megaphone, Plus, X, Pin, Trash2, AlertTriangle, Info, Bell } from 'lucide-react';

const PRIORITY_CONFIG = {
  normal:    { label: 'Normal',    color: 'bg-white/5 border-white/10 text-white/70',           icon: Info,          badge: 'text-white/40 bg-white/5 border-white/10' },
  important: { label: 'Important', color: 'bg-blue-500/10 border-blue-500/20 text-white',       icon: Bell,          badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  urgent:    { label: 'Urgent',    color: 'bg-red-500/10 border-red-500/20 text-white',         icon: AlertTriangle, badge: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

const EMPTY_FORM = { title: '', content: '', priority: 'normal', posted_by: '', expires_at: '', pinned: false, target_roles: [] };

const ROLES = ['chef', 'kitchen_assistant', 'delivery', 'manager'];

export default function NoticeBoard() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 30),
  });

  const save = useMutation({
    mutationFn: () => base44.entities.Announcement.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const togglePin = useMutation({
    mutationFn: ({ id, pinned }) => base44.entities.Announcement.update(id, { pinned }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const toggleRole = (role) => setForm(f => ({
    ...f, target_roles: f.target_roles.includes(role) ? f.target_roles.filter(r => r !== role) : [...f.target_roles, role]
  }));

  const isExpired = (a) => a.expires_at && new Date(a.expires_at) < new Date();

  // Pinned first, then by date
  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Notice Board</h3>
          <p className="text-white/40 text-sm">{announcements.filter(a => !isExpired(a)).length} active announcements</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> Post Announcement
        </Button>
      </div>

      <div className="space-y-3">
        {sorted.map(a => {
          const cfg = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
          const Icon = cfg.icon;
          const expired = isExpired(a);
          return (
            <div key={a.id} className={`border rounded-2xl p-5 transition-all ${expired ? 'opacity-50' : ''} ${a.pinned ? 'ring-1 ring-[#c9a962]/30' : ''} ${cfg.color}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className="w-5 h-5 mt-0.5 shrink-0 opacity-70" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {a.pinned && <Pin className="w-3.5 h-3.5 text-[#c9a962]" />}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
                      {expired && <span className="text-xs px-2 py-0.5 rounded-full border bg-white/5 text-white/30 border-white/10">Expired</span>}
                      {(a.target_roles || []).map(r => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded-full border border-[#c9a962]/20 text-[#c9a962]/70 capitalize">{r.replace('_',' ')}</span>
                      ))}
                    </div>
                    <div className="font-semibold text-base mb-1">{a.title}</div>
                    <div className="text-sm opacity-70 whitespace-pre-wrap">{a.content}</div>
                    <div className="text-xs opacity-40 mt-2">
                      Posted by {a.posted_by || 'Management'}
                      {a.expires_at ? ` · Expires ${a.expires_at}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => togglePin.mutate({ id: a.id, pinned: !a.pinned })}
                    className={`p-1.5 rounded-lg border transition-all ${a.pinned ? 'border-[#c9a962]/40 bg-[#c9a962]/20 text-[#c9a962]' : 'border-white/10 text-white/30 hover:text-[#c9a962]'}`}>
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => del.mutate(a.id)} className="p-1.5 rounded-lg border border-red-500/20 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {announcements.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No announcements posted</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Post Announcement</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-1 block">Title *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-[#111] border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Message *</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={4} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Posted By</label>
                  <Input value={form.posted_by} onChange={e => setForm(f => ({ ...f, posted_by: e.target.value }))} placeholder="Your name" className="bg-[#111] border-white/10 text-white" />
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Expiry Date (optional)</label>
                <Input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="bg-[#111] border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-2 block">Target Roles (leave empty = all staff)</label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(r => (
                    <button key={r} type="button" onClick={() => toggleRole(r)}
                      className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-all ${form.target_roles.includes(r) ? 'bg-[#c9a962]/20 border-[#c9a962]/40 text-[#c9a962]' : 'border-white/10 text-white/50'}`}>
                      {r.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pin" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} className="rounded" />
                <label htmlFor="pin" className="text-white/60 text-sm">Pin to top of board</label>
              </div>
              <Button onClick={() => save.mutate()} disabled={!form.title || !form.content || save.isPending} className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">
                {save.isPending ? 'Posting...' : 'Post Announcement'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}