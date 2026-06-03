import React, { Suspense, lazy } from 'react';
import { CalendarDays } from 'lucide-react';

const EventBookingManager = lazy(() => import('@/components/guest/EventBookingManager'));

export default function Events() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-[#c9a962]" />
            </div>
            <div>
              <h1 className="font-playfair text-3xl text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Event Bookings</h1>
              <p className="text-white/40 text-sm">Weddings, conferences, galas & private events</p>
            </div>
          </div>
        </div>
        <div className="bg-[#111] rounded-2xl border border-white/10 p-6">
          <Suspense fallback={
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
            </div>
          }>
            <EventBookingManager />
          </Suspense>
        </div>
      </div>
    </div>
  );
}