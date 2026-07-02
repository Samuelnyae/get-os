import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, Eye, EyeOff, Shield, Key, Webhook, RotateCcw, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const PROVIDER_CONFIGS = {
  whatsapp: { name: 'WhatsApp Business API', emoji: '💬', fields: [{ key: 'api_key', label: 'Access Token', secret: true }, { key: 'api_secret', label: 'Phone Number ID' }, { key: 'webhook_url', label: 'Webhook Verify Token' }], docs: 'https://developers.facebook.com/docs/whatsapp' },
  mpesa: { name: 'M-Pesa Daraja API', emoji: '📱', fields: [{ key: 'api_key', label: 'Consumer Key', secret: true }, { key: 'api_secret', label: 'Consumer Secret', secret: true }, { key: 'webhook_url', label: 'Passkey' }], docs: 'https://developer.safaricom.co.ke' },
  twilio: { name: 'Twilio SMS', emoji: '📨', fields: [{ key: 'api_key', label: 'Account SID' }, { key: 'api_secret', label: 'Auth Token', secret: true }, { key: 'webhook_url', label: 'From Phone Number' }], docs: 'https://console.twilio.com' },
  uber_eats: { name: 'Uber Eats', emoji: '🛵', fields: [{ key: 'api_key', label: 'Client ID' }, { key: 'api_secret', label: 'Client Secret', secret: true }, { key: 'webhook_url', label: 'Store ID' }], docs: 'https://developer.uber.com/docs/eats' },
  jumia_food: { name: 'Jumia Food', emoji: '🍔', fields: [{ key: 'api_key', label: 'Vendor API Key', secret: true }, { key: 'webhook_url', label: 'Restaurant ID' }], docs: 'https://food.jumia.com/partner' },
  google_calendar: { name: 'Google Calendar', emoji: '📅', fields: [{ key: 'api_key', label: 'OAuth Client ID' }, { key: 'api_secret', label: 'OAuth Client Secret', secret: true }, { key: 'webhook_url', label: 'Calendar ID' }], docs: 'https://console.cloud.google.com' },
  quickbooks: { name: 'QuickBooks', emoji: '📊', fields: [{ key: 'api_key', label: 'Client ID' }, { key: 'api_secret', label: 'Client Secret', secret: true }, { key: 'webhook_url', label: 'Realm ID' }], docs: 'https://developer.intuit.com' },
  xero: { name: 'Xero', emoji: '📈', fields: [{ key: 'api_key', label: 'Client ID' }, { key: 'api_secret', label: 'Client Secret', secret: true }, { key: 'webhook_url', label: 'Tenant ID' }], docs: 'https://developer.xero.com' },
};

const WEBHOOKS = [
  { provider: 'WhatsApp', endpoint: '/webhooks/whatsapp', status: 'active', desc: 'Incoming messages & delivery receipts' },
  { provider: 'M-Pesa', endpoint: '/webhooks/mpesa/callback', status: 'active', desc: 'Payment confirmations & notifications' },
  { provider: 'Uber Eats', endpoint: '/webhooks/uber-eats/orders', status: 'inactive', desc: 'New order notifications' },
  { provider: 'Jumia Food', endpoint: '/webhooks/jumia/orders', status: 'inactive', desc: 'New order notifications' },
];

export default function APIKeyManager() {
  const [configuring, setConfiguring] = useState(null);
  const [formData, setFormData] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const qc = useQueryClient();

  const { data: integrations = [] } = useQuery({ queryKey: ['integrations'], queryFn: () => base44.entities.Integration.list() });

  const save = useMutation({
    mutationFn: async (data) => {
      // Test the connection first
      setTesting(true);
      setTestResult(null);
      let testRes = { success: false, message: 'Test failed' };
      try {
        const response = await base44.functions.invoke('testIntegration', {
          provider: configuring,
          api_key: data.api_key,
          api_secret: data.api_secret,
          webhook_url: data.webhook_url,
        });
        testRes = response.data || response;
      } catch (e) {
        testRes = { success: false, message: e.message || 'Connection test failed' };
      }
      setTesting(false);
      setTestResult(testRes);

      // If test failed, don't save as active
      if (!testRes.success) {
        throw new Error(testRes.message);
      }

      // Save with verified status
      const existing = integrations.find(i => i.provider === configuring);
      const payload = { ...data, status: 'active', last_sync: new Date().toISOString() };
      if (existing) return base44.entities.Integration.update(existing.id, payload);
      return base44.entities.Integration.create({ ...data, provider: configuring, integration_name: PROVIDER_CONFIGS[configuring]?.name, status: 'active' });
    },
    onSuccess: () => { qc.invalidateQueries(['integrations']); setConfiguring(null); setFormData({}); setTestResult(null); },
    onError: () => { /* error is shown via testResult state */ },
  });

  const openConfig = (provider) => {
    const existing = integrations.find(i => i.provider === provider);
    setFormData(existing ? { api_key: existing.api_key || '', api_secret: existing.api_secret || '', webhook_url: existing.webhook_url || '' } : {});
    setTestResult(null);
    setConfiguring(provider);
  };

  // Quick test from the card (for already-saved integrations)
  const quickTest = async (provider) => {
    const existing = integrations.find(i => i.provider === provider);
    if (!existing) return;
    setTesting(true);
    setTestResult(null);
    try {
      const response = await base44.functions.invoke('testIntegration', {
        provider,
        api_key: existing.api_key,
        api_secret: existing.api_secret,
        webhook_url: existing.webhook_url,
      });
      const res = response.data || response;
      if (res.success) {
        await base44.entities.Integration.update(existing.id, { status: 'active', last_sync: new Date().toISOString() });
      } else {
        await base44.entities.Integration.update(existing.id, { status: 'error' });
      }
      setTestResult(res);
      qc.invalidateQueries(['integrations']);
    } catch (e) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setTesting(false);
    }
  };

  const toggleSecret = (key) => setShowSecrets(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-[#c9a962]" />
        <div>
          <h3 className="font-inter text-white font-semibold text-lg">API Keys & Security</h3>
          <p className="text-white/40 font-inter text-xs">Manage credentials, webhooks & security</p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl flex items-start gap-3">
        <Shield className="w-4 h-4 text-[#c9a962] mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-inter text-xs font-semibold text-[#c9a962]">Security Notice</p>
          <p className="font-inter text-xs text-white/50 mt-0.5">API keys are masked after saving. Never share credentials. Rotate keys periodically. Use environment variables in production.</p>
        </div>
      </div>

      {/* Integration API Key Cards */}
      <div>
        <h4 className="font-inter text-xs text-white/50 uppercase tracking-widest mb-3">Integration Credentials</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(PROVIDER_CONFIGS).map(([provider, cfg]) => {
            const existing = integrations.find(i => i.provider === provider);
            const isConfigured = !!existing?.api_key;
            return (
              <div key={provider} className={`bg-[#1a1a1a] border rounded-xl p-4 transition-all ${isConfigured ? 'border-green-400/20' : 'border-[#c9a962]/10 hover:border-[#c9a962]/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cfg.emoji}</span>
                    <div>
                      <p className="font-inter text-sm font-semibold text-white">{cfg.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {isConfigured
                          ? <><CheckCircle className="w-3 h-3 text-green-400" /><span className="font-inter text-xs text-green-400">Configured</span></>
                          : <><AlertTriangle className="w-3 h-3 text-yellow-400" /><span className="font-inter text-xs text-yellow-400">Not configured</span></>
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={cfg.docs} target="_blank" rel="noreferrer" className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all text-xs font-inter">Docs</a>
                    <button onClick={() => openConfig(provider)} className="px-3 py-1.5 bg-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/20 rounded-lg font-inter text-xs hover:bg-[#c9a962]/20">
                      <Key className="w-3 h-3 inline mr-1" />{isConfigured ? 'Update' : 'Configure'}
                    </button>
                  </div>
                </div>
                {isConfigured && (
                  <div className="space-y-1">
                    {cfg.fields.slice(0, 1).map(f => (
                      <div key={f.key} className="flex items-center gap-2">
                        <span className="text-white/30 font-inter text-xs">{f.label}:</span>
                        <span className="font-mono text-xs text-white/50">••••••••{(existing[f.key] || '').slice(-4)}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => quickTest(provider)}
                      disabled={testing}
                      className="flex items-center gap-1 text-[#c9a962] text-xs hover:opacity-80 mt-1 disabled:opacity-50"
                    >
                      {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      Test Connection
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Webhooks */}
      <div>
        <h4 className="font-inter text-xs text-white/50 uppercase tracking-widest mb-3">Webhook Endpoints</h4>
        <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-white/5">{['Provider', 'Endpoint', 'Description', 'Status'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-inter text-xs text-white/40 uppercase tracking-wider">{h}</th>
            ))}</tr></thead>
            <tbody>
              {WEBHOOKS.map((w, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-inter text-xs text-white font-semibold">{w.provider}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#c9a962]">{w.endpoint}</td>
                  <td className="px-4 py-3 font-inter text-xs text-white/50">{w.desc}</td>
                  <td className="px-4 py-3">
                    <span className={`font-inter text-xs px-2 py-0.5 rounded-full ${w.status === 'active' ? 'text-green-400 bg-green-400/10' : 'text-white/40 bg-white/5'}`}>{w.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Modal */}
      {configuring && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-inter text-white font-semibold">{PROVIDER_CONFIGS[configuring]?.emoji} Configure {PROVIDER_CONFIGS[configuring]?.name}</h3>
              <button onClick={() => setConfiguring(null)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-3 mb-5">
              {(PROVIDER_CONFIGS[configuring]?.fields || []).map(f => (
                <div key={f.key}>
                  <label className="font-inter text-xs text-white/50 mb-1 block">{f.label}</label>
                  <div className="relative">
                    <input
                      type={f.secret && !showSecrets[f.key] ? 'password' : 'text'}
                      value={formData[f.key] || ''}
                      onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm pr-10"
                      placeholder={f.secret ? '••••••••••••' : ''}
                    />
                    {f.secret && (
                      <button onClick={() => toggleSecret(f.key)} className="absolute right-3 top-2.5 text-white/30 hover:text-white">
                        {showSecrets[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="p-3 bg-yellow-400/5 border border-yellow-400/20 rounded-lg">
                <p className="font-inter text-xs text-yellow-400">⚠️ Credentials are stored securely. Review <a href={PROVIDER_CONFIGS[configuring]?.docs} target="_blank" rel="noreferrer" className="underline">documentation</a> for setup guide.</p>
              </div>

              {/* Test result */}
              {testResult && (
                <div className={`p-3 rounded-lg border flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-green-400/10 border-green-400/20'
                    : 'bg-red-400/10 border-red-400/20'
                }`}>
                  {testResult.success
                    ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                  <p className={`font-inter text-xs ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>{testResult.message}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfiguring(null)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm">Cancel</button>
              <button onClick={() => save.mutate(formData)} disabled={save.isPending || testing}
                className="flex-1 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {testing ? <><Loader2 className="w-4 h-4 animate-spin" /> Testing...</> : save.isPending ? 'Saving...' : '🔐 Save & Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}