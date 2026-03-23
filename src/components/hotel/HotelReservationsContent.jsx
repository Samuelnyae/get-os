import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import LuxuryButton from '@/components/common/LuxuryButton';
import SectionHeader from '@/components/common/SectionHeader';
import { toast } from 'sonner';

const TIME_SLOTS = ['12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];

export default function HotelReservationsContent({ hotel }) {
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', party_size: 2, reservation_date: '', reservation_time: '', special_requests: '' });
  const [submitted, setSubmitted] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  const createReservation = useMutation({
    mutationFn: (data) => base44.entities.Reservation.create(data),
    onSuccess: (res) => {
      setConfirmationCode(res.confirmation_code || `RES-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
      setSubmitted(true);
      toast.success('Reservation confirmed!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_email || !form.customer_phone || !form.reservation_date || !form.reservation_time) {
      toast.error('Please fill in all required fields');
      return;
    }
    const code = `RES-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    createReservation.mutate({ ...form, party_size: Number(form.party_size), confirmation_code: code, status: 'pending' });
    setConfirmationCode(code);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <SectionHeader title="Reserve a Table" subtitle={hotel?.name || 'Book Your Experience'} />

        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#1a1a1a] rounded-2xl p-10 border border-[#c9a962]/20 text-center">
            <div className="w-20 h-20 rounded-full bg-[#c9a962]/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#c9a962]" />
            </div>
            <h3 className="font-playfair text-3xl text-white mb-2">Reservation Confirmed!</h3>
            <p className="font-inter text-white/60 mb-4">Your table has been reserved.</p>
            <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6 border border-[#c9a962]/20">
              <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">Confirmation Code</p>
              <p className="font-playfair text-3xl text-white font-mono">{confirmationCode}</p>
            </div>
            <p className="font-inter text-sm text-white/50 mb-6">
              {form.reservation_date} at {form.reservation_time} · Party of {form.party_size}
            </p>
            <LuxuryButton onClick={() => { setSubmitted(false); setForm({ customer_name: '', customer_email: '', customer_phone: '', party_size: 2, reservation_date: '', reservation_time: '', special_requests: '' }); }}>
              Make Another Reservation
            </LuxuryButton>
          </motion.div>
        ) : (
          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/20 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Full Name *</label>
                <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Your name" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
              </div>
              <div>
                <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Email *</label>
                <Input type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} placeholder="your@email.com" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
              </div>
              <div>
                <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Phone *</label>
                <Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder="+254 ..." className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
              </div>
              <div>
                <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Party Size *</label>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-[#c9a962]" />
                  <Input type="number" min={1} max={20} value={form.party_size} onChange={e => setForm(f => ({ ...f, party_size: e.target.value }))} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
                </div>
              </div>
              <div>
                <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Date *</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#c9a962]" />
                  <Input type="date" value={form.reservation_date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, reservation_date: e.target.value }))} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
                </div>
              </div>
              <div>
                <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Time *</label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#c9a962]" />
                  <select value={form.reservation_time} onChange={e => setForm(f => ({ ...f, reservation_time: e.target.value }))} className="flex-1 bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-md px-3 py-2 text-sm">
                    <option value="">Select time</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Special Requests</label>
              <textarea value={form.special_requests} onChange={e => setForm(f => ({ ...f, special_requests: e.target.value }))} placeholder="Dietary requirements, special occasions..." rows={3} className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 rounded-lg px-3 py-2 font-inter text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a962]/50 resize-none" />
            </div>
            <LuxuryButton type="submit" disabled={createReservation.isPending} className="w-full">
              {createReservation.isPending ? 'Confirming...' : 'Confirm Reservation'}
            </LuxuryButton>
          </motion.form>
        )}
      </div>
    </div>
  );
}