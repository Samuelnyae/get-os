import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Zap, ExternalLink, Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
  active: { color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: CheckCircle, label: 'Active' },
  inactive: { color: 'text-white/40 bg-white/5 border-white/10', icon: Clock, label: 'Not Connected' },
  error: { color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: XCircle, label: 'Error' },
  pending: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: AlertCircle, label: 'Pending' },
};

const ALL_INTEGRATIONS = [
  { provider: 'whatsapp', name: 'WhatsApp Business API', emoji: '💬', desc: 'Automate reservations, orders, loyalty & support via WhatsApp.', category: 'Communication' },
  { provider: 'mpesa', name: 'M-Pesa Daraja API', emoji: '📱', desc: 'STK Push, Paybill & Till payments for Kenya & East Africa.', category: 'Payments' },
  { provider: 'twilio', name: 'Twilio SMS', emoji: '📨', desc: 'SMS notifications for orders, reservations & loyalty.', category: 'Communication' },
  { provider: 'uber_eats', name: 'Uber Eats', emoji: '🛵', desc: 'Sync menu, orders & inventory with Uber Eats platform.', category: 'Marketplace' },
  { provider: 'jumia_food', name: 'Jumia Food', emoji: '🍔', desc: 'Manage Jumia Food orders from one unified dashboard.', category: 'Marketplace' },
  { provider: 'google_calendar', name: 'Google Calendar', emoji: '📅', desc: 'Sync reservations, events & room bookings to Google Calendar.', category: 'Productivity' },
  { provider: 'quickbooks', name: 'QuickBooks', emoji: '📊', desc: 'Auto-sync sales, refunds & invoices to QuickBooks.', category: 'Accounting' },
  { provider: 'xero', name: 'Xero', emoji: '📈', desc: 'Real-time accounting sync for P&L, cash flow & balances.', category: 'Accounting' },
  { provider: 'stripe', name: 'Stripe', emoji: '💳', desc: 'International card payments (Visa, Mastercard, etc.)', category: 'Payments' },
  { provider: 'paypal', name: 'PayPal', emoji: '🅿️', desc: 'PayPal checkout for international guests.', category: 'Payments' },
];

const CATEGORIES = [...new Set(ALL_INTEGRATIONS.map(i => i.category))];

export default function IntegrationHub({ integrations = [], onConfigure }) {
  const [testingProvider, setTestingProvider] = useState(null);

  const getStatus = (provider) => {
    const found = integrations.find(i => i.provider === provider);
    return found?.status || 'inactive';
  };

  const handleQuickTest = async (provider) => {
    setTestingProvider(provider);
    try {
      const record = integrations.find(i => i.provider === provider);
      if (!record) return;
      const { base44 } = await import('@/api/base44Client');
      const response = await base44.functions.invoke('testIntegration', {
        provider,
        api_key: record.api_key,
        api_secret: record.api_secret,
        webhook_url: record.webhook_url,
      });
      const res = response.data || response;
      const newStatus = res.success ? 'active' : 'error';
      await base44.entities.Integration.update(record.id, { status: newStatus, last_sync: new Date().toISOString() });
    } catch (e) {
      console.error('Quick test failed:', e);
    } finally {
      setTestingProvider(null);
    }
  };

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    items: ALL_INTEGRATIONS.filter(i => i.category === cat),
  }));

  return (
    <div className="space-y-8">
      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Integrations', value: ALL_INTEGRATIONS.length, color: 'text-white' },
          { label: 'Active', value: integrations.filter(i => i.status === 'active').length, color: 'text-green-400' },
          { label: 'Errors', value: integrations.filter(i => i.status === 'error').length, color: 'text-red-400' },
          { label: 'Pending Setup', value: ALL_INTEGRATIONS.length - integrations.filter(i => i.status === 'active').length, color: 'text-yellow-400' },
        ].map((s, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <p className={`font-inter text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-white/40 font-inter text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {byCategory.map(({ cat, items }) => (
        <div key={cat}>
          <h4 className="font-inter text-white/50 text-xs uppercase tracking-widest mb-3">{cat}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(integ => {
              const status = getStatus(integ.provider);
              const cfg = STATUS_CONFIG[status];
              const Icon = cfg.icon;
              const record = integrations.find(i => i.provider === integ.provider);
              return (
                <div key={integ.provider} className={`bg-[#1a1a1a] border rounded-xl p-5 hover:border-[#c9a962]/30 transition-all ${status === 'active' ? 'border-green-400/20' : 'border-[#c9a962]/10'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integ.emoji}</span>
                      <div>
                        <p className="font-inter text-sm font-semibold text-white">{integ.name}</p>
                        <span className={`inline-flex items-center gap-1 font-inter text-xs px-2 py-0.5 rounded-full border mt-1 ${cfg.color}`}>
                          <Icon className="w-2.5 h-2.5" />{cfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/40 font-inter text-xs mb-4 leading-relaxed">{integ.desc}</p>
                  {record?.last_sync && (
                    <p className="text-white/25 font-inter text-xs mb-3">Last sync: {new Date(record.last_sync).toLocaleString()}</p>
                  )}
                  <div className="flex gap-2">
                    {status !== 'inactive' && (
                      <button
                        onClick={() => handleQuickTest(integ.provider)}
                        disabled={testingProvider === integ.provider}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-inter text-xs font-semibold bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 disabled:opacity-50"
                      >
                        {testingProvider === integ.provider
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Zap className="w-3 h-3" />}
                        Test
                      </button>
                    )}
                    <button onClick={() => onConfigure(integ.provider)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-inter text-xs font-semibold transition-all ${
                        status === 'active'
                          ? 'bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20'
                          : 'bg-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/20 hover:bg-[#c9a962]/20'
                      }`}>
                      <Zap className="w-3 h-3" />
                      {status === 'active' ? 'Manage' : 'Configure'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}