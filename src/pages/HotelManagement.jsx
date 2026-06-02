import React, { useState, Suspense, lazy } from 'react';
import { BedDouble, Calendar, LogIn, Sparkles, Users, Coffee, ShoppingBag, Settings } from 'lucide-react';

const RoomStatusBoard = lazy(() => import('@/components/hotel-mgmt/RoomStatusBoard'));
const BookingCalendar = lazy(() => import('@/components/hotel-mgmt/BookingCalendar'));
const CheckInOut = lazy(() => import('@/components/hotel-mgmt/CheckInOut'));
const HousekeepingBoard = lazy(() => import('@/components/hotel-mgmt/HousekeepingBoard'));
const GuestCRM = lazy(() => import('@/components/hotel-mgmt/GuestCRM'));
const MinibarManager = lazy(() => import('@/components/hotel-mgmt/MinibarManager'));
const RoomServiceOrders = lazy(() => import('@/components/hotel-mgmt/RoomServiceOrders'));
const RoomManager = lazy(() => import('@/components/hotel-mgmt/RoomManager'));

const TABS = [
  { id: 'rooms',       label: 'Room Board',    icon: BedDouble },
  { id: 'manage',      label: 'Manage Rooms',  icon: Settings },
  { id: 'bookings',    label: 'Bookings',      icon: Calendar },
  { id: 'checkin',     label: 'Check-In/Out',  icon: LogIn },
  { id: 'housekeeping',label: 'Housekeeping',  icon: Sparkles },
  { id: 'guests',      label: 'Guest CRM',     icon: Users },
  { id: 'minibar',     label: 'Minibar',       icon: Coffee },
  { id: 'roomservice', label: 'Room Service',  icon: ShoppingBag },
];

const Loader = () => (
  <div className="flex justify-center py-16">
    <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
  </div>
);

export default function HotelManagement() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [minibarRoom, setMinibarRoom] = useState(null);

  const handleOpenMinibar = (room) => {
    setMinibarRoom(room);
    setActiveTab('minibar');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
              <BedDouble className="w-5 h-5 text-[#c9a962]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Hotel Management</h1>
              <p className="text-white/40 text-sm">Full property operations — rooms, guests, housekeeping & more</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 flex-wrap mb-8">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#c9a962]/20 border-[#c9a962]/40 text-[#c9a962]'
                    : 'bg-[#1a1a1a] border-white/10 text-white/50 hover:text-white hover:border-white/20'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-[#111] rounded-2xl border border-white/10 p-6 min-h-[500px]">
          <Suspense fallback={<Loader />}>
            {activeTab === 'rooms'        && <RoomStatusBoard onOpenMinibar={handleOpenMinibar} />}
            {activeTab === 'manage'       && <RoomManager />}
            {activeTab === 'bookings'     && <BookingCalendar />}
            {activeTab === 'checkin'      && <CheckInOut />}
            {activeTab === 'housekeeping' && <HousekeepingBoard />}
            {activeTab === 'guests'       && <GuestCRM />}
            {activeTab === 'minibar'      && <MinibarManager preSelectedRoom={minibarRoom} />}
            {activeTab === 'roomservice'  && <RoomServiceOrders />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}