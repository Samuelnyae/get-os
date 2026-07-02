import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BedDouble, CheckCircle, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoomCard from '@/components/rooms/RoomCard';

function generateCode() {
  return 'BK' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function BookingModal({ room, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    guest_name: '', guest_email: '', guest_phone: '',
    check_in_date: '', check_out_date: '',
    num_guests: 1, special_requests: '', payment_method: 'mpesa',
  });
  const [success, setSuccess] = useState(null);

  const nights = form.check_in_date && form.check_out_date
    ? Math.max(1, Math.ceil((new Date(form.check_out_date) - new Date(form.check_in_date)) / 86400000))
    : 0;
  const total = nights * (room.price_per_night || 0);

  const book = useMutation({
    mutationFn: async () => {
      const code = generateCode();
      const booking = await base44.entities.RoomBooking.create({
        ...form, room_id: room.id, room_number: room.room_number,
        total_amount: total, status: 'confirmed', confirmation_code: code,
      });
      await base44.entities.Room.update(room.id, { status: 'reserved' });
      return { booking, code };
    },
    onSuccess: ({ code }) => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['room-bookings'] });
      setSuccess(code);
    },
  });

  const valid = form.guest_name && form.guest_email && form.check_in_date && form.check_out_date && nights > 0;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/30 p-8 max-w-sm w-full text-center">
          <CheckCircle className="w-16 h-16 text-[#c9a962] mx-auto mb-4" />
          <h3 className="text-white font-bold text-xl mb-2">Booking Confirmed!</h3>
          <p className="text-white/50 mb-4">Your room has been reserved successfully.</p>
          <div className="bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl p-4 mb-4">
            <div className="text-[#c9a962] text-xs mb-1">Confirmation Code</div>
            <div className="text-white font-bold text-2xl tracking-widest">{success}</div>
          </div>
          <div className="text-white/40 text-sm space-y-1 mb-6">
            <div>Room #{room.room_number} · {room.room_type}</div>
            <div>{form.check_in_date} → {form.check_out_date}</div>
            <div className="text-[#c9a962]">Total: KES {total.toLocaleString()}</div>
          </div>
          <Button onClick={onClose} className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">Done</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-semibold text-lg">Book Room #{room.room_number}</h3>
            <p className="text-white/40 text-sm capitalize">{room.room_type} · KES {(room.price_per_night||0).toLocaleString()}/night</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-white/50" /></button>
        </div>

        <div className="space-y-4">
          {[['guest_name','Full Name','text'],['guest_email','Email Address','email'],['guest_phone','Phone Number','tel']].map(([k,l,t]) => (
            <div key={k}>
              <label className="text-white/60 text-xs mb-1 block">{l}</label>
              <Input type={t} value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))}
                className="bg-[#111] border-white/10 text-white" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-xs mb-1 block">Check-In Date</label>
              <Input type="date" value={form.check_in_date} min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f=>({...f,check_in_date:e.target.value}))}
                className="bg-[#111] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Check-Out Date</label>
              <Input type="date" value={form.check_out_date} min={form.check_in_date || new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f=>({...f,check_out_date:e.target.value}))}
                className="bg-[#111] border-white/10 text-white" />
            </div>
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Number of Guests</label>
            <Input type="number" min={1} max={room.capacity} value={form.num_guests}
              onChange={e => setForm(f=>({...f,num_guests:Number(e.target.value)}))}
              className="bg-[#111] border-white/10 text-white" />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Payment Method</label>
            <select value={form.payment_method} onChange={e => setForm(f=>({...f,payment_method:e.target.value}))}
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="cash">Cash at Reception</option>
            </select>
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Special Requests</label>
            <textarea value={form.special_requests} onChange={e => setForm(f=>({...f,special_requests:e.target.value}))}
              rows={2} placeholder="e.g. early check-in, extra pillows..."
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
          </div>

          {nights > 0 && (
            <div className="bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">KES {(room.price_per_night||0).toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}</span>
                <span className="text-white">KES {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-[#c9a962]">Total</span>
                <span className="text-[#c9a962]">KES {total.toLocaleString()}</span>
              </div>
            </div>
          )}

          <Button onClick={() => book.mutate()} disabled={!valid || book.isPending}
            className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black font-medium py-3">
            {book.isPending ? 'Confirming...' : 'Confirm Booking'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Rooms() {
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortPrice, setSortPrice] = useState('low');
  const [bookingRoom, setBookingRoom] = useState(null);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const filtered = rooms.filter(r => {
    if (filterType !== 'all' && r.room_type !== filterType) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => {
    if (sortPrice === 'low') return (a.price_per_night || 0) - (b.price_per_night || 0);
    return (b.price_per_night || 0) - (a.price_per_night || 0);
  });

  const available = rooms.filter(r => r.status === 'available').length;

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Hero */}
      <div className="relative h-[280px] sm:h-[340px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0d0d0d]" />
        </div>
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <p className="text-[#c9a962] text-xs sm:text-sm tracking-[0.3em] uppercase font-inter mb-3">GET OS — HOSPITALITY</p>
          <h1 className="font-playfair text-4xl sm:text-5xl text-white mb-2">Our Rooms</h1>
          <p className="text-white/50 font-inter text-sm">{available} rooms available for booking</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="sticky top-20 z-30 bg-[#0d0d0d]/95 backdrop-blur-md border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-[#c9a962] flex-shrink-0" />

          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-[#c9a962]/30 cursor-pointer">
            <option value="all">All Types</option>
            <option value="standard">Standard</option>
            <option value="deluxe">Deluxe</option>
            <option value="suite">Suite</option>
            <option value="family">Family</option>
            <option value="penthouse">Penthouse</option>
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-[#c9a962]/30 cursor-pointer">
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="cleaning">Housekeeping</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <select value={sortPrice} onChange={e => setSortPrice(e.target.value)}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-[#c9a962]/30 cursor-pointer">
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
          </select>

          <span className="ml-auto text-white/40 text-sm font-inter">{filtered.length} rooms</span>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {filtered.map(room => (
                <RoomCard key={room.id} room={room} onBook={setBookingRoom} />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-20 text-white/30">
                <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No rooms match your filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {bookingRoom && (
        <BookingModal room={bookingRoom} onClose={() => setBookingRoom(null)} />
      )}
    </div>
  );
}