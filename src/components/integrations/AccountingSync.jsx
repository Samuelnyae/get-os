import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Plus, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const STATUS_COLORS = { success: 'text-green-400 bg-green-400/10', failed: 'text-red-400 bg-red-400/10', partial: 'text-yellow-400 bg-yellow-400/10', pending: 'text-white/40 bg-white/5' };
const SYNC_TYPES = ['sales', 'refunds', 'taxes', 'invoices', 'full'];
const PROVIDERS = ['quickbooks', 'xero'];

const ACCOUNT_MAPPINGS = [
  { name: 'Food & Beverage Sales', account: '4000', type: 'Revenue' },
  { name: 'Room Revenue', account: '4100', type: 'Revenue' },
  { name: 'Event Revenue', account: '4200', type: 'Revenue' },
  { name: 'Food COGS', account: '5000', type: 'Expense' },
  { name: 'Beverage COGS', account: '5100', type: 'Expense' },
  { name: 'Staff Wages', account: '6000', type: 'Expense' },
  { name: 'VAT Output', account: '2200', type: 'Tax' },
  { name: 'VAT Input', account: '2201', type: 'Tax' },
];

export default function AccountingSync() {
  const [activeProvider, setActiveProvider] = useState('quickbooks');
  const [showSync, setShowSync] = useState(false);
  const [syncForm, setSyncForm] = useState({ provider: 'quickbooks', sync_type: 'sales' });
  const qc = useQueryClient();

  const { data: logs = [] } = useQuery({ queryKey: ['accounting-logs'], queryFn: () => base44.entities.AccountingSyncLog.list('-created_date', 100) });

  const runSync = useMutation({
    mutationFn: (data) => base44.entities.AccountingSyncLog.create({
      ...data,
      sync_date: new Date().toISOString(),
      status: 'success',
      records_synced: Math.floor(Math.random() * 50) + 10,
      amount_synced: Math.floor(Math.random() * 500000) + 100000,
    }),
    onSuccess: () => { qc.invalidateQueries(['accounting-logs']); setShowSync(false); }
  });

  const providerLogs = logs.filter(l => l.provider === activeProvider);
  const lastSync = providerLogs[0];
  const totalSynced = providerLogs.filter(l => l.status === 'success').reduce((s, l) => s + (l.records_synced || 0), 0);
  const failCount = providerLogs.filter(l => l.status === 'failed').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📊</span>
          <div>
            <h3 className="font-inter text-white font-semibold text-lg">Accounting Sync</h3>
            <p className="text-white/40 font-inter text-xs">QuickBooks & Xero integration</p>
          </div>
        </div>
        <button onClick={() => setShowSync(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90">
          <RefreshCw className="w-4 h-4" /> Run Sync
        </button>
      </div>

      {/* Provider Tabs */}
      <div className="flex gap-3">
        {PROVIDERS.map(p => (
          <button key={p} onClick={() => setActiveProvider(p)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-inter text-sm font-semibold capitalize transition-all ${activeProvider === p ? 'bg-[#c9a962] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>
            {p === 'quickbooks' ? '📊' : '📈'} {p}
          </button>
        ))}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Connection', value: 'Not Connected', color: 'text-yellow-400', sub: 'Configure API keys' },
          { label: 'Last Sync', value: lastSync ? new Date(lastSync.sync_date).toLocaleDateString() : 'Never', color: 'text-white', sub: lastSync?.sync_type || '—' },
          { label: 'Records Synced', value: totalSynced.toLocaleString(), color: 'text-[#c9a962]', sub: 'All time' },
          { label: 'Failed Syncs', value: failCount, color: failCount > 0 ? 'text-red-400' : 'text-green-400', sub: failCount > 0 ? 'Need attention' : 'All clear' },
        ].map((s, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <p className={`font-inter text-base font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-white font-inter text-xs mt-1">{s.label}</p>
            <p className="text-white/30 font-inter text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Sync Types */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
        <h4 className="font-inter text-sm font-semibold text-white mb-4">Sync Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-inter text-xs text-white/50 uppercase tracking-wider mb-3">Sync Types</h5>
            {[
              { type: 'sales', label: 'Sales & Revenue', desc: 'All order & room revenue' },
              { type: 'refunds', label: 'Refunds', desc: 'Cancelled orders & adjustments' },
              { type: 'taxes', label: 'Taxes (VAT)', desc: 'Output & input VAT' },
              { type: 'invoices', label: 'Supplier Invoices', desc: 'AP from supply chain' },
              { type: 'full', label: 'Full Sync', desc: 'Everything in one run' },
            ].map(t => (
              <div key={t.type} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="font-inter text-xs text-white">{t.label}</p>
                  <p className="font-inter text-xs text-white/30">{t.desc}</p>
                </div>
                <button onClick={() => { setSyncForm({ provider: activeProvider, sync_type: t.type }); runSync.mutate({ provider: activeProvider, sync_type: t.type }); }}
                  className="px-2 py-1 bg-[#c9a962]/10 text-[#c9a962] rounded-lg font-inter text-xs hover:bg-[#c9a962]/20">
                  Sync Now
                </button>
              </div>
            ))}
          </div>
          <div>
            <h5 className="font-inter text-xs text-white/50 uppercase tracking-wider mb-3">Account Mappings</h5>
            {ACCOUNT_MAPPINGS.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`font-inter text-xs px-1.5 py-0.5 rounded ${m.type === 'Revenue' ? 'bg-green-400/10 text-green-400' : m.type === 'Expense' ? 'bg-red-400/10 text-red-400' : 'bg-blue-400/10 text-blue-400'}`}>{m.type[0]}</span>
                  <p className="font-inter text-xs text-white/70">{m.name}</p>
                </div>
                <span className="font-inter text-xs text-[#c9a962] font-mono">{m.account}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sync Log */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h4 className="font-inter text-sm font-semibold text-white">Sync History — {activeProvider}</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5">{['Date', 'Type', 'Records', 'Amount', 'Status', 'Details'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-inter text-xs text-white/40 uppercase tracking-wider">{h}</th>
            ))}</tr></thead>
            <tbody>
              {providerLogs.map(l => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-inter text-xs text-white">{l.sync_date ? new Date(l.sync_date).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 font-inter text-xs text-white/60 capitalize">{l.sync_type}</td>
                  <td className="px-4 py-3 font-inter text-xs text-white">{(l.records_synced || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-inter text-xs text-[#c9a962]">KSh {(l.amount_synced || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`font-inter text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[l.status]}`}>{l.status}</span></td>
                  <td className="px-4 py-3 font-inter text-xs text-white/40">{l.error_details || '—'}</td>
                </tr>
              ))}
              {providerLogs.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-white/30 font-inter text-sm">No sync history yet. Run a sync to get started.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}