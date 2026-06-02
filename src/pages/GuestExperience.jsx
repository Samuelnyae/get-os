import React, { useState, Suspense, lazy } from 'react';
import { Heart, Award, Gift, TrendingUp, Globe, CalendarDays, Sparkles } from 'lucide-react';

const LoyaltyProgram      = lazy(() => import('@/components/guest/LoyaltyProgram'));
const AutoCampaigns       = lazy(() => import('@/components/guest/AutoCampaigns'));
const NPSTracker          = lazy(() => import('@/components/guest/NPSTracker'));
const GuestPortal         = lazy(() => import('@/components/guest/GuestPortal'));
const EventBookingManager = lazy(() => import('@/components/guest/EventBookingManager'));
const AmenityBookingManager = lazy(() => import('@/components/guest/AmenityBookingManager'));

const TABS = [
  { id: 'loyalty',   label: 'Loyalty & Rewards',  icon: Award },
  { id: 'campaigns', label: 'Auto Campaigns',      icon: Gift },
  { id: 'nps',       label: 'NPS Tracker',         icon: TrendingUp },
  { id: 'portal',    label: 'Guest Portal',        icon: Globe },
  { id: 'events',    label: 'Event Bookings',      icon: CalendarDays },
  { id: 'amenities', label: 'Spa & Amenities',     icon: Sparkles },
];

const Loader = () => (
  <div className="flex justify-center py-16">
    <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
  </div>
);

export default function GuestExperience() {
  const [activeTab, setActiveTab] = useState('loyalty');

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#c9a962]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Guest Experience</h1>
              <p className="text-white/40 text-sm">Loyalty, campaigns, NPS, portal, events & amenities</p>
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
            {activeTab === 'loyalty'   && <LoyaltyProgram />}
            {activeTab === 'campaigns' && <AutoCampaigns />}
            {activeTab === 'nps'       && <NPSTracker />}
            {activeTab === 'portal'    && <GuestPortal />}
            {activeTab === 'events'    && <EventBookingManager />}
            {activeTab === 'amenities' && <AmenityBookingManager />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}