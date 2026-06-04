import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

const STATUS_COLORS = { success: 'text-green-400 bg-green-400/10', failed: 'text-red-400 bg-red-400/10', pending: 'text-yellow-400 bg-yellow-400/10', cancelled: 'text-white/40 bg-white/5', refunded: 'text-blue-400 bg-blue-400/10' };
const PAYMENT_TYPES = ['stk_push', 'paybill', 'till', 'b2c_refund'];
const REF_TYPES = ['order', 'reservation', 'room', 'event', 'other'];

const EMPTY = { phone: '', customer_name: '', amount: '', payment_type: 'stk_push', reference: '', reference_type: 'order', transaction_id: '', mpesa_receipt: '', transaction_date: new Date().toISOString().split('T')[0] };

export default function MpesaDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const qc = useQueryClient();

  const { data: txns = [] } = useQuery({ queryKey: ['mpesa-txns'], queryFn: () => base44.entities.MpesaTransaction.list('-created_date', 500) });

  const create = useMutation({
    mutationFn: (data) => base44.entities.MpesaTransaction.create({ ...data, amount: +data.amount, status: 'pending' }),
    onSuccess: () => { qc.invalidateQueries(['mpesa-txns']); setShowForm(false); setForm(EMPTY); }
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.MpesaTransaction.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(['mpesa-txns']),
  });

  const filtered = txns.filter(t => (statusFilter === 'all' || t.status === statusFilter) && (typeFilter === 'all' || t.payment_type === typeFilter));

  const totalSuccess = txns.filter(t => t.status === 'success').reduce((s, t) => s + (t.amount || 0), 0);
  const totalPending = txns.filter(t => t.status === 'pending').reduce((s, t) => s + (t.amount || 0), 0);
  const totalFailed = txns.filter(t => t.status === 'failed').length;
  const today = txns.filter(t => t.transaction_date === new Date().toISOString().split('T')[0] && t.status === 'success').reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📱</span>
          <div>
            <h3 className="font-inter text-white font-semibold text-lg">M-Pesa Daraja API</h3>
            <p className="text-white/40 font-inter text-xs">STK Push, Paybill & Till payment tracking</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-inter text-sm font-semibold hover:bg-green-700">
          <Plus className="w-4 h-4" /> Log Transaction
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Collected', value: `KSh ${totalSuccess.toLocaleString()}`, color: 'text-green-400' },
          { label: "Today's Collections", value: `KSh ${today.toLocaleString()}`, color: 'text-[#c9a962]' },
          { label: 'Pending', value: `KSh ${totalPending.toLocaleString()}`, color: 'text-yellow-400' },
          { label: 'Failed Transactions', value: totalFailed, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <p className={`font-inter text-xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-white/40 font-inter text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* STK Push Simulation */}
      <div className="bg-[#1a1a1a] border border-green-400/20 rounded-xl p-5">
        <h4 className="font-inter text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> STK Push Checkout Flow
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {['Customer places order', 'STK Push sent to phone', 'Customer enters M-Pesa PIN', 'M-Pesa confirms payment', 'Order confirmed ✓'].map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-green-400 font-inter text-xs font-semibold">{i + 1}</span>
              </div>
              <p className="text-white/50 font-inter text-xs">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#c9a962]/10 rounded-lg p-1">
          {['all', 'success', 'pending', 'failed', 'refunded'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-md font-inter text-xs capitalize transition-all ${statusFilter === s ? 'bg-[#c9a962] text-[#0a0a0a]' : 'text-white/50'}`}>{s}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#c9a962]/10 rounded-lg p-1">
          {['all', ...PAYMENT_TYPES].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1 rounded-md font-inter text-xs capitalize transition-all ${typeFilter === t ? 'bg-[#c9a962] text-[#0a0a0a]' : 'text-white/50'}`}>{t.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5">{['Date', 'Customer', 'Phone', 'Amount', 'Type', 'Reference', 'Receipt', 'Status', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-inter text-xs text-white/40 uppercase tracking-wider">{h}</th>
            ))}</tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-inter text-xs text-white/60">{t.transaction_date}</td>
                  <td className="px-4 py-3 font-inter text-xs text-white">{t.customer_name || '—'}</td>
                  <td className="px-4 py-3 font-inter text-xs text-white/60">{t.phone}</td>
                  <td className="px-4 py-3 font-inter text-xs text-white font-semibold">KSh {(t.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-inter text-xs text-white/50 capitalize">{t.payment_type?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-inter text-xs text-white/50">{t.reference || '—'}</td>
                  <td className="px-4 py-3 font-inter text-xs text-[#c9a962]">{t.mpesa_receipt || '—'}</td>
                  <td className="px-4 py-3"><span className={`font-inter text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[t.status]}`}>{t.status}</span></td>
                  <td className="px-4 py-3">
                    {t.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => updateStatus.mutate({ id: t.id, status: 'success' })} className="p-1 hover:bg-green-400/10 rounded"><CheckCircle className="w-4 h-4 text-green-400" /></button>
                        <button onClick={() => updateStatus.mutate({ id: t.id, status: 'failed' })} className="p-1 hover:bg-red-400/10 rounded"><XCircle className="w-4 h-4 text-red-400" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-white/30 font-inter text-sm">No transactions found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-inter text-white font-semibold">Log M-Pesa Transaction</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'customer_name', label: 'Customer Name' },
                { key: 'phone', label: 'Phone (+254...)' },
                { key: 'amount', label: 'Amount (KSh)', type: 'number' },
                { key: 'mpesa_receipt', label: 'M-Pesa Receipt' },
                { key: 'reference', label: 'Reference (e.g. Order #)' },
                { key: 'transaction_date', label: 'Date', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label className="font-inter text-xs text-white/50 mb-1 block">{f.label}</label>
                  <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
              ))}
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Payment Type</label>
                <select value={form.payment_type} onChange={e => setForm(p => ({ ...p, payment_type: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                  {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Reference Type</label>
                <select value={form.reference_type} onChange={e => setForm(p => ({ ...p, reference_type: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                  {REF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm">Cancel</button>
              <button onClick={() => create.mutate(form)} disabled={!form.phone || !form.amount || create.isPending}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                {create.isPending ? 'Logging...' : 'Log Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}