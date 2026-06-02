import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, X, Clock } from 'lucide-react';

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

const EMPTY = { amenity_type: 'spa', guest_name: '', guest_email: '', guest_phone: '', room_number: '', booking_date: '', booking_time: '', duration_minutes: 60, num_people: 1, special_requests: '', price: 3500 };

export default function AmenityBookingManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: bookings = [] } = useQuery({ queryKey: ['amenity-bookings'], queryFn: () => base44.entities.AmenityBooking.list('-created_date') });

  const setAmenity = (type) => setForm(f => ({ ...f, amenity_type: type, price: AMENITY_CONFIG[type]?.price || 0 }));

  const save = useMutation({
    mutationFn: () => base44.entities.AmenityBooking.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['amenity-bookings'] }); setShowForm(false); setForm(EMPTY); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.AmenityBooking.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['amenity-bookings'] }),
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.AmenityBooking.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['amenity-bookings'] }),
  });

  // Group by amenity type for stats
  const byType = {};
  bookings.forEach(b => { byType[b.amenity_type] = (byType[b.amenity_type] || 0) + 1; });
  const topAmenity = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];

  const revenue = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.price || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Spa & Amenity Bookings</h3>
          <p className="text-white/40 text-sm">{bookings.length} bookings · KES {revenue.toLocaleString()} earned</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> New Booking
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(AMENITY_CONFIG).slice(0, 4).map(([k, v]) => (
          <div key={k} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">{v.icon}</div>
            <div className="text-white font-bold">{byType[k] || 0}</div>
            <div className="text-white/40 text-xs">{v.label}</div>
          </div>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {bookings.map(b => {
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
        {bookings.length === 0 && (
          <div className="text-center py-12 text-white/30"><Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No amenity bookings yet</p></div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Book Amenity</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-2 block">Amenity</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {Object.entries(AMENITY_CONFIG).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setAmenity(k)}
                      className={`py-2 rounded-xl border text-center text-xs transition-all ${form.amenity_type === k ? 'border-[#c9a962]/40 bg-[#c9a962]/10 text-[#c9a962]' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                      <div className="text-lg mb-0.5">{v.icon}</div>
                      <div>{v.label}</div>
                      {v.price > 0 && <div className="text-[10px] opacity-60">KES {v.price.toLocaleString()}</div>}
                    </button>
                  ))}
                </div>
              </div>
              {[['guest_name','Guest Name','text'],['guest_email','Email','email'],['guest_phone','Phone','tel']].map(([k,l,t]) => (
                <div key={k}><label className="text-white/60 text-xs mb-1 block">{l}</label>
                  <Input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-white/60 text-xs mb-1 block">Room #</label>
                  <Input value={form.room_number} onChange={e=>setForm(f=>({...f,room_number:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">Date</label>
                  <Input type="date" value={form.booking_date} onChange={e=>setForm(f=>({...f,booking_date:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">Time</label>
                  <Input type="time" value={form.booking_time} onChange={e=>setForm(f=>({...f,booking_time:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-white/60 text-xs mb-1 block">Duration (min)</label>
                  <Input type="number" value={form.duration_minutes} onChange={e=>setForm(f=>({...f,duration_minutes:Number(e.target.value)}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">People</label>
                  <Input type="number" value={form.num_people} onChange={e=>setForm(f=>({...f,num_people:Number(e.target.value)}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">Price (KES)</label>
                  <Input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:Number(e.target.value)}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <div><label className="text-white/60 text-xs mb-1 block">Special Requests</label>
                <textarea value={form.special_requests} onChange={e=>setForm(f=>({...f,special_requests:e.target.value}))}
                  rows={2} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" /></div>
              <Button onClick={() => save.mutate()} disabled={!form.guest_name || !form.guest_email || !form.booking_date || save.isPending}
                className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">Confirm Booking</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}