import React, { useState, Suspense, lazy } from 'react';
import { Megaphone, Mail, MessageSquare, Tag, Share2, Star, Users } from 'lucide-react';

const EmailCampaignBuilder = lazy(() => import('@/components/marketing/EmailCampaignBuilder'));
const BulkMessaging        = lazy(() => import('@/components/marketing/BulkMessaging'));
const CouponManager        = lazy(() => import('@/components/marketing/CouponManager'));
const SocialScheduler      = lazy(() => import('@/components/marketing/SocialScheduler'));
const ReviewManager        = lazy(() => import('@/components/marketing/ReviewManager'));
const ReferralTracker      = lazy(() => import('@/components/marketing/ReferralTracker'));

const TABS = [
  { id: 'email',    label: 'Email Campaigns',  icon: Mail },
  { id: 'sms',      label: 'SMS / WhatsApp',   icon: MessageSquare },
  { id: 'coupons',  label: 'Discounts & Coupons', icon: Tag },
  { id: 'social',   label: 'Social Scheduler', icon: Share2 },
  { id: 'reviews',  label: 'Review Manager',   icon: Star },
  { id: 'referrals',label: 'Referral Program', icon: Users },
];

const Loader = () => (
  <div className="flex justify-center py-16">
    <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
  </div>
);

export default function Marketing() {
  const [activeTab, setActiveTab] = useState('email');

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-[#c9a962]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Marketing & CRM</h1>
              <p className="text-white/40 text-sm">Campaigns, coupons, social, reviews & referrals</p>
            </div>
          </div>
        </div>

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

        <div className="bg-[#111] rounded-2xl border border-white/10 p-6 min-h-[500px]">
          <Suspense fallback={<Loader />}>
            {activeTab === 'email'    && <EmailCampaignBuilder />}
            {activeTab === 'sms'      && <BulkMessaging />}
            {activeTab === 'coupons'  && <CouponManager />}
            {activeTab === 'social'   && <SocialScheduler />}
            {activeTab === 'reviews'  && <ReviewManager />}
            {activeTab === 'referrals'&& <ReferralTracker />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}