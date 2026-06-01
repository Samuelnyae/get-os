import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Plus, X, Calendar } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, parseISO } from 'date-fns';

function generateCode() {
  return 'BK' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function BookingCalendar() {
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [form, setForm] = useState({
    guest_name: '', guest_email: '', guest_phone: '',
    check_in_date: '', check_out_date: '', num_guests: 1,
    special_requests: '', payment_method: 'cash',
  });

  const { data: bookings = [] } = useQuery({ queryKey: ['room-bookings'], queryFn: () => base44.entities.RoomBooking.list() });
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => base44.entities.Room.list() });

  const createBooking = useMutation({
    mutationFn: async (data) => {
      const room = rooms.find(r => r.id === selectedRoom);
      const nights = Math.ceil((new Date(data.check_out_date) - new Date(data.check_in_date)) / 86400000);
      const total = (room?.price_per_night || 0) * nights;
      const booking = await base44.entities.RoomBooking.create({
        ...data, room_id: selectedRoom,
        room_number: room?.room_number,
        total_amount: total, status: 'confirmed',
        confirmation_code: generateCode(),
      });
      await base44.entities.Room.update(selectedRoom, { status: 'reserved', current_booking_id: booking.id });
      return booking;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['room-bookings'] }); qc.invalidateQueries({ queryKey: ['rooms'] }); setShowForm(false); },
  });

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  const getBookingsForDay = (day) => bookings.filter(b => {
    if (!b.check_in_date || !b.check_out_date) return false;
    return isWithinInterval(day, { start: parseISO(b.check_in_date), end: parseISO(b.check_out_date) });
  });

  const startDay = startOfMonth(currentMonth).getDay();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:border-[#c9a962]/30 text-white/70">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-white font-semibold text-lg w-44 text-center">{format(currentMonth, 'MMMM yyyy')}</h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:border-[#c9a962]/30 text-white/70">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> New Booking
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/10">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="py-3 text-center text-xs text-white/40 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className="h-24 border-b border-r border-white/5" />)}
          {days.map(day => {
            const dayBookings = getBookingsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={`h-24 border-b border-r border-white/5 p-1.5 ${isToday ? 'bg-[#c9a962]/5' : ''}`}>
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#c9a962] text-black' : 'text-white/60'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {dayBookings.slice(0, 2).map(b => (
                    <div key={b.id} className="text-[10px] bg-blue-500/20 text-blue-300 rounded px-1 truncate">{b.guest_name}</div>
                  ))}
                  {dayBookings.length > 2 && <div className="text-[10px] text-white/30">+{dayBookings.length - 2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Bookings List */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
        <h4 className="text-white font-medium mb-3">All Bookings ({bookings.length})</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {bookings.slice().sort((a,b) => new Date(b.created_date) - new Date(a.created_date)).map(b => (
            <div key={b.id} className="flex items-center justify-between p-3 bg-[#111] rounded-lg">
              <div>
                <div className="text-white text-sm font-medium">{b.guest_name}</div>
                <div className="text-white/40 text-xs">Room #{b.room_number} · {b.check_in_date} → {b.check_out_date}</div>
              </div>
              <div className="text-right">
                <div className="text-[#c9a962] text-sm">KES {(b.total_amount||0).toLocaleString()}</div>
                <div className="text-xs text-white/40">{b.confirmation_code}</div>
              </div>
            </div>
          ))}
          {bookings.length === 0 && <div className="text-white/30 text-sm text-center py-4">No bookings yet</div>}
        </div>
      </div>

      {/* New Booking Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">New Room Booking</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-1 block">Room</label>
                <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Select a room</option>
                  {rooms.filter(r => r.status === 'available').map(r => (
                    <option key={r.id} value={r.id}>#{r.room_number} — {r.room_type} (KES {(r.price_per_night||0).toLocaleString()}/night)</option>
                  ))}
                </select>
              </div>
              {[
                ['guest_name', 'Guest Name', 'text'],
                ['guest_email', 'Email', 'email'],
                ['guest_phone', 'Phone', 'tel'],
                ['check_in_date', 'Check-In Date', 'date'],
                ['check_out_date', 'Check-Out Date', 'date'],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="text-white/60 text-xs mb-1 block">{label}</label>
                  <Input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="bg-[#111] border-white/10 text-white" />
                </div>
              ))}
              <div>
                <label className="text-white/60 text-xs mb-1 block">Payment Method</label>
                <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Special Requests</label>
                <textarea value={form.special_requests} onChange={e => setForm(f => ({ ...f, special_requests: e.target.value }))}
                  rows={2} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              </div>
              {selectedRoom && form.check_in_date && form.check_out_date && (
                <div className="bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-lg p-3 text-sm">
                  <div className="text-[#c9a962] font-medium">
                    Total: KES {((rooms.find(r=>r.id===selectedRoom)?.price_per_night||0) *
                      Math.max(1, Math.ceil((new Date(form.check_out_date)-new Date(form.check_in_date))/86400000))).toLocaleString()}
                  </div>
                  <div className="text-white/40 text-xs mt-1">
                    {Math.max(1, Math.ceil((new Date(form.check_out_date)-new Date(form.check_in_date))/86400000))} night(s)
                  </div>
                </div>
              )}
              <Button onClick={() => createBooking.mutate(form)} disabled={!selectedRoom || !form.guest_name || !form.check_in_date}
                className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">
                Confirm Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}