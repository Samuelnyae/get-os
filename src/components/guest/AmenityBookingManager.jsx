import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

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

const EMPTY = { amenity_type: 'spa', guest_name: '', guest_email: '', guest_phone: '', room_number: '', booking_date: '', booking_time: '', duration_minutes: 60, num_people: 1, special_requests: '', price: 3500 };

export default function AmenityBookingManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const setAmenity = (type) => setForm(f => ({ ...f, amenity_type: type, price: AMENITY_CONFIG[type]?.price || 0 }));

  const save = useMutation({
    mutationFn: () => base44.entities.AmenityBooking.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['amenity-bookings'] }); setShowForm(false); setForm(EMPTY); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Spa & Amenity Bookings</h3>
          <p className="text-white/40 text-sm">Book spa treatments, gym, pool & more</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> Spa & Amenities
        </Button>
      </div>

      <div className="text-center py-10 text-white/40">
        <p className="text-sm">Click <span className="text-[#c9a962]">Spa & Amenities</span> to book a treatment or facility.</p>
        <p className="text-xs text-white/30 mt-1">Our team will confirm your booking shortly.</p>
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