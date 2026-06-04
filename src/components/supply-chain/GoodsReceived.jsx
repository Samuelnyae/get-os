import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, PackageCheck } from 'lucide-react';

const STATUS_COLORS = { complete: 'text-green-400 bg-green-400/10', partial: 'text-yellow-400 bg-yellow-400/10', rejected: 'text-red-400 bg-red-400/10' };

export default function GoodsReceived() {
  const [showForm, setShowForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [grnItems, setGrnItems] = useState([]);
  const qc = useQueryClient();

  const { data: grns = [] } = useQuery({ queryKey: ['grns'], queryFn: () => base44.entities.GoodsReceivedNote.list('-created_date', 100) });
  const { data: pos = [] } = useQuery({ queryKey: ['purchase-orders'], queryFn: () => base44.entities.PurchaseOrder.list() });

  const deliveredPOs = pos.filter(p => p.status === 'confirmed' || p.status === 'sent');

  const createGRN = useMutation({
    mutationFn: () => {
      const allReceived = grnItems.every(i => i.quantity_received >= i.quantity_ordered);
      const anyRejected = grnItems.some(i => i.quantity_rejected > 0);
      const status = allReceived ? 'complete' : anyRejected ? 'rejected' : 'partial';
      return base44.entities.GoodsReceivedNote.create({
        po_id: selectedPO.id,
        po_number: selectedPO.po_number,
        supplier_id: selectedPO.supplier_id,
        supplier_name: selectedPO.supplier_name,
        received_date: new Date().toISOString().split('T')[0],
        received_by: receivedBy,
        items: grnItems,
        status,
        notes,
      });
    },
    onSuccess: async () => {
      await base44.entities.PurchaseOrder.update(selectedPO.id, { status: 'delivered' });
      qc.invalidateQueries(['grns']);
      qc.invalidateQueries(['purchase-orders']);
      setShowForm(false);
      setSelectedPO(null);
      setGrnItems([]);
    }
  });

  const loadPO = (po) => {
    setSelectedPO(po);
    setGrnItems((po.items || []).map(i => ({
      item_name: i.item_name,
      quantity_ordered: i.quantity,
      quantity_received: i.quantity,
      quantity_rejected: 0,
      rejection_reason: '',
    })));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-inter text-white font-semibold text-lg">Goods Received Notes (GRN)</h3>
          <p className="text-white/40 font-inter text-xs mt-0.5">{grns.length} total GRNs recorded</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90">
          <Plus className="w-4 h-4" /> Receive Goods
        </button>
      </div>

      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5">{['GRN Date','PO Number','Supplier','Received By','Status','Items'].map(h=>(
              <th key={h} className="px-4 py-3 text-left font-inter text-xs text-white/40 uppercase tracking-wider">{h}</th>
            ))}</tr></thead>
            <tbody>
              {grns.map(grn => (
                <tr key={grn.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                  <td className="px-4 py-3 font-inter text-sm text-white">{grn.received_date}</td>
                  <td className="px-4 py-3 font-inter text-sm text-[#c9a962]">{grn.po_number}</td>
                  <td className="px-4 py-3 font-inter text-sm text-white">{grn.supplier_name}</td>
                  <td className="px-4 py-3 font-inter text-sm text-white/60">{grn.received_by||'—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-inter text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[grn.status]}`}>{grn.status}</span>
                  </td>
                  <td className="px-4 py-3 font-inter text-sm text-white/60">{grn.items?.length||0} items</td>
                </tr>
              ))}
              {grns.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-white/30 font-inter text-sm">No GRNs recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-inter text-white font-semibold">Receive Goods</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>

            {!selectedPO ? (
              <div>
                <p className="text-white/50 font-inter text-sm mb-3">Select a confirmed Purchase Order:</p>
                {deliveredPOs.length === 0 ? (
                  <p className="text-white/30 font-inter text-sm text-center py-8">No confirmed POs awaiting delivery.</p>
                ) : (
                  <div className="space-y-2">
                    {deliveredPOs.map(po => (
                      <button key={po.id} onClick={() => loadPO(po)}
                        className="w-full flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#c9a962]/10 hover:border-[#c9a962]/40 rounded-xl transition-all text-left">
                        <div>
                          <p className="font-inter text-sm text-[#c9a962]">{po.po_number}</p>
                          <p className="font-inter text-xs text-white/50">{po.supplier_name} · {po.items?.length||0} items</p>
                        </div>
                        <span className="font-inter text-xs text-white/30">Select →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="p-3 bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl mb-4">
                  <p className="text-[#c9a962] font-inter text-sm font-semibold">{selectedPO.po_number}</p>
                  <p className="text-white/50 font-inter text-xs">{selectedPO.supplier_name}</p>
                </div>

                <div className="mb-4">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Received By</label>
                  <input value={receivedBy} onChange={e=>setReceivedBy(e.target.value)} placeholder="Staff name"
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>

                <p className="font-inter text-xs text-white/50 mb-2">Verify Items Received</p>
                {grnItems.map((item, i) => (
                  <div key={i} className="bg-[#0a0a0a] rounded-xl p-3 mb-2">
                    <p className="font-inter text-sm text-white mb-2">{item.item_name} <span className="text-white/30 text-xs">(ordered: {item.quantity_ordered})</span></p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-inter text-xs text-white/40 mb-1 block">Qty Received</label>
                        <input type="number" value={item.quantity_received} onChange={e => {
                          const upd = [...grnItems]; upd[i].quantity_received = +e.target.value; setGrnItems(upd);
                        }} className="w-full bg-[#1a1a1a] border border-[#c9a962]/20 text-white rounded-lg px-2 py-1.5 font-inter text-sm" />
                      </div>
                      <div>
                        <label className="font-inter text-xs text-white/40 mb-1 block">Qty Rejected</label>
                        <input type="number" value={item.quantity_rejected} onChange={e => {
                          const upd = [...grnItems]; upd[i].quantity_rejected = +e.target.value; setGrnItems(upd);
                        }} className="w-full bg-[#1a1a1a] border border-red-400/20 text-red-400 rounded-lg px-2 py-1.5 font-inter text-sm" />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mb-4">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Notes / Damages</label>
                  <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setSelectedPO(null)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm">Back</button>
                  <button onClick={() => createGRN.mutate()} disabled={createGRN.isPending}
                    className="flex-1 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                    {createGRN.isPending ? 'Recording...' : 'Confirm Receipt'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}