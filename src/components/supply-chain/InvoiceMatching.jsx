import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const STATUS_COLORS = {
  pending_review: 'text-yellow-400 bg-yellow-400/10',
  approved: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
  paid: 'text-[#c9a962] bg-[#c9a962]/10',
  overdue: 'text-red-500 bg-red-500/10',
};
const MATCH_COLORS = { matched: 'text-green-400', discrepancy: 'text-red-400', pending: 'text-yellow-400' };
const EMPTY = { invoice_number: '', supplier_id: '', supplier_name: '', po_id: '', po_number: '', grn_id: '', amount: '', due_date: '', discrepancy_notes: '' };

export default function InvoiceMatching() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();

  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: () => base44.entities.SupplierInvoice.list('-created_date', 100) });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => base44.entities.Supplier.list() });
  const { data: pos = [] } = useQuery({ queryKey: ['purchase-orders'], queryFn: () => base44.entities.PurchaseOrder.list() });
  const { data: grns = [] } = useQuery({ queryKey: ['grns'], queryFn: () => base44.entities.GoodsReceivedNote.list() });

  const create = useMutation({
    mutationFn: (data) => {
      const po = pos.find(p => p.id === data.po_id);
      const grn = grns.find(g => g.id === data.grn_id);
      let match_status = 'pending';
      if (po && grn) {
        const amountMatch = Math.abs((po.total_amount||0) - (+data.amount)) < 1;
        match_status = amountMatch ? 'matched' : 'discrepancy';
      }
      return base44.entities.SupplierInvoice.create({ ...data, amount: +data.amount, match_status, status: 'pending_review' });
    },
    onSuccess: () => { qc.invalidateQueries(['invoices']); setShowForm(false); setForm(EMPTY); }
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.SupplierInvoice.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(['invoices']),
  });

  const filtered = invoices.filter(inv => statusFilter === 'all' || inv.status === statusFilter);
  const totalOutstanding = invoices.filter(i => ['pending_review','approved'].includes(i.status)).reduce((s,i)=>s+(i.amount||0),0);
  const overdue = invoices.filter(i => i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-inter text-white font-semibold text-lg">Invoice Matching & AP</h3>
          <p className="text-white/40 font-inter text-xs mt-0.5">3-way match: PO + GRN + Invoice</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90">
          <Plus className="w-4 h-4" /> Add Invoice
        </button>
      </div>

      {/* AP Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Outstanding', value: `KSh ${totalOutstanding.toLocaleString()}`, color: 'text-yellow-400' },
          { label: 'Overdue', value: overdue.length, color: 'text-red-400' },
          { label: 'Total Invoices', value: invoices.length, color: 'text-white' },
          { label: 'Paid This Month', value: invoices.filter(i=>i.status==='paid').length, color: 'text-green-400' },
        ].map((s,i)=>(
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <p className={`font-inter text-lg font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-white/40 font-inter text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all','pending_review','approved','paid','rejected','overdue'].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg font-inter text-xs capitalize transition-all ${statusFilter===s?'bg-[#c9a962] text-[#0a0a0a]':'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>
            {s.replace('_',' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5">{['Invoice #','Supplier','PO #','Amount','Due Date','Match','Status','Actions'].map(h=>(
              <th key={h} className="px-4 py-3 text-left font-inter text-xs text-white/40 uppercase tracking-wider">{h}</th>
            ))}</tr></thead>
            <tbody>
              {filtered.map(inv=>(
                <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                  <td className="px-4 py-3 font-inter text-sm text-[#c9a962]">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-inter text-sm text-white">{inv.supplier_name}</td>
                  <td className="px-4 py-3 font-inter text-sm text-white/60">{inv.po_number||'—'}</td>
                  <td className="px-4 py-3 font-inter text-sm text-white font-semibold">KSh {(inv.amount||0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-inter text-sm text-white/60">{inv.due_date||'—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-inter text-xs font-semibold capitalize ${MATCH_COLORS[inv.match_status]}`}>{inv.match_status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-inter text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[inv.status]}`}>{inv.status?.replace('_',' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {inv.status === 'pending_review' && (
                        <>
                          <button onClick={()=>updateStatus.mutate({id:inv.id,status:'approved'})} className="p-1 hover:bg-green-400/10 rounded" title="Approve"><CheckCircle className="w-4 h-4 text-green-400" /></button>
                          <button onClick={()=>updateStatus.mutate({id:inv.id,status:'rejected'})} className="p-1 hover:bg-red-400/10 rounded" title="Reject"><X className="w-4 h-4 text-red-400" /></button>
                        </>
                      )}
                      {inv.status === 'approved' && (
                        <button onClick={()=>updateStatus.mutate({id:inv.id,status:'paid'})} className="px-2 py-1 bg-[#c9a962]/10 text-[#c9a962] rounded font-inter text-xs hover:bg-[#c9a962]/20">Mark Paid</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-white/30 font-inter text-sm">No invoices found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-inter text-white font-semibold">Add Invoice</h3>
              <button onClick={()=>setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Invoice Number</label>
                <input value={form.invoice_number} onChange={e=>setForm(p=>({...p,invoice_number:e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Amount (KSh)</label>
                <input type="number" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
              <div className="col-span-2">
                <label className="font-inter text-xs text-white/50 mb-1 block">Supplier</label>
                <select value={form.supplier_id} onChange={e=>{const s=suppliers.find(s=>s.id===e.target.value);setForm(p=>({...p,supplier_id:e.target.value,supplier_name:s?.company_name||''}));}}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                  <option value="">Select supplier...</option>
                  {suppliers.map(s=><option key={s.id} value={s.id}>{s.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Link to PO (optional)</label>
                <select value={form.po_id} onChange={e=>{const p=pos.find(p=>p.id===e.target.value);setForm(prev=>({...prev,po_id:e.target.value,po_number:p?.po_number||''}));}}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                  <option value="">None</option>
                  {pos.map(p=><option key={p.id} value={p.id}>{p.po_number}</option>)}
                </select>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Link to GRN (optional)</label>
                <select value={form.grn_id} onChange={e=>setForm(p=>({...p,grn_id:e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                  <option value="">None</option>
                  {grns.map(g=><option key={g.id} value={g.id}>{g.po_number} - {g.received_date}</option>)}
                </select>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Due Date</label>
                <input type="date" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowForm(false)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm">Cancel</button>
              <button onClick={()=>create.mutate(form)} disabled={!form.invoice_number||!form.amount||create.isPending}
                className="flex-1 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                {create.isPending?'Adding...':'Add Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}