import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Send, X, MessageCircle, CheckCheck, Clock, AlertCircle, Zap } from 'lucide-react';

const MSG_TYPES = ['reservation_confirm', 'order_confirm', 'order_update', 'delivery', 'loyalty', 'promotion', 'support', 'campaign'];
const STATUS_COLORS = { sent: 'text-blue-400', delivered: 'text-green-400', read: 'text-[#c9a962]', failed: 'text-red-400', pending: 'text-white/40' };

const TEMPLATES = [
  { name: 'reservation_confirm', label: 'Reservation Confirmation', body: 'Hello {{name}}! Your reservation at Digital Bites is confirmed for {{date}} at {{time}} for {{guests}} guests. We look forward to seeing you! 🍽️' },
  { name: 'order_confirm', label: 'Order Confirmation', body: 'Hi {{name}}! Your order #{{order_id}} has been received. Estimated time: {{time}} minutes. Track your order here: {{link}} 🚀' },
  { name: 'order_ready', label: 'Order Ready', body: 'Great news {{name}}! Your order #{{order_id}} is ready. {{type_message}} Enjoy your meal! 🎉' },
  { name: 'loyalty_points', label: 'Loyalty Points Update', body: 'Hi {{name}}! You earned {{points}} points on your last visit. Total balance: {{total}} pts. Your tier: {{tier}} 🌟' },
  { name: 'promotion', label: 'Promotional Offer', body: 'Exclusive offer for you, {{name}}! {{offer_details}}. Valid until {{expiry}}. Book now: {{link}} ✨' },
];

const AUTOMATION_FLOWS = [
  { id: 'reservation', label: 'Reservation Flow', emoji: '📅', steps: ['Customer texts "BOOK"', 'Bot asks date/time/guests', 'System checks availability', 'Confirms & sends details', 'Reminder 2hrs before'] },
  { id: 'order', label: 'Order Status Flow', emoji: '🛵', steps: ['Order placed', 'Confirmation sent', 'Kitchen starts → update', 'Order ready → notify', 'Delivery → tracking link'] },
  { id: 'loyalty', label: 'Loyalty Flow', emoji: '⭐', steps: ['Visit recorded', 'Points credited', 'Tier upgrade check', 'Reward notification', 'Birthday/anniversary offer'] },
  { id: 'support', label: 'Support FAQ Flow', emoji: '💬', steps: ['Customer texts question', 'AI matches FAQ', 'Auto-reply sent', 'If unresolved → escalate', 'Human agent notified'] },
];

export default function WhatsAppDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({ customer_name: '', customer_phone: '', message_type: 'promotion', message_body: '', template_name: '' });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const qc = useQueryClient();

  const { data: messages = [] } = useQuery({ queryKey: ['whatsapp-messages'], queryFn: () => base44.entities.WhatsAppMessage.list('-created_date', 200) });

  const sendMsg = useMutation({
    mutationFn: (data) => base44.entities.WhatsAppMessage.create({ ...data, status: 'sent', sent_at: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries(['whatsapp-messages']); setShowSend(false); setSendForm({ customer_name: '', customer_phone: '', message_type: 'promotion', message_body: '', template_name: '' }); }
  });

  const stats = {
    sent: messages.length,
    delivered: messages.filter(m => ['delivered', 'read'].includes(m.status)).length,
    read: messages.filter(m => m.status === 'read').length,
    failed: messages.filter(m => m.status === 'failed').length,
  };

  const deliveryRate = stats.sent ? Math.round((stats.delivered / stats.sent) * 100) : 0;
  const readRate = stats.sent ? Math.round((stats.read / stats.sent) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💬</span>
          <div>
            <h3 className="font-inter text-white font-semibold text-lg">WhatsApp Business Dashboard</h3>
            <p className="text-white/40 font-inter text-xs">Automate customer communication via WhatsApp</p>
          </div>
        </div>
        <button onClick={() => setShowSend(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-inter text-sm font-semibold hover:bg-green-600">
          <Send className="w-4 h-4" /> Send Message
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: stats.sent, color: 'text-white', sub: 'All time' },
          { label: 'Delivery Rate', value: `${deliveryRate}%`, color: 'text-green-400', sub: `${stats.delivered} delivered` },
          { label: 'Read Rate', value: `${readRate}%`, color: 'text-[#c9a962]', sub: `${stats.read} read` },
          { label: 'Failed', value: stats.failed, color: 'text-red-400', sub: 'Need attention' },
        ].map((s, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <p className={`font-inter text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-white font-inter text-sm mt-1">{s.label}</p>
            <p className="text-white/30 font-inter text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#c9a962]/10 pb-3">
        {['overview', 'templates', 'automation', 'history'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg font-inter text-sm capitalize transition-all ${activeTab === t ? 'bg-[#c9a962] text-[#0a0a0a] font-semibold' : 'text-white/50 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <h4 className="font-inter text-sm font-semibold text-white mb-3">Messages by Type</h4>
            {MSG_TYPES.map(t => {
              const count = messages.filter(m => m.message_type === t).length;
              const pct = stats.sent ? Math.round((count / stats.sent) * 100) : 0;
              return (
                <div key={t} className="flex items-center gap-3 mb-2">
                  <span className="text-white/50 font-inter text-xs w-28 capitalize">{t.replace(/_/g, ' ')}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-2">
                    <div className="bg-[#c9a962] h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-white/40 font-inter text-xs w-6">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <h4 className="font-inter text-sm font-semibold text-white mb-3">Recent Activity</h4>
            {messages.slice(0, 8).map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="font-inter text-xs text-white">{m.customer_name || m.customer_phone}</p>
                  <p className="font-inter text-xs text-white/40 capitalize">{m.message_type?.replace(/_/g, ' ')}</p>
                </div>
                <span className={`font-inter text-xs font-semibold capitalize ${STATUS_COLORS[m.status]}`}>{m.status}</span>
              </div>
            ))}
            {messages.length === 0 && <p className="text-white/30 font-inter text-xs text-center py-4">No messages yet.</p>}
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map(t => (
            <div key={t.name} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4 hover:border-[#c9a962]/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="font-inter text-sm font-semibold text-white">{t.label}</p>
                <button onClick={() => { setSendForm(p => ({ ...p, template_name: t.name, message_body: t.body })); setShowSend(true); }}
                  className="px-2 py-1 bg-[#c9a962]/10 text-[#c9a962] rounded-lg font-inter text-xs hover:bg-[#c9a962]/20">Use</button>
              </div>
              <p className="text-white/50 font-inter text-xs leading-relaxed bg-[#0a0a0a] rounded-lg p-3">{t.body}</p>
              <p className="text-white/20 font-inter text-xs mt-2">Variables: {(t.body.match(/\{\{[^}]+\}\}/g) || []).join(', ')}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AUTOMATION_FLOWS.map(flow => (
            <div key={flow.id} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{flow.emoji}</span>
                <p className="font-inter text-sm font-semibold text-white">{flow.label}</p>
              </div>
              <div className="space-y-2">
                {flow.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#c9a962]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#c9a962] font-inter text-xs">{i + 1}</span>
                    </div>
                    <p className="text-white/60 font-inter text-xs">{step}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-white/30 font-inter text-xs">Status: Not configured</span>
                <button className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-400/20 rounded-lg font-inter text-xs hover:bg-green-500/20">
                  <Zap className="w-3 h-3 inline mr-1" />Enable
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">{['Customer', 'Phone', 'Type', 'Message Preview', 'Status', 'Sent At'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-inter text-xs text-white/40 uppercase tracking-wider">{h}</th>
              ))}</tr></thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-inter text-xs text-white">{m.customer_name || '—'}</td>
                    <td className="px-4 py-3 font-inter text-xs text-white/60">{m.customer_phone}</td>
                    <td className="px-4 py-3 font-inter text-xs text-white/60 capitalize">{m.message_type?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 font-inter text-xs text-white/50 max-w-xs truncate">{m.message_body?.slice(0, 60)}...</td>
                    <td className="px-4 py-3"><span className={`font-inter text-xs font-semibold capitalize ${STATUS_COLORS[m.status]}`}>{m.status}</span></td>
                    <td className="px-4 py-3 font-inter text-xs text-white/40">{m.sent_at ? new Date(m.sent_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
                {messages.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-white/30 font-inter text-sm">No messages yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showSend && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-inter text-white font-semibold">Send WhatsApp Message</h3>
              <button onClick={() => setShowSend(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Customer Name</label>
                  <input value={sendForm.customer_name} onChange={e => setSendForm(p => ({ ...p, customer_name: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Phone (+254...)</label>
                  <input value={sendForm.customer_phone} onChange={e => setSendForm(p => ({ ...p, customer_phone: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Message Type</label>
                <select value={sendForm.message_type} onChange={e => setSendForm(p => ({ ...p, message_type: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                  {MSG_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Message</label>
                <textarea value={sendForm.message_body} onChange={e => setSendForm(p => ({ ...p, message_body: e.target.value }))} rows={4}
                  placeholder="Type your message or select a template above..."
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowSend(false)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm">Cancel</button>
              <button onClick={() => sendMsg.mutate(sendForm)} disabled={!sendForm.customer_phone || !sendForm.message_body || sendMsg.isPending}
                className="flex-1 py-2 bg-green-500 text-white rounded-lg font-inter text-sm font-semibold disabled:opacity-50 hover:bg-green-600">
                {sendMsg.isPending ? 'Sending...' : '📤 Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}