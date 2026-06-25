import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarDays, X } from 'lucide-react';

const EVENT_TYPES = {
  wedding:      { label: 'Wedding',      icon: '💍' },
  conference:   { label: 'Conference',   icon: '🎤' },
  birthday_party:{ label: 'Birthday Party',icon: '🎂' },
  corporate:    { label: 'Corporate',    icon: '🏢' },
  gala:         { label: 'Gala',         icon: '✨' },
  workshop:     { label: 'Workshop',     icon: '🛠️' },
  other:        { label: 'Other',        icon: '📋' },
};

const STATUS_COLORS = {
  inquiry:   'text-white/50 bg-white/5 border-white/10',
  quoted:    'text-amber-400 bg-amber-500/10 border-amber-500/20',
  confirmed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  completed: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function EventBookingsAdmin() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('inquiry');

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.EventBooking.list('-created_date') });

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

  const filtered = activeFilter === 'all' ? events : events.filter(e => e.status === activeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-semibold text-lg">Event Bookings Management</h3>
        <p className="text-white/40 text-sm">Review inquiries, send quotes & manage event statuses</p>
      </div>

      {/* Stat tabs */}
      <div className="grid grid-cols-3 gap-3">
        {[['inquiry','Inquiries','text-white/60'],['confirmed','Confirmed','text-emerald-400'],['completed','Completed','text-blue-400']].map(([k,l,c]) => (
          <button key={k} onClick={() => setActiveFilter(k)}
            className={`bg-[#1a1a1a] border rounded-xl p-4 text-left transition-all ${activeFilter === k ? 'border-[#c9a962]/40' : 'border-white/10 hover:border-white/20'}`}>
            <div className={`text-2xl font-bold ${c}`}>{stats[k]}</div>
            <div className="text-white/40 text-xs">{l}</div>
          </button>
        ))}
      </div>

      {/* Filter indicator */}
      <div className="flex items-center gap-2">
        <span className="text-white/40 text-xs">Showing:</span>
        <span className="text-[#c9a962] text-xs font-medium capitalize">{activeFilter}</span>
        <button onClick={() => setActiveFilter('all')} className="text-white/30 text-xs hover:text-white/60">View all</button>
      </div>

      {/* Events list */}
      <div className="space-y-4">
        {filtered.map(ev => {
          const cfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.other;
          const isOpen = selectedId === ev.id;
          return (
            <div key={ev.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden transition-all">
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
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30"><CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No {activeFilter} events</p></div>
        )}
      </div>
    </div>
  );
}