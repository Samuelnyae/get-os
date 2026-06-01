import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, LogOut, Search, CheckCircle, AlertCircle, User } from 'lucide-react';
import { format } from 'date-fns';

export default function CheckInOut() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('checkin');

  const { data: bookings = [] } = useQuery({ queryKey: ['room-bookings'], queryFn: () => base44.entities.RoomBooking.list() });
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => base44.entities.Room.list() });

  const checkIn = useMutation({
    mutationFn: async (booking) => {
      await base44.entities.RoomBooking.update(booking.id, { status: 'checked_in', actual_check_in: new Date().toISOString() });
      await base44.entities.Room.update(booking.room_id, { status: 'occupied' });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['room-bookings'] }); qc.invalidateQueries({ queryKey: ['rooms'] }); },
  });

  const checkOut = useMutation({
    mutationFn: async (booking) => {
      await base44.entities.RoomBooking.update(booking.id, { status: 'checked_out', actual_check_out: new Date().toISOString() });
      await base44.entities.Room.update(booking.room_id, { status: 'cleaning' });
      // Create housekeeping task
      await base44.entities.HousekeepingTask.create({
        room_id: booking.room_id, room_number: booking.room_number,
        task_type: 'cleaning', priority: 'urgent', status: 'pending',
        scheduled_date: format(new Date(), 'yyyy-MM-dd'), notes: `Post checkout for ${booking.guest_name}`,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['room-bookings'] }); qc.invalidateQueries({ queryKey: ['rooms'] }); },
  });

  const pendingCheckIn = bookings.filter(b => b.status === 'confirmed' &&
    (!search || b.guest_name.toLowerCase().includes(search.toLowerCase()) || b.confirmation_code?.includes(search.toUpperCase())));
  const pendingCheckOut = bookings.filter(b => b.status === 'checked_in' &&
    (!search || b.guest_name.toLowerCase().includes(search.toLowerCase())));

  const list = tab === 'checkin' ? pendingCheckIn : pendingCheckOut;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {[['checkin', 'Check-In', 'emerald'], ['checkout', 'Check-Out', 'amber']].map(([t, label, color]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${tab === t
              ? `bg-[#1a1a1a] border-[#c9a962]/40 text-[#c9a962]`
              : 'bg-[#1a1a1a] border-white/10 text-white/50 hover:text-white'}`}>
            {t === 'checkin' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t ? `bg-${color}-500/30` : 'bg-white/10'}`}>
              {t === 'checkin' ? pendingCheckIn.length : pendingCheckOut.length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or confirmation code..."
          className="pl-10 bg-[#111] border-white/10 text-white" />
      </div>

      {/* List */}
      <div className="space-y-3">
        {list.map(booking => {
          const room = rooms.find(r => r.id === booking.room_id);
          return (
            <div key={booking.id} className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-[#c9a962]" />
                  <span className="text-white font-medium">{booking.guest_name}</span>
                  {booking.confirmation_code && (
                    <span className="text-xs bg-[#c9a962]/20 text-[#c9a962] px-2 py-0.5 rounded-full">{booking.confirmation_code}</span>
                  )}
                </div>
                <div className="text-white/40 text-sm">Room #{booking.room_number} · {room?.room_type}</div>
                <div className="text-white/40 text-xs mt-1">{booking.check_in_date} → {booking.check_out_date}</div>
                {booking.actual_check_in && (
                  <div className="text-emerald-400 text-xs mt-1">Checked in: {format(new Date(booking.actual_check_in), 'dd MMM yyyy HH:mm')}</div>
                )}
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="text-[#c9a962] font-medium">KES {(booking.total_amount||0).toLocaleString()}</div>
                {tab === 'checkin' ? (
                  <Button onClick={() => checkIn.mutate(booking)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm">
                    <LogIn className="w-4 h-4 mr-1" /> Check In
                  </Button>
                ) : (
                  <Button onClick={() => checkOut.mutate(booking)}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-sm">
                    <LogOut className="w-4 h-4 mr-1" /> Check Out
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No {tab === 'checkin' ? 'pending check-ins' : 'guests to check out'}</p>
          </div>
        )}
      </div>
    </div>
  );
}