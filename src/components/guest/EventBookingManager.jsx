import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, Plus, X, Building, Users, Utensils, Tv, Flower } from 'lucide-react';

const EVENT_TYPES = {
  wedding:      { label: 'Wedding',      icon: '💍', color: 'bg-pink-500/10 border-pink-500/20 text-pink-400' },
  conference:   { label: 'Conference',   icon: '🎤', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  birthday_party:{ label: 'Birthday Party',icon: '🎂', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  corporate:    { label: 'Corporate',    icon: '🏢', color: 'bg-slate-500/10 border-slate-500/20 text-slate-300' },
  gala:         { label: 'Gala',         icon: '✨', color: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
  workshop:     { label: 'Workshop',     icon: '🛠️', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  other:        { label: 'Other',        icon: '📋', color: 'bg-white/5 border-white/10 text-white/50' },
};

const STATUS_COLORS = {
  inquiry:   'text-white/50 bg-white/5 border-white/10',
  quoted:    'text-amber-400 bg-amber-500/10 border-amber-500/20',
  confirmed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  completed: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const EMPTY = {
  event_type: 'conference', organizer_name: '', organizer_email: '', organizer_phone: '',
  event_date: '', start_time: '', end_time: '', guest_count: 50, venue: '',
  catering_required: false, av_required: false, decor_required: false,
  special_requirements: '', estimated_budget: '', status: 'inquiry',
};

export default function EventBookingManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [quoteAmt, setQuoteAmt] = useState('');

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.EventBooking.list('-created_date') });

  const save = useMutation({
    mutationFn: () => base44.entities.EventBooking.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setShowForm(false); setForm(EMPTY); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, quoted_amount }) => base44.entities.EventBooking.update(id, { status, ...(quoted_amount ? { quoted_amount: Number(quoted_amount) } : {}) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setSelectedId(null); },
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.EventBooking.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });

  const stats = { inquiry: 0, confirmed: 0, completed: 0 };
  events.forEach(e => { if (stats[e.status] !== undefined) stats[e.status]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Event Bookings</h3>
          <p className="text-white/40 text-sm">Weddings, conferences, celebrations</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> New Inquiry
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[['inquiry','Inquiries','text-white/60'],['confirmed','Confirmed','text-emerald-400'],['completed','Completed','text-blue-400']].map(([k,l,c]) => (
          <div key={k} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <div className={`text-2xl font-bold ${c}`}>{stats[k]}</div>
            <div className="text-white/40 text-xs">{l}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {events.map(ev => {
          const cfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.other;
          const isOpen = selectedId === ev.id;
          return (
            <div key={ev.id} className={`bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden transition-all`}>
              <div className="p-5 cursor-pointer" onClick={() => setSelectedId(isOpen ? null : ev.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{cfg.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-medium">{ev.organizer_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[ev.status]}`}>{ev.status}</span>
                      </div>
                      <div className="text-white/40 text-sm">{cfg.label} · {ev.event_date} · {ev.guest_count} guests</div>
                      <div className="text-white/30 text-xs mt-0.5">{ev.venue || 'Venue TBD'} · {ev.start_time}–{ev.end_time}</div>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {ev.catering_required && <span className="text-xs text-white/40">🍽 Catering</span>}
                        {ev.av_required && <span className="text-xs text-white/40">🎤 A/V</span>}
                        {ev.decor_required && <span className="text-xs text-white/40">🌸 Décor</span>}
                      </div>
                      {ev.quoted_amount && <div className="text-[#c9a962] text-sm font-medium mt-1">Quoted: KES {ev.quoted_amount.toLocaleString()}</div>}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); del.mutate(ev.id); }} className="text-white/20 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-white/5 p-5 space-y-3">
                  {ev.special_requirements && <div className="text-white/50 text-sm italic">"{ev.special_requirements}"</div>}
                  <div className="text-white/40 text-xs">{ev.organizer_email} · {ev.organizer_phone}</div>
                  {ev.estimated_budget && <div className="text-white/40 text-xs">Budget: KES {Number(ev.estimated_budget).toLocaleString()}</div>}
                  <div className="flex flex-wrap gap-2">
                    {['inquiry','quoted','confirmed','completed','cancelled'].map(s => (
                      <button key={s} onClick={() => {
                        if (s === 'quoted') {
                          const amt = prompt('Enter quoted amount (KES):');
                          if (amt) updateStatus.mutate({ id: ev.id, status: s, quoted_amount: amt });
                        } else {
                          updateStatus.mutate({ id: ev.id, status: s });
                        }
                      }}
                        className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all ${ev.status === s ? 'bg-[#c9a962]/20 border-[#c9a962]/40 text-[#c9a962]' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="text-center py-12 text-white/30"><CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No event inquiries yet</p></div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">New Event Inquiry</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-2 block">Event Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(EVENT_TYPES).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setForm(f => ({ ...f, event_type: k }))}
                      className={`py-2 px-1 rounded-xl border text-center text-xs transition-all ${form.event_type === k ? 'border-[#c9a962]/40 bg-[#c9a962]/10 text-[#c9a962]' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                      <div className="text-lg mb-0.5">{v.icon}</div>{v.label}
                    </button>
                  ))}
                </div>
              </div>
              {[['organizer_name','Organizer Name','text'],['organizer_email','Email','email'],['organizer_phone','Phone','tel']].map(([k,l,t]) => (
                <div key={k}><label className="text-white/60 text-xs mb-1 block">{l}</label>
                  <Input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/60 text-xs mb-1 block">Event Date</label>
                  <Input type="date" value={form.event_date} onChange={e=>setForm(f=>({...f,event_date:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">Guest Count</label>
                  <Input type="number" value={form.guest_count} onChange={e=>setForm(f=>({...f,guest_count:Number(e.target.value)}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-white/60 text-xs mb-1 block">Venue / Hall</label>
                  <Input value={form.venue} onChange={e=>setForm(f=>({...f,venue:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">Start</label>
                  <Input type="time" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">End</label>
                  <Input type="time" value={form.end_time} onChange={e=>setForm(f=>({...f,end_time:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <div className="flex gap-4">
                {[['catering_required','🍽 Catering'],['av_required','🎤 A/V'],['decor_required','🌸 Décor']].map(([k,l]) => (
                  <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.checked}))} className="rounded" />
                    <span className="text-white/60 text-sm">{l}</span>
                  </label>
                ))}
              </div>
              <div><label className="text-white/60 text-xs mb-1 block">Estimated Budget (KES)</label>
                <Input type="number" value={form.estimated_budget} onChange={e=>setForm(f=>({...f,estimated_budget:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              <div><label className="text-white/60 text-xs mb-1 block">Special Requirements</label>
                <textarea value={form.special_requirements} onChange={e=>setForm(f=>({...f,special_requirements:e.target.value}))}
                  rows={2} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" /></div>
              <Button onClick={() => save.mutate()} disabled={!form.organizer_name || !form.organizer_email || !form.event_date || save.isPending}
                className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">Submit Inquiry</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}