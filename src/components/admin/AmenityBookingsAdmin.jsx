import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles } from 'lucide-react';

const AMENITY_CONFIG = {
  spa:     { label: 'Spa',         icon: '🛁', price: 3500 },
  gym:     { label: 'Gym',         icon: '🏋️', price: 500 },
  pool:    { label: 'Pool',        icon: '🏊', price: 800 },
  sauna:   { label: 'Sauna',       icon: '🔥', price: 1200 },
  massage: { label: 'Massage',     icon: '💆', price: 4000 },
  facial:  { label: 'Facial',      icon: '✨', price: 3000 },
  tennis:  { label: 'Tennis Court',icon: '🎾', price: 1500 },
  golf:    { label: 'Golf',        icon: '⛳', price: 5000 },
  other:   { label: 'Other',       icon: '🌿', price: 0 },
};

const STATUS_COLORS = {
  pending:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  confirmed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  completed: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function AmenityBookingsAdmin() {
  const qc = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('pending');

  const { data: bookings = [] } = useQuery({ queryKey: ['amenity-bookings'], queryFn: () => base44.entities.AmenityBooking.list('-created_date') });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.AmenityBooking.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['amenity-bookings'] }),
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.AmenityBooking.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['amenity-bookings'] }),
  });

  const byType = {};
  bookings.forEach(b => { byType[b.amenity_type] = (byType[b.amenity_type] || 0) + 1; });
  const revenue = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.price || 0), 0);

  const stats = { pending: 0, confirmed: 0, completed: 0 };
  bookings.forEach(b => { if (stats[b.status] !== undefined) stats[b.status]++; });

  const filtered = activeFilter === 'all' ? bookings : bookings.filter(b => b.status === activeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-semibold text-lg">Spa & Amenity Bookings</h3>
        <p className="text-white/40 text-sm">{bookings.length} bookings · KES {revenue.toLocaleString()} earned</p>
      </div>

      {/* Stat tabs */}
      <div className="grid grid-cols-3 gap-3">
        {[['pending','Pending','text-amber-400'],['confirmed','Confirmed','text-emerald-400'],['completed','Completed','text-blue-400']].map(([k,l,c]) => (
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

      {/* Bookings List */}
      <div className="space-y-3">
        {filtered.map(b => {
          const cfg = AMENITY_CONFIG[b.amenity_type] || AMENITY_CONFIG.other;
          return (
            <div key={b.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl mt-0.5">{cfg.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-medium">{b.guest_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                    </div>
                    <div className="text-white/40 text-sm">{cfg.label} · {b.booking_date} at {b.booking_time || 'TBD'}</div>
                    <div className="text-white/30 text-xs mt-0.5">
                      {b.duration_minutes}min · {b.num_people} person{b.num_people > 1 ? 's' : ''}
                      {b.room_number ? ` · Room ${b.room_number}` : ''}
                    </div>
                    {b.price > 0 && <div className="text-[#c9a962] text-sm font-medium mt-1">KES {b.price.toLocaleString()}</div>}
                    {b.special_requests && <div className="text-white/30 text-xs italic mt-1">"{b.special_requests}"</div>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <select value={b.status} onChange={e => updateStatus.mutate({ id: b.id, status: e.target.value })}
                    className="bg-[#111] border border-white/10 rounded-lg px-2 py-1 text-xs text-white/60">
                    {['pending','confirmed','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => del.mutate(b.id)} className="text-center text-xs text-red-400/50 hover:text-red-400">delete</button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30"><Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No {activeFilter} bookings</p></div>
        )}
      </div>
    </div>
  );
}