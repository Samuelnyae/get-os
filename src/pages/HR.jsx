import React, { useState, Suspense, lazy } from 'react';
import { Users, Clock, Calendar, Star, BookOpen, Megaphone } from 'lucide-react';

const AttendanceTracker = lazy(() => import('@/components/hr/AttendanceTracker'));
const ShiftCalendar     = lazy(() => import('@/components/hr/ShiftCalendar'));
const PerformanceReviews= lazy(() => import('@/components/hr/PerformanceReviews'));
const TrainingTracker   = lazy(() => import('@/components/hr/TrainingTracker'));
const NoticeBoard       = lazy(() => import('@/components/hr/NoticeBoard'));

const TABS = [
  { id: 'attendance',   label: 'Attendance',    icon: Clock },
  { id: 'shifts',       label: 'Shifts & Leave', icon: Calendar },
  { id: 'performance',  label: 'Performance',    icon: Star },
  { id: 'training',     label: 'Training',       icon: BookOpen },
  { id: 'noticeboard',  label: 'Notice Board',   icon: Megaphone },
];

const Loader = () => (
  <div className="flex justify-center py-16">
    <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
  </div>
);

export default function HR() {
  const [activeTab, setActiveTab] = useState('attendance');

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#c9a962]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">HR & Workforce</h1>
              <p className="text-white/40 text-sm">Attendance, shifts, performance, training & announcements</p>
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
            {activeTab === 'attendance'  && <AttendanceTracker />}
            {activeTab === 'shifts'      && <ShiftCalendar />}
            {activeTab === 'performance' && <PerformanceReviews />}
            {activeTab === 'training'    && <TrainingTracker />}
            {activeTab === 'noticeboard' && <NoticeBoard />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}