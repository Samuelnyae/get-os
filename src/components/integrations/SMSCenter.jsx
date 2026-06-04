import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, Send } from 'lucide-react';

const MSG_TYPES = ['reservation', 'order', 'loyalty', 'promotion', 'alert', 'campaign'];
const STATUS_COLORS = { sent: 'text-blue-400 bg-blue-400/10', delivered: 'text-green-400 bg-green-400/10', failed: 'text-red-400 bg-red-400/10', pending: 'text-yellow-400 bg-yellow-400/10' };

const SMS_TEMPLATES = [
  { type: 'reservation', label: 'Reservation Confirmation', body: 'Digital Bites: Your table for {{guests}} on {{date}} at {{time}} is confirmed. Ref: {{ref}}. Questions? Call us.' },
  { type: 'order', label: 'Order Ready', body: 'Digital Bites: Your order #{{order_id}} is ready. {{pickup_or_delivery}} Enjoy your meal!' },
  { type: 'loyalty', label: 'Points Earned', body: 'Digital Bites: You earned {{points}} points! Total: {{total}} pts. Tier: {{tier}}. Redeem at your next visit.' },
  { type: 'promotion', label: 'Special Offer', body: 'Digital Bites EXCLUSIVE: {{offer}}. Valid {{dates}}. Book: {{link}} Reply STOP to unsubscribe.' },
];

const EMPTY = { phone: '', customer_name: '', message: '', message_type: 'reservation' };

export default function SMSCenter() {
  const [showForm, setShowForm] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [campaign, setCampaign] = useState({ message: '', message_type: 'promotion', phones: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();

  const { data: logs = [] } = useQuery({ queryKey: ['sms-logs'], queryFn: () => base44.entities.SMSLog.list('-created_date', 200) });

  const send = useMutation({
    mutationFn: (data) => base44.entities.SMSLog.create({ ...data, status: 'sent', sent_at: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries(['sms-logs']); setShowForm(false); setForm(EMPTY); }
  });

  const sendCampaign = useMutation({
    mutationFn: async (data) => {
      const phones = data.phones.split('\n').map(p => p.trim()).filter(Boolean);
      await Promise.all(phones.map(phone =>
        base44.entities.SMSLog.create({ phone, message: data.message, message_type: data.message_type, status: 'sent', sent_at: new Date().toISOString() })
      ));
    },
    onSuccess: () => { qc.invalidateQueries(['sms-logs']); setShowCampaign(false); }
  });

  const filtered = logs.filter(l => statusFilter === 'all' || l.status === statusFilter);
  const stats = {
    sent: logs.length,
    delivered: logs.filter(l => l.status === 'delivered').length,
    failed: logs.filter(l => l.status === 'failed').length,
    rate: logs.length ? Math.round((logs.filter(l => ['sent','delivered'].includes(l.status)).length / logs.length) * 100) : 0,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📨</span>
          <div>
            <h3 className="font-inter text-white font-semibold text-lg">Twilio SMS Center</h3>
            <p className="text-white/40 font-inter text-xs">Send SMS notifications & campaigns</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCampaign(true)} className="flex items-center gap-2 px-3 py-2 border border-[#c9a962]/20 text-[#c9a962] rounded-lg font-inter text-sm hover:bg-[#c9a962]/10">
            📢 Campaign
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-inter text-sm font-semibold hover:bg-blue-600">
            <Send className="w-4 h-4" /> Send SMS
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: stats.sent, color: 'text-white' },
          { label: 'Delivered', value: stats.delivered, color: 'text-green-400' },
          { label: 'Success Rate', value: `${stats.rate}%`, color: 'text-[#c9a962]' },
          { label: 'Failed', value: stats.failed, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <p className={`font-inter text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-white/40 font-inter text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Templates */}
      <div>
        <h4 className="font-inter text-sm font-semibold text-white mb-3">SMS Templates</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SMS_TEMPLATES.map(t => (
            <div key={t.type} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4 hover:border-[#c9a962]/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="font-inter text-xs font-semibold text-white">{t.label}</p>
                <button onClick={() => { setForm(p => ({ ...p, message: t.body, message_type: t.type })); setShowForm(true); }}
                  className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg font-inter text-xs hover:bg-blue-500/20">Use</button>
              </div>
              <p className="text-white/40 font-inter text-xs leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + Table */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {['all', 'sent', 'delivered', 'failed', 'pending'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg font-inter text-xs capitalize transition-all ${statusFilter === s ? 'bg-[#c9a962] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>{s}</button>
        ))}
      </div>

      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5">{['Phone', 'Customer', 'Type', 'Message', 'Status', 'Sent At'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-inter text-xs text-white/40 uppercase tracking-wider">{h}</th>
            ))}</tr></thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-inter text-xs text-white">{l.phone}</td>
                  <td className="px-4 py-3 font-inter text-xs text-white/60">{l.customer_name || '—'}</td>
                  <td className="px-4 py-3 font-inter text-xs text-white/50 capitalize">{l.message_type}</td>
                  <td className="px-4 py-3 font-inter text-xs text-white/50 max-w-xs truncate">{l.message?.slice(0, 50)}...</td>
                  <td className="px-4 py-3"><span className={`font-inter text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[l.status]}`}>{l.status}</span></td>
                  <td className="px-4 py-3 font-inter text-xs text-white/40">{l.sent_at ? new Date(l.sent_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-white/30 font-inter text-sm">No SMS logs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-inter text-white font-semibold">Send SMS</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Phone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Customer Name</label>
                  <input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Type</label>
                <select value={form.message_type} onChange={e => setForm(p => ({ ...p, message_type: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                  {MSG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Message <span className="text-white/30">({form.message.length}/160)</span></label>
                <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm">Cancel</button>
              <button onClick={() => send.mutate(form)} disabled={!form.phone || !form.message || send.isPending}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                {send.isPending ? 'Sending...' : 'Send SMS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaign && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-inter text-white font-semibold">📢 SMS Campaign</h3>
              <button onClick={() => setShowCampaign(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Phone Numbers (one per line)</label>
                <textarea value={campaign.phones} onChange={e => setCampaign(p => ({ ...p, phones: e.target.value }))} rows={4}
                  placeholder="+254712345678&#10;+254798765432&#10;..." className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                <p className="text-white/30 font-inter text-xs mt-1">{campaign.phones.split('\n').filter(p => p.trim()).length} recipients</p>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Message</label>
                <textarea value={campaign.message} onChange={e => setCampaign(p => ({ ...p, message: e.target.value }))} rows={3}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCampaign(false)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm">Cancel</button>
              <button onClick={() => sendCampaign.mutate(campaign)} disabled={!campaign.phones || !campaign.message || sendCampaign.isPending}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                {sendCampaign.isPending ? 'Sending...' : '🚀 Send Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}