import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, ChevronRight, X, Trash2, FileText } from 'lucide-react';

const STATUSES = ['draft', 'pending_approval', 'approved', 'sent', 'confirmed', 'delivered', 'closed', 'cancelled'];
const STATUS_COLORS = {
  draft: 'bg-white/10 text-white/60',
  pending_approval: 'bg-yellow-400/10 text-yellow-400',
  approved: 'bg-green-400/10 text-green-400',
  sent: 'bg-blue-400/10 text-blue-400',
  confirmed: 'bg-purple-400/10 text-purple-400',
  delivered: 'bg-[#c9a962]/10 text-[#c9a962]',
  closed: 'bg-white/5 text-white/30',
  cancelled: 'bg-red-400/10 text-red-400',
};
const FLOW = ['draft', 'pending_approval', 'approved', 'sent', 'confirmed', 'delivered', 'closed'];
const EMPTY_ITEM = { item_name: '', quantity: 1, unit: 'kg', unit_price: 0, total: 0 };

export default function PurchaseOrders() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ supplier_id: '', supplier_name: '', delivery_date: '', notes: '', requested_by: '', items: [{ ...EMPTY_ITEM }] });
  const qc = useQueryClient();

  const { data: pos = [] } = useQuery({ queryKey: ['purchase-orders'], queryFn: () => base44.entities.PurchaseOrder.list('-created_date', 200) });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => base44.entities.Supplier.list() });

  const createPO = useMutation({
    mutationFn: (data) => {
      const total = data.items.reduce((s, i) => s + (i.total || 0), 0);
      const po_number = `PO-${Date.now().toString().slice(-6)}`;
      return base44.entities.PurchaseOrder.create({ ...data, po_number, total_amount: total, status: 'draft' });
    },
    onSuccess: () => { qc.invalidateQueries(['purchase-orders']); setShowForm(false); }
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PurchaseOrder.update(id, { status }),
    onSuccess: () => { qc.invalidateQueries(['purchase-orders']); setSelected(null); }
  });

  const filtered = pos.filter(p => statusFilter === 'all' || p.status === statusFilter);

  const updateItem = (idx, key, val) => {
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [key]: val };
      if (key === 'quantity' || key === 'unit_price') {
        items[idx].total = (key === 'quantity' ? val : items[idx].quantity) * (key === 'unit_price' ? val : items[idx].unit_price);
      }
      return { ...prev, items };
    });
  };

  const nextStatus = (current) => {
    const idx = FLOW.indexOf(current);
    return idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-inter text-white font-semibold text-lg">Purchase Orders</h3>
          <p className="text-white/40 font-inter text-xs mt-0.5">{pos.filter(p => ['pending_approval','approved','sent'].includes(p.status)).length} active POs</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90">
          <Plus className="w-4 h-4" /> Create PO
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg font-inter text-xs capitalize transition-all ${statusFilter === s ? 'bg-[#c9a962] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* PO Table */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['PO Number', 'Supplier', 'Items', 'Total', 'Delivery', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-inter text-xs text-white/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(po => (
                <tr key={po.id} className="border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer" onClick={() => setSelected(po)}>
                  <td className="px-4 py-3 font-inter text-sm text-[#c9a962]">{po.po_number}</td>
                  <td className="px-4 py-3 font-inter text-sm text-white">{po.supplier_name}</td>
                  <td className="px-4 py-3 font-inter text-sm text-white/60">{po.items?.length || 0} items</td>
                  <td className="px-4 py-3 font-inter text-sm text-white">KSh {(po.total_amount||0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-inter text-sm text-white/60">{po.delivery_date || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-inter text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[po.status]}`}>{po.status?.replace('_',' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-white/30 font-inter text-sm">No purchase orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-inter text-white font-semibold">{selected.po_number}</h3>
                <span className={`font-inter text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[selected.status]}`}>{selected.status?.replace('_',' ')}</span>
              </div>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-white/40" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm font-inter">
              <div><span className="text-white/40">Supplier:</span> <span className="text-white ml-2">{selected.supplier_name}</span></div>
              <div><span className="text-white/40">Delivery:</span> <span className="text-white ml-2">{selected.delivery_date||'—'}</span></div>
              <div><span className="text-white/40">Requested by:</span> <span className="text-white ml-2">{selected.requested_by||'—'}</span></div>
              <div><span className="text-white/40">Total:</span> <span className="text-[#c9a962] ml-2 font-semibold">KSh {(selected.total_amount||0).toLocaleString()}</span></div>
            </div>

            <div className="bg-[#0a0a0a] rounded-xl overflow-hidden mb-4">
              <table className="w-full">
                <thead><tr className="border-b border-white/5">{['Item','Qty','Unit','Unit Price','Total'].map(h=><th key={h} className="px-3 py-2 text-left font-inter text-xs text-white/40">{h}</th>)}</tr></thead>
                <tbody>
                  {(selected.items||[]).map((item,i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-3 py-2 font-inter text-xs text-white">{item.item_name}</td>
                      <td className="px-3 py-2 font-inter text-xs text-white/70">{item.quantity}</td>
                      <td className="px-3 py-2 font-inter text-xs text-white/70">{item.unit}</td>
                      <td className="px-3 py-2 font-inter text-xs text-white/70">KSh {(item.unit_price||0).toLocaleString()}</td>
                      <td className="px-3 py-2 font-inter text-xs text-[#c9a962]">KSh {(item.total||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected.notes && <p className="text-white/50 font-inter text-xs mb-4">Notes: {selected.notes}</p>}

            {nextStatus(selected.status) && (
              <button onClick={() => updateStatus.mutate({ id: selected.id, status: nextStatus(selected.status) })}
                className="w-full py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90 capitalize">
                Advance to: {nextStatus(selected.status)?.replace('_',' ')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-inter text-white font-semibold">New Purchase Order</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <label className="font-inter text-xs text-white/50 mb-1 block">Supplier</label>
                <select value={form.supplier_id} onChange={e => {
                  const s = suppliers.find(s => s.id === e.target.value);
                  setForm(p => ({ ...p, supplier_id: e.target.value, supplier_name: s?.company_name || '' }));
                }} className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                  <option value="">Select supplier...</option>
                  {suppliers.filter(s=>s.status==='active').map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Delivery Date</label>
                <input type="date" value={form.delivery_date} onChange={e => setForm(p=>({...p, delivery_date: e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Requested By</label>
                <input value={form.requested_by} onChange={e => setForm(p=>({...p, requested_by: e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="font-inter text-xs text-white/50">Items</label>
                <button onClick={() => setForm(p=>({...p, items: [...p.items, {...EMPTY_ITEM}]}))} className="text-[#c9a962] font-inter text-xs hover:underline">+ Add Item</button>
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 mb-2 items-center">
                  <input placeholder="Item name" value={item.item_name} onChange={e => updateItem(idx,'item_name',e.target.value)}
                    className="col-span-2 bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-2 py-1.5 font-inter text-xs" />
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx,'quantity',+e.target.value)}
                    className="bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-2 py-1.5 font-inter text-xs" />
                  <input type="number" placeholder="Unit Price" value={item.unit_price} onChange={e => updateItem(idx,'unit_price',+e.target.value)}
                    className="bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-2 py-1.5 font-inter text-xs" />
                  <div className="flex items-center gap-1">
                    <span className="text-white/50 font-inter text-xs">{(item.total||0).toLocaleString()}</span>
                    {form.items.length > 1 && <button onClick={() => setForm(p=>({...p, items: p.items.filter((_,i)=>i!==idx)}))}><Trash2 className="w-3 h-3 text-red-400" /></button>}
                  </div>
                </div>
              ))}
              <div className="text-right">
                <span className="font-inter text-sm text-[#c9a962] font-semibold">Total: KSh {form.items.reduce((s,i)=>s+(i.total||0),0).toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="font-inter text-xs text-white/50 mb-1 block">Notes</label>
              <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2}
                className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm">Cancel</button>
              <button onClick={() => createPO.mutate(form)} disabled={!form.supplier_id || createPO.isPending}
                className="flex-1 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                {createPO.isPending ? 'Creating...' : 'Create PO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}