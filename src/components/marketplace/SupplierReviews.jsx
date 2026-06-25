import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Check } from 'lucide-react';

export default function SupplierReviews({ supplierId, supplierName }) {
  const [form, setForm] = useState({ reviewer_name: '', reviewer_email: '', rating: 5, review_text: '', order_ref: '' });
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState(null);
  const qc = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['supplier_reviews', supplierId],
    queryFn: () => base44.entities.SupplierReview.filter({ supplier_id: supplierId, status: 'published' }, '-created_date', 50),
    enabled: !!supplierId,
  });

  const submitReview = useMutation({
    mutationFn: (data) => base44.entities.SupplierReview.create({ ...data, supplier_id: supplierId, supplier_name: supplierName, status: 'published' }),
    onSuccess: () => {
      qc.invalidateQueries(['supplier_reviews', supplierId]);
      setForm({ reviewer_name: '', reviewer_email: '', rating: 5, review_text: '', order_ref: '' });
      setShowForm(false);
      setMsg({ type: 'success', text: 'Review submitted.' });
    },
  });

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;
  const dist = [5, 4, 3, 2, 1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-inter text-white font-semibold text-sm flex items-center gap-2"><Star className="w-4 h-4 text-[#c9a962]" /> Ratings & Reviews</h4>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-[#c9a962]/10 hover:bg-[#c9a962]/20 text-[#c9a962] rounded-lg font-inter text-xs">
          {showForm ? 'Cancel' : 'Write Review'}
        </button>
      </div>

      {/* Aggregate */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-6 bg-[#0f0f0f] rounded-xl p-4">
          <div className="text-center">
            <p className="font-playfair text-3xl text-[#c9a962]">{avgRating}</p>
            <div className="flex justify-center gap-0.5 my-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(avgRating) ? 'text-[#c9a962] fill-[#c9a962]' : 'text-white/20'}`} />
              ))}
            </div>
            <p className="font-inter text-[10px] text-white/40">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-1">
            {dist.map(d => (
              <div key={d.star} className="flex items-center gap-2">
                <span className="font-inter text-xs text-white/40 w-3">{d.star}</span>
                <Star className="w-3 h-3 text-white/20" />
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#c9a962]" style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }} />
                </div>
                <span className="font-inter text-xs text-white/30 w-5">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-inter text-xs text-white/50 mb-1 block">Your Name</label>
              <input value={form.reviewer_name} onChange={e => setForm(p => ({ ...p, reviewer_name: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
            </div>
            <div>
              <label className="font-inter text-xs text-white/50 mb-1 block">Email</label>
              <input value={form.reviewer_email} onChange={e => setForm(p => ({ ...p, reviewer_email: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
            </div>
          </div>
          <div>
            <label className="font-inter text-xs text-white/50 mb-1 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setForm(p => ({ ...p, rating: s }))}>
                  <Star className={`w-6 h-6 ${s <= form.rating ? 'text-[#c9a962] fill-[#c9a962]' : 'text-white/20'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-inter text-xs text-white/50 mb-1 block">Review</label>
            <textarea value={form.review_text} onChange={e => setForm(p => ({ ...p, review_text: e.target.value }))} rows={3}
              className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
          </div>
          <button onClick={() => submitReview.mutate(form)} disabled={submitReview.isPending || !form.reviewer_name}
            className="px-5 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
            {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
          </button>
          {msg && <p className="font-inter text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> {msg.text}</p>}
        </motion.div>
      )}

      {/* Review list */}
      <div className="space-y-3">
        {reviews.map(r => (
          <div key={r.id} className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-inter text-sm text-white font-semibold">{r.reviewer_name}</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-[#c9a962] fill-[#c9a962]' : 'text-white/20'}`} />
                ))}
              </div>
            </div>
            {r.review_text && <p className="font-inter text-sm text-white/60 leading-relaxed">{r.review_text}</p>}
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="py-6 text-center">
            <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="font-inter text-white/30 text-sm">No reviews yet. Be the first to review.</p>
          </div>
        )}
      </div>
    </div>
  );
}