import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const IntegrationHub = React.lazy(() => import('@/components/integrations/IntegrationHub'));
const WhatsAppDashboard = React.lazy(() => import('@/components/integrations/WhatsAppDashboard'));
const MpesaDashboard = React.lazy(() => import('@/components/integrations/MpesaDashboard'));
const SMSCenter = React.lazy(() => import('@/components/integrations/SMSCenter'));
const MarketplaceHub = React.lazy(() => import('@/components/integrations/MarketplaceHub'));
const AccountingSync = React.lazy(() => import('@/components/integrations/AccountingSync'));
const CalendarSync = React.lazy(() => import('@/components/integrations/CalendarSync'));
const APIKeyManager = React.lazy(() => import('@/components/integrations/APIKeyManager'));

const VIEWS = {
  hub: { label: 'All Integrations', component: null },
  whatsapp: { label: 'WhatsApp Business', component: WhatsAppDashboard },
  mpesa: { label: 'M-Pesa Daraja', component: MpesaDashboard },
  twilio: { label: 'Twilio SMS', component: SMSCenter },
  marketplace: { label: 'Marketplace Hub', component: MarketplaceHub },
  accounting: { label: 'Accounting Sync', component: AccountingSync },
  google_calendar: { label: 'Google Calendar', component: CalendarSync },
  security: { label: 'API Keys & Security', component: APIKeyManager },
};

const TABS = [
  { id: 'hub', label: '🌐 Overview', emoji: '🌐' },
  { id: 'whatsapp', label: '💬 WhatsApp', emoji: '💬' },
  { id: 'mpesa', label: '📱 M-Pesa', emoji: '📱' },
  { id: 'twilio', label: '📨 SMS', emoji: '📨' },
  { id: 'marketplace', label: '🛵 Marketplace', emoji: '🛵' },
  { id: 'accounting', label: '📊 Accounting', emoji: '📊' },
  { id: 'google_calendar', label: '📅 Calendar', emoji: '📅' },
  { id: 'security', label: '🔐 Security', emoji: '🔐' },
];

const Loader = () => (
  <div className="flex justify-center py-12">
    <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
  </div>
);

export default function Integrations() {
  const [activeView, setActiveView] = useState('hub');

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => base44.entities.Integration.list(),
  });

  const handleConfigure = (provider) => {
    const viewMap = {
      whatsapp: 'whatsapp',
      mpesa: 'mpesa',
      twilio: 'twilio',
      uber_eats: 'marketplace',
      jumia_food: 'marketplace',
      google_calendar: 'google_calendar',
      quickbooks: 'accounting',
      xero: 'accounting',
    };
    setActiveView(viewMap[provider] || 'security');
  };

  const ViewComponent = VIEWS[activeView]?.component;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-[#c9a962]" />
        </div>
        <div>
          <h2 className="font-playfair text-2xl text-white">Integrations</h2>
          <p className="font-inter text-sm text-white/50">WhatsApp · M-Pesa · SMS · Marketplace · Accounting · Calendar</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap border-b border-[#c9a962]/10 pb-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-inter text-sm transition-all ${
              activeView === tab.id
                ? 'bg-[#c9a962] text-[#0a0a0a] font-semibold'
                : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10 hover:border-[#c9a962]/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div key={activeView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <React.Suspense fallback={<Loader />}>
          {activeView === 'hub'
            ? <IntegrationHub integrations={integrations} onConfigure={handleConfigure} />
            : ViewComponent ? <ViewComponent /> : null
          }
        </React.Suspense>
      </motion.div>
    </div>
  );
}