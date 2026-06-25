import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

const EVENT_TYPES = {
  wedding:      { label: 'Wedding',      icon: '💍' },
  conference:   { label: 'Conference',   icon: '🎤' },
  birthday_party:{ label: 'Birthday Party',icon: '🎂' },
  corporate:    { label: 'Corporate',    icon: '🏢' },
  gala:         { label: 'Gala',         icon: '✨' },
  workshop:     { label: 'Workshop',     icon: '🛠️' },
  other:        { label: 'Other',        icon: '📋' },
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
  const [form, setForm] = useState(EMPTY);

  const save = useMutation({
    mutationFn: () => base44.entities.EventBooking.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setShowForm(false); setForm(EMPTY); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Event Bookings</h3>
          <p className="text-white/40 text-sm">Weddings, conferences, celebrations</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> Event Bookings
        </Button>
      </div>

      <div className="text-center py-10 text-white/40">
        <p className="text-sm">Click <span className="text-[#c9a962]">Event Bookings</span> to submit a new event inquiry.</p>
        <p className="text-xs text-white/30 mt-1">Our team will review your request and send a quote.</p>
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