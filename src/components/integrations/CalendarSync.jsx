import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, MapPin, Users, CheckCircle, AlertCircle } from 'lucide-react';

const EVENT_TYPES = [
  { type: 'reservation', emoji: '🍽️', label: 'Table Reservation', color: 'text-[#c9a962] bg-[#c9a962]/10 border-[#c9a962]/20' },
  { type: 'room', emoji: '🛏️', label: 'Room Booking', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { type: 'event', emoji: '🎉', label: 'Event/Function', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { type: 'meeting', emoji: '💼', label: 'Conference/Meeting', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  { type: 'spa', emoji: '💆', label: 'Spa Appointment', color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
];

const MOCK_CALENDAR = [
  { id: 1, title: 'Table for 4 - John Doe', type: 'reservation', date: '2026-06-04', time: '19:00', guests: 4, synced: true, location: 'Main Dining Hall' },
  { id: 2, title: 'Wedding Reception - Smith Family', type: 'event', date: '2026-06-07', time: '16:00', guests: 120, synced: true, location: 'Grand Ballroom' },
  { id: 3, title: 'Room 204 - Mary Johnson', type: 'room', date: '2026-06-05', time: '14:00', guests: 2, synced: false, location: 'Room 204, Deluxe' },
  { id: 4, title: 'Corporate Meeting - Safaricom', type: 'meeting', date: '2026-06-06', time: '09:00', guests: 20, synced: true, location: 'Conference Room A' },
  { id: 5, title: 'Spa - Deep Tissue Massage', type: 'spa', date: '2026-06-04', time: '11:00', guests: 1, synced: false, location: 'Spa Suite 2' },
];

export default function CalendarSync() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeView, setActiveView] = useState('upcoming');

  const { data: reservations = [] } = useQuery({ queryKey: ['reservations-cal'], queryFn: () => base44.entities.Reservation.list('-created_date', 20) });
  const { data: events = [] } = useQuery({ queryKey: ['events-cal'], queryFn: () => base44.entities.EventBooking.list('-created_date', 20) });

  const allEvents = [
    ...MOCK_CALENDAR,
    ...reservations.map(r => ({ id: r.id, title: `${r.customer_name} - Table`, type: 'reservation', date: r.date || new Date().toISOString().split('T')[0], time: r.time || '12:00', guests: r.guests || 1, synced: false, location: 'Restaurant' })),
    ...events.map(e => ({ id: e.id, title: `${e.event_type} - ${e.organizer_name}`, type: 'event', date: e.event_date || new Date().toISOString().split('T')[0], time: e.start_time || '10:00', guests: e.guest_count || 1, synced: false, location: e.venue || 'Venue TBD' })),
  ];

  const filtered = allEvents.filter(e => typeFilter === 'all' || e.type === typeFilter);
  const synced = allEvents.filter(e => e.synced).length;
  const unsynced = allEvents.filter(e => !e.synced).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📅</span>
          <div>
            <h3 className="font-inter text-white font-semibold text-lg">Google Calendar Sync</h3>
            <p className="text-white/40 font-inter text-xs">Reservations, events & room bookings synced</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="font-inter text-xs text-yellow-400">Google OAuth required — connect in settings</span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: allEvents.length, color: 'text-white' },
          { label: 'Synced to Google', value: synced, color: 'text-green-400' },
          { label: 'Pending Sync', value: unsynced, color: 'text-yellow-400' },
          { label: 'Conflicts', value: 0, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <p className={`font-inter text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-white/40 font-inter text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Connect Banner */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className="font-inter text-sm font-semibold text-white mb-1">Connect Google Calendar</h4>
            <p className="text-white/40 font-inter text-xs">Authorize access to sync reservations, room bookings and events automatically.</p>
            <div className="flex flex-wrap gap-3 mt-3">
              {['Reservations → Google Events', 'Room blocks auto-created', 'Event reminders synced', 'Cancellations auto-removed'].map((f, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="font-inter text-xs text-white/60">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="px-5 py-2.5 bg-[#4285f4] text-white rounded-lg font-inter text-sm font-semibold hover:bg-[#4285f4]/90 flex items-center gap-2">
            <span>🔗</span> Connect Google
          </button>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTypeFilter('all')} className={`px-3 py-1.5 rounded-lg font-inter text-xs transition-all ${typeFilter === 'all' ? 'bg-[#c9a962] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>All</button>
        {EVENT_TYPES.map(t => (
          <button key={t.type} onClick={() => setTypeFilter(t.type)}
            className={`px-3 py-1.5 rounded-lg font-inter text-xs transition-all ${typeFilter === t.type ? 'bg-[#c9a962] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Calendar Events */}
      <div className="space-y-3">
        {filtered.map(event => {
          const typeInfo = EVENT_TYPES.find(t => t.type === event.type);
          return (
            <div key={event.id} className={`bg-[#1a1a1a] border rounded-xl p-4 hover:border-opacity-50 transition-all ${event.synced ? 'border-green-400/20' : 'border-[#c9a962]/10'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{typeInfo?.emoji}</span>
                  <div>
                    <p className="font-inter text-sm font-semibold text-white">{event.title}</p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-white/30" /><span className="font-inter text-xs text-white/50">{event.date}</span></div>
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-white/30" /><span className="font-inter text-xs text-white/50">{event.time}</span></div>
                      <div className="flex items-center gap-1"><Users className="w-3 h-3 text-white/30" /><span className="font-inter text-xs text-white/50">{event.guests} guests</span></div>
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-white/30" /><span className="font-inter text-xs text-white/50">{event.location}</span></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-inter text-xs px-2 py-1 rounded-full border capitalize ${typeInfo?.color}`}>{typeInfo?.label}</span>
                  {event.synced
                    ? <span className="flex items-center gap-1 font-inter text-xs text-green-400"><CheckCircle className="w-3 h-3" />Synced</span>
                    : <button className="px-2 py-1 bg-[#4285f4]/10 text-[#4285f4] border border-[#4285f4]/20 rounded-lg font-inter text-xs hover:bg-[#4285f4]/20">Sync →</button>
                  }
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="py-10 text-center text-white/30 font-inter text-sm">No events found for this filter.</div>}
      </div>
    </div>
  );
}