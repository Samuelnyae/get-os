import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PLATFORMS = [
  { id: 'direct', label: 'Direct Orders', emoji: '🏠', color: 'text-[#c9a962]', commission: 0 },
  { id: 'qr_menu', label: 'QR Menu', emoji: '📱', color: 'text-blue-400', commission: 0 },
  { id: 'uber_eats', label: 'Uber Eats', emoji: '🛵', color: 'text-green-400', commission: 30 },
  { id: 'jumia_food', label: 'Jumia Food', emoji: '🍔', color: 'text-orange-400', commission: 25 },
  { id: 'glovo', label: 'Glovo', emoji: '🟡', color: 'text-yellow-400', commission: 28 },
  { id: 'bolt_food', label: 'Bolt Food', emoji: '⚡', color: 'text-white', commission: 22 },
];

const STATUS_COLORS = { new: 'text-blue-400', confirmed: 'text-green-400', preparing: 'text-yellow-400', ready: 'text-[#c9a962]', delivering: 'text-purple-400', delivered: 'text-white/50', cancelled: 'text-red-400' };

const EMPTY = { platform: 'uber_eats', platform_order_id: '', customer_name: '', customer_phone: '', subtotal: '', delivery_address: '', notes: '' };

export default function MarketplaceHub() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [platformFilter, setPlatformFilter] = useState('all');
  const qc = useQueryClient();

  const { data: orders = [] } = useQuery({ queryKey: ['marketplace-orders'], queryFn: () => base44.entities.MarketplaceOrder.list('-created_date', 200) });

  const create = useMutation({
    mutationFn: (data) => {
      const platform = PLATFORMS.find(p => p.id === data.platform);
      const subtotal = +data.subtotal;
      const commission = (platform?.commission || 0) / 100 * subtotal;
      return base44.entities.MarketplaceOrder.create({ ...data, subtotal, platform_commission: commission, net_revenue: subtotal - commission, status: 'new' });
    },
    onSuccess: () => { qc.invalidateQueries(['marketplace-orders']); setShowForm(false); setForm(EMPTY); }
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.MarketplaceOrder.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(['marketplace-orders']),
  });

  const filtered = orders.filter(o => platformFilter === 'all' || o.platform === platformFilter);

  const platformStats = PLATFORMS.map(p => ({
    name: p.emoji + ' ' + p.label.split(' ')[0],
    orders: orders.filter(o => o.platform === p.id).length,
    revenue: orders.filter(o => o.platform === p.id).reduce((s, o) => s + (o.net_revenue || 0), 0),
    commission: orders.filter(o => o.platform === p.id).reduce((s, o) => s + (o.platform_commission || 0), 0),
  }));

  const totalRevenue = orders.reduce((s, o) => s + (o.net_revenue || 0), 0);
  const totalCommission = orders.reduce((s, o) => s + (o.platform_commission || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛵</span>
          <div>
            <h3 className="font-inter text-white font-semibold text-lg">Marketplace Hub</h3>
            <p className="text-white/40 font-inter text-xs">Unified orders from all delivery platforms</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90">
          <Plus className="w-4 h-4" /> Add Order
        </button>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {PLATFORMS.map(p => {
          const pOrders = orders.filter(o => o.platform === p.id);
          const pRev = pOrders.reduce((s, o) => s + (o.net_revenue || 0), 0);
          return (
            <button key={p.id} onClick={() => setPlatformFilter(platformFilter === p.id ? 'all' : p.id)}
              className={`bg-[#1a1a1a] border rounded-xl p-3 text-center transition-all ${platformFilter === p.id ? 'border-[#c9a962]' : 'border-[#c9a962]/10 hover:border-[#c9a962]/30'}`}>
              <div className="text-2xl mb-1">{p.emoji}</div>
              <p className="font-inter text-xs font-semibold text-white">{pOrders.length}</p>
              <p className="font-inter text-xs text-white/40">{p.label.split(' ')[0]}</p>
              {p.commission > 0 && <p className="font-inter text-xs text-red-400 mt-1">{p.commission}% fee</p>}
            </button>
          );
        })}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, color: 'text-white' },
          { label: 'Net Revenue', value: `KSh ${totalRevenue.toLocaleString()}`, color: 'text-[#c9a962]' },
          { label: 'Commissions Paid', value: `KSh ${totalCommission.toLocaleString()}`, color: 'text-red-400' },
          { label: 'Active Now', value: orders.filter(o => ['new','confirmed','preparing','ready','delivering'].includes(o.status)).length, color: 'text-green-400' },
        ].map((s, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <p className={`font-inter text-xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-white/40 font-inter text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
        <h4 className="font-inter text-sm font-semibold text-white mb-4">Revenue by Platform</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={platformStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="name" tick={{ fill: '#ffffff60', fontSize: 10 }} />
            <YAxis tick={{ fill: '#ffffff60', fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => [`KSh ${v.toLocaleString()}`]} contentStyle={{ background: '#1a1a1a', border: '1px solid #c9a96230', color: '#fff' }} />
            <Bar dataKey="revenue" fill="#c9a962" radius={[4, 4, 0, 0]} name="Net Revenue" />
            <Bar dataKey="commission" fill="#ef4444" radius={[4, 4, 0, 0]} name="Commission" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Orders Table */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5">{['Platform', 'Order ID', 'Customer', 'Total', 'Commission', 'Net', 'Status', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-inter text-xs text-white/40 uppercase tracking-wider">{h}</th>
            ))}</tr></thead>
            <tbody>
              {filtered.map(o => {
                const p = PLATFORMS.find(pl => pl.id === o.platform);
                return (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-inter text-xs text-white">{p?.emoji} {p?.label}</td>
                    <td className="px-4 py-3 font-inter text-xs text-[#c9a962]">{o.platform_order_id || '—'}</td>
                    <td className="px-4 py-3 font-inter text-xs text-white">{o.customer_name}</td>
                    <td className="px-4 py-3 font-inter text-xs text-white">KSh {(o.subtotal || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-inter text-xs text-red-400">-KSh {(o.platform_commission || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-inter text-xs text-green-400 font-semibold">KSh {(o.net_revenue || 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`font-inter text-xs font-semibold capitalize ${STATUS_COLORS[o.status]}`}>{o.status}</span></td>
                    <td className="px-4 py-3">
                      {o.status === 'new' && <button onClick={() => updateStatus.mutate({ id: o.id, status: 'confirmed' })} className="px-2 py-1 bg-green-400/10 text-green-400 rounded font-inter text-xs">Confirm</button>}
                      {o.status === 'confirmed' && <button onClick={() => updateStatus.mutate({ id: o.id, status: 'preparing' })} className="px-2 py-1 bg-yellow-400/10 text-yellow-400 rounded font-inter text-xs">Prepare</button>}
                      {o.status === 'preparing' && <button onClick={() => updateStatus.mutate({ id: o.id, status: 'ready' })} className="px-2 py-1 bg-[#c9a962]/10 text-[#c9a962] rounded font-inter text-xs">Ready</button>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-white/30 font-inter text-sm">No marketplace orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-inter text-white font-semibold">Add Marketplace Order</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="font-inter text-xs text-white/50 mb-1 block">Platform</label>
                <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                  {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.label} {p.commission ? `(${p.commission}% fee)` : ''}</option>)}
                </select>
              </div>
              {[
                { key: 'platform_order_id', label: 'Platform Order ID' },
                { key: 'customer_name', label: 'Customer Name' },
                { key: 'customer_phone', label: 'Customer Phone' },
                { key: 'subtotal', label: 'Order Total (KSh)', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="font-inter text-xs text-white/50 mb-1 block">{f.label}</label>
                  <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
              ))}
              {form.subtotal && (
                <div className="col-span-2 p-3 bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-lg">
                  <p className="font-inter text-xs text-white/60">Commission: <span className="text-red-400">-KSh {Math.round((PLATFORMS.find(p=>p.id===form.platform)?.commission||0)/100 * +form.subtotal).toLocaleString()}</span></p>
                  <p className="font-inter text-xs text-white/60">Net Revenue: <span className="text-green-400">KSh {Math.round(+form.subtotal - (PLATFORMS.find(p=>p.id===form.platform)?.commission||0)/100 * +form.subtotal).toLocaleString()}</span></p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm">Cancel</button>
              <button onClick={() => create.mutate(form)} disabled={!form.customer_name || !form.subtotal || create.isPending}
                className="flex-1 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                {create.isPending ? 'Adding...' : 'Add Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}