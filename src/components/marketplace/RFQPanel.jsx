import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, X, Check, Send, MessageSquare } from 'lucide-react';
import { CATEGORIES, CAT_EMOJI, formatKSh } from '@/lib/marketplace';

const EMPTY_RFQ = { product_name: '', product_description: '', category: 'food', quantity: 1, unit: 'kg', delivery_date: '', notes: '', target_supplier_id: '', target_supplier_name: '' };
const EMPTY_QUOTE = { quoted_unit_price: 0, unit: 'kg', delivery_timeframe: '', valid_until: '', terms: '', notes: '' };

export default function RFQPanel({ mode, mySupplierId, mySupplier, buyerInfo }) {
  const [showForm, setShowForm] = useState(false);
  const [rfqForm, setRfqForm] = useState(EMPTY_RFQ);
  const [quoteForm, setQuoteForm] = useState(EMPTY_QUOTE);
  const [quotingRfqId, setQuotingRfqId] = useState(null);
  const [msg, setMsg] = useState(null);
  const qc = useQueryClient();

  const { data: rfqs = [] } = useQuery({
    queryKey: ['rfqs'],
    queryFn: () => base44.entities.RFQ.list('-created_date', 200),
  });
  const { data: quotes = [] } = useQuery({
    queryKey: ['rfq_quotes'],
    queryFn: () => base44.entities.RFQQuote.list('-created_date', 200),
  });

  const createRFQ = useMutation({
    mutationFn: (data) => base44.entities.RFQ.create({ ...data, status: 'open', buyer_name: buyerInfo?.name || '', buyer_email: buyerInfo?.email || '', buyer_phone: buyerInfo?.phone || '' }),
    onSuccess: () => { qc.invalidateQueries(['rfqs']); setShowForm(false); setRfqForm(EMPTY_RFQ); setMsg({ type: 'success', text: 'RFQ submitted. Suppliers will be notified.' }); },
  });

  const submitQuote = useMutation({
    mutationFn: (data) => base44.entities.RFQQuote.create({ ...data, status: 'submitted', supplier_id: mySupplierId, supplier_name: mySupplier?.company_name || '' }),
    onSuccess: () => {
      qc.invalidateQueries(['rfq_quotes']);
      const rfq = rfqs.find(r => r.id === quotingRfqId);
      if (rfq && rfq.status === 'open') base44.entities.RFQ.update(rfq.id, { status: 'quoted' });
      setQuotingRfqId(null); setQuoteForm(EMPTY_QUOTE);
      setMsg({ type: 'success', text: 'Quote submitted to buyer.' });
    },
  });

  const acceptQuote = useMutation({
    mutationFn: ({ id, rfqId }) => base44.entities.RFQQuote.update(id, { status: 'accepted' }).then(() => base44.entities.RFQ.update(rfqId, { status: 'accepted' })),
    onSuccess: () => { qc.invalidateQueries(['rfq_quotes']); qc.invalidateQueries(['rfqs']); setMsg({ type: 'success', text: 'Quote accepted. Supplier will be notified.' }); },
  });

  const myRFQs = mode === 'buyer' ? rfqs.filter(r => r.buyer_email === buyerInfo?.email) : [];
  const openRFQs = mode === 'supplier' ? rfqs.filter(r => r.status === 'open' && (!r.target_supplier_id || r.target_supplier_id === mySupplierId)) : [];
  const myQuotes = mode === 'supplier' ? quotes.filter(q => q.supplier_id === mySupplierId) : [];

  const quotingRfq = rfqs.find(r => r.id === quotingRfqId);

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-3 rounded-xl border font-inter text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-400/10 border-green-400/20 text-green-400' : 'bg-red-400/10 border-red-400/20 text-red-400'}`}>
            {msg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}{msg.text}
            <button onClick={() => setMsg(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buyer mode */}
      {mode === 'buyer' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-inter text-white font-semibold text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-[#c9a962]" /> Request for Quote</h3>
              <p className="text-white/40 font-inter text-xs mt-0.5">Request custom pricing for bulk or specialized orders</p>
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold">
              <Plus className="w-4 h-4" /> New RFQ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myRFQs.map(rfq => {
              const rfqQuotes = quotes.filter(q => q.rfq_id === rfq.id);
              return (
                <div key={rfq.id} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-inter text-white font-semibold text-sm">{rfq.product_name}</p>
                      <p className="font-inter text-xs text-white/40">{CAT_EMOJI[rfq.category]} {rfq.category} · {rfq.quantity} {rfq.unit}</p>
                    </div>
                    <span className={`font-inter text-[10px] px-2 py-0.5 rounded-full ${rfq.status === 'open' ? 'text-orange-400 bg-orange-400/10' : rfq.status === 'quoted' ? 'text-blue-400 bg-blue-400/10' : rfq.status === 'accepted' ? 'text-green-400 bg-green-400/10' : 'text-white/30 bg-white/5'}`}>{rfq.status}</span>
                  </div>
                  {rfq.product_description && <p className="font-inter text-xs text-white/50 mb-3">{rfq.product_description}</p>}
                  {rfq.delivery_date && <p className="font-inter text-xs text-white/40 mb-3">📅 Delivery by: {rfq.delivery_date}</p>}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <p className="font-inter text-xs text-white/40 uppercase tracking-wider">Quotes Received ({rfqQuotes.length})</p>
                    {rfqQuotes.map(q => (
                      <div key={q.id} className="flex items-center justify-between bg-[#0f0f0f] rounded-lg px-3 py-2">
                        <div>
                          <p className="font-inter text-xs text-white">{q.supplier_name}</p>
                          <p className="font-playfair text-sm text-[#c9a962]">{formatKSh(q.quoted_unit_price)} / {q.unit}</p>
                          {q.delivery_timeframe && <p className="font-inter text-[10px] text-white/40">⏱ {q.delivery_timeframe}</p>}
                        </div>
                        {q.status === 'submitted' && rfq.status !== 'accepted' && (
                          <button onClick={() => acceptQuote.mutate({ id: q.id, rfqId: rfq.id })}
                            className="px-3 py-1.5 bg-green-400/10 hover:bg-green-400/20 text-green-400 rounded-lg font-inter text-xs flex items-center gap-1">
                            <Check className="w-3 h-3" /> Accept
                          </button>
                        )}
                        {q.status === 'accepted' && <span className="text-[10px] text-green-400 font-inter">✓ Accepted</span>}
                      </div>
                    ))}
                    {rfqQuotes.length === 0 && <p className="font-inter text-xs text-white/30">No quotes yet.</p>}
                  </div>
                </div>
              );
            })}
            {myRFQs.length === 0 && !showForm && (
              <div className="col-span-2 py-12 text-center">
                <FileText className="w-10 h-10 text-white/10 mx-auto mb-2" />
                <p className="font-inter text-white/30 text-sm">No RFQs yet. Create one to get custom quotes.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Supplier mode */}
      {mode === 'supplier' && (
        <>
          <div>
            <h3 className="font-inter text-white font-semibold text-lg flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#c9a962]" /> Open RFQs to Quote</h3>
            <p className="text-white/40 font-inter text-xs mt-0.5">Submit competitive quotes on buyer requests</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openRFQs.map(rfq => {
              const alreadyQuoted = quotes.some(q => q.rfq_id === rfq.id && q.supplier_id === mySupplierId);
              return (
                <div key={rfq.id} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-inter text-white font-semibold text-sm">{rfq.product_name}</p>
                      <p className="font-inter text-xs text-white/40">{CAT_EMOJI[rfq.category]} {rfq.category} · {rfq.quantity} {rfq.unit}</p>
                    </div>
                    <span className="font-inter text-[10px] px-2 py-0.5 rounded-full text-orange-400 bg-orange-400/10">Open</span>
                  </div>
                  {rfq.product_description && <p className="font-inter text-xs text-white/50 mb-2">{rfq.product_description}</p>}
                  <p className="font-inter text-xs text-white/40 mb-1">👤 {rfq.buyer_name}</p>
                  {rfq.delivery_date && <p className="font-inter text-xs text-white/40 mb-3">📅 By: {rfq.delivery_date}</p>}
                  {alreadyQuoted ? (
                    <div className="pt-2 border-t border-white/5"><p className="font-inter text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Quote submitted</p></div>
                  ) : (
                    <button onClick={() => { setQuotingRfqId(rfq.id); setQuoteForm(EMPTY_QUOTE); }}
                      className="w-full mt-2 py-2 bg-[#c9a962]/10 hover:bg-[#c9a962]/20 text-[#c9a962] rounded-lg font-inter text-sm flex items-center justify-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Submit Quote
                    </button>
                  )}
                </div>
              );
            })}
            {openRFQs.length === 0 && <div className="col-span-2 py-8 text-center text-white/30 font-inter text-sm">No open RFQs to quote on right now.</div>}
          </div>

          {myQuotes.length > 0 && (
            <div className="pt-4">
              <h4 className="font-inter text-white font-semibold text-sm mb-3">My Submitted Quotes ({myQuotes.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {myQuotes.map(q => (
                  <div key={q.id} className="bg-[#1a1a1a] border border-white/5 rounded-xl p-3">
                    <p className="font-inter text-xs text-white/60 line-clamp-1">{q.rfq_product_name || 'RFQ'}</p>
                    <p className="font-playfair text-lg text-[#c9a962]">{formatKSh(q.quoted_unit_price)}</p>
                    <span className={`font-inter text-[10px] px-2 py-0.5 rounded-full ${q.status === 'accepted' ? 'text-green-400 bg-green-400/10' : q.status === 'rejected' ? 'text-red-400 bg-red-400/10' : 'text-white/40 bg-white/5'}`}>{q.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* RFQ Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-inter text-white font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-[#c9a962]" /> New Request for Quote</h3>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Product / Item Name</label>
                  <input value={rfqForm.product_name} onChange={e => setRfqForm(p => ({ ...p, product_name: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Description / Specifications</label>
                  <textarea value={rfqForm.product_description} onChange={e => setRfqForm(p => ({ ...p, product_description: e.target.value }))} rows={2}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Category</label>
                  <select value={rfqForm.category} onChange={e => setRfqForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Unit</label>
                  <input value={rfqForm.unit} onChange={e => setRfqForm(p => ({ ...p, unit: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Quantity</label>
                  <input type="number" min={1} value={rfqForm.quantity} onChange={e => setRfqForm(p => ({ ...p, quantity: +e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Delivery Date</label>
                  <input type="date" value={rfqForm.delivery_date} onChange={e => setRfqForm(p => ({ ...p, delivery_date: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Notes (optional)</label>
                  <textarea value={rfqForm.notes} onChange={e => setRfqForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm hover:bg-white/5">Cancel</button>
                <button onClick={() => createRFQ.mutate(rfqForm)} disabled={createRFQ.isPending || !rfqForm.product_name}
                  className="flex-1 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                  {createRFQ.isPending ? 'Submitting...' : 'Submit RFQ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quote Form Modal */}
      <AnimatePresence>
        {quotingRfq && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-inter text-white font-semibold flex items-center gap-2"><Send className="w-5 h-5 text-[#c9a962]" /> Submit Quote</h3>
                  <p className="font-inter text-xs text-white/40 mt-1">For: {quotingRfq.product_name} ({quotingRfq.quantity} {quotingRfq.unit})</p>
                </div>
                <button onClick={() => setQuotingRfqId(null)}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Quoted Unit Price (KSh)</label>
                  <input type="number" min={0} value={quoteForm.quoted_unit_price} onChange={e => setQuoteForm(p => ({ ...p, quoted_unit_price: +e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Unit</label>
                  <input value={quoteForm.unit} onChange={e => setQuoteForm(p => ({ ...p, unit: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Delivery Timeframe</label>
                  <input value={quoteForm.delivery_timeframe} onChange={e => setQuoteForm(p => ({ ...p, delivery_timeframe: e.target.value }))} placeholder="e.g. 3-5 days"
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Valid Until</label>
                  <input type="date" value={quoteForm.valid_until} onChange={e => setQuoteForm(p => ({ ...p, valid_until: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Terms (optional)</label>
                  <input value={quoteForm.terms} onChange={e => setQuoteForm(p => ({ ...p, terms: e.target.value }))} placeholder="e.g. Net 30, 50% upfront"
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Notes (optional)</label>
                  <textarea value={quoteForm.notes} onChange={e => setQuoteForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setQuotingRfqId(null)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm hover:bg-white/5">Cancel</button>
                <button onClick={() => submitQuote.mutate({ ...quoteForm, rfq_id: quotingRfq.id, rfq_product_name: quotingRfq.product_name })}
                  disabled={submitQuote.isPending || !quoteForm.quoted_unit_price}
                  className="flex-1 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                  {submitQuote.isPending ? 'Sending...' : 'Send Quote'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}