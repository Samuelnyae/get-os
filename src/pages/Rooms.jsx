import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BedDouble, Users, Star, CheckCircle, X, Wifi, Tv, Coffee, Sparkles, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_ORDER = ['standard', 'deluxe', 'suite', 'family', 'penthouse'];

const TYPE_LABELS = {
  standard: 'Standard', deluxe: 'Deluxe', suite: 'Suite', family: 'Family', penthouse: 'Penthouse'
};

const AMENITY_ICONS = { WiFi: Wifi, TV: Tv, Minibar: Coffee };

function generateCode() {
  return 'BK' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function RoomCard({ room, onBook }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden hover:border-[#c9a962]/30 transition-all group"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-[#1a1a1a] to-[#111] overflow-hidden">
        {room.image_url ? (
          <img src={room.image_url} alt={room.room_number} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BedDouble className="w-16 h-16 text-[#c9a962]/20" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-[#c9a962] text-black text-xs font-bold px-2 py-1 rounded-full capitalize">
            {TYPE_LABELS[room.room_type] || room.room_type}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            room.status === 'available' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
          }`}>
            {room.status === 'available' ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-white font-semibold text-lg">Room #{room.room_number}</h3>
            <div className="flex items-center gap-1 text-white/40 text-sm mt-0.5">
              <Users className="w-3.5 h-3.5" />
              <span>Up to {room.capacity} guests</span>
              {room.floor && <span>· Floor {room.floor}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[#c9a962] font-bold text-xl">KES {(room.price_per_night || 0).toLocaleString()}</div>
            <div className="text-white/30 text-xs">per night</div>
          </div>
        </div>

        {room.description && (
          <p className="text-white/50 text-sm mb-3 line-clamp-2">{room.description}</p>
        )}

        {/* Amenities */}
        {room.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {room.amenities.slice(0, 5).map(a => (
              <span key={a} className="text-xs bg-white/5 text-white/50 px-2 py-1 rounded-full">{a}</span>
            ))}
            {room.amenities.length > 5 && (
              <span className="text-xs text-white/30">+{room.amenities.length - 5} more</span>
            )}
          </div>
        )}

        <Button
          onClick={() => onBook(room)}
          disabled={room.status !== 'available'}
          className={`w-full ${room.status === 'available' ? 'bg-[#c9a962] hover:bg-[#b8944f] text-black' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
        >
          {room.status === 'available' ? 'Book This Room' : 'Not Available'}
        </Button>
      </div>
    </motion.div>
  );
}

function BookingModal({ room, onClose, rooms }) {
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
  const [filterGuests, setFilterGuests] = useState('');
  const [search, setSearch] = useState('');
  const [bookingRoom, setBookingRoom] = useState(null);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const filtered = rooms.filter(r => {
    if (r.status === 'maintenance') return false;
    if (filterType !== 'all' && r.room_type !== filterType) return false;
    if (filterGuests && r.capacity < Number(filterGuests)) return false;
    if (search && !`${r.room_number} ${r.room_type} ${r.description || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => TYPE_ORDER.indexOf(a.room_type) - TYPE_ORDER.indexOf(b.room_type));

  const available = rooms.filter(r => r.status === 'available').length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-8 pb-20">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <p className="text-[#c9a962] text-sm tracking-[0.3em] uppercase font-inter mb-3">Luxury Accommodations</p>
          <h1 className="font-playfair text-4xl sm:text-5xl text-white mb-4">Our Rooms & Suites</h1>
          <p className="text-white/50 font-inter max-w-xl mx-auto">
            Experience unparalleled comfort in our thoughtfully designed rooms. {available} room{available !== 1 ? 's' : ''} available tonight.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c9a962]/40" />
          </div>
          <select value={filterGuests} onChange={e => setFilterGuests(e.target.value)}
            className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white/70 text-sm">
            <option value="">Any guests</option>
            <option value="1">1+ guests</option>
            <option value="2">2+ guests</option>
            <option value="4">4+ guests</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {['all', ...TYPE_ORDER].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-4 py-2 rounded-full border text-sm capitalize transition-all ${
                filterType === t
                  ? 'bg-[#c9a962]/20 border-[#c9a962]/50 text-[#c9a962]'
                  : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'
              }`}>
              {t === 'all' ? 'All Rooms' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Booking Modal */}
      {bookingRoom && (
        <BookingModal room={bookingRoom} onClose={() => setBookingRoom(null)} rooms={rooms} />
      )}
    </div>
  );
}