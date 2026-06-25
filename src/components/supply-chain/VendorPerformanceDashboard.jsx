import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Package, Truck, Award, AlertTriangle, ChevronRight, X } from 'lucide-react';
import { formatKSh } from '@/lib/marketplace';

const STATUS_COLORS = {
  active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  suspended: 'text-red-400 bg-red-500/10 border-red-500/20',
  archived: 'text-white/40 bg-white/5 border-white/10',
};

export default function VendorPerformanceDashboard() {
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('rating');

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list('-created_date', 200),
  });
  const { data: products = [] } = useQuery({
    queryKey: ['supplier_products_all'],
    queryFn: () => base44.entities.SupplierProduct.list('-created_date', 500),
  });
  const { data: pos = [] } = useQuery({
    queryKey: ['purchase_orders_all'],
    queryFn: () => base44.entities.PurchaseOrder.list('-created_date', 500),
  });
  const { data: grns = [] } = useQuery({
    queryKey: ['grns_all'],
    queryFn: () => base44.entities.GoodsReceivedNote.list('-created_date', 500),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ['supplier_reviews_all'],
    queryFn: () => base44.entities.SupplierReview.filter({ status: 'published' }, '-created_date', 500),
  });

  // Build per-vendor metrics
  const vendorMetrics = useMemo(() => {
    return suppliers.map(s => {
      const sProducts = products.filter(p => p.supplier_id === s.id);
      const sPOs = pos.filter(po => po.supplier_id === s.id);
      const sGRNs = grns.filter(g => g.supplier_id === s.id);
      const sReviews = reviews.filter(r => r.supplier_id === s.id);

      // Fulfillment: compare PO items ordered vs GRN items received
      let orderedQty = 0, receivedQty = 0, rejectedQty = 0;
      sPOs.forEach(po => {
        (po.items || []).forEach(it => { orderedQty += Number(it.quantity) || 0; });
      });
      sGRNs.forEach(grn => {
        (grn.items || []).forEach(it => {
          receivedQty += Number(it.quantity_received) || 0;
          rejectedQty += Number(it.quantity_rejected) || 0;
        });
      });
      const fulfillmentRate = orderedQty > 0 ? Math.min(100, Math.round((receivedQty / orderedQty) * 100)) : 0;
      const rejectionRate = receivedQty > 0 ? Math.round((rejectedQty / (receivedQty + rejectedQty)) * 100) : 0;

      // On-time: delivered POs vs total closed/delivered
      const deliveredPOs = sPOs.filter(po => ['delivered', 'closed'].includes(po.status));
      const onTimeRate = sPOs.length > 0 ? Math.round((deliveredPOs.length / sPOs.length) * 100) : 0;

      // Revenue from POs
      const revenue = sPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0);

      // Avg rating from reviews
      const avgRating = sReviews.length > 0
        ? (sReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / sReviews.length)
        : (s.rating || 0);

      // Low stock products
      const lowStock = sProducts.filter(p => (p.stock_available || 0) <= (p.min_order_qty || 0) && p.status !== 'discontinued');

      // Composite performance score (0-100)
      const score = Math.round(
        (fulfillmentRate * 0.35) +
        (onTimeRate * 0.25) +
        (Math.min(5, avgRating) / 5 * 100 * 0.25) +
        ((100 - Math.min(100, rejectionRate * 2)) * 0.15)
      );

      return {
        ...s,
        productCount: sProducts.length,
        poCount: sPOs.length,
        grnCount: sGRNs.length,
        reviewCount: sReviews.length,
        avgRating: avgRating.toFixed(1),
        fulfillmentRate,
        onTimeRate,
        rejectionRate,
        revenue,
        lowStockCount: lowStock.length,
        score,
        _products: sProducts,
        _pos: sPOs,
        _grns: sGRNs,
        _reviews: sReviews,
      };
    });
  }, [suppliers, products, pos, grns, reviews]);

  const sorted = useMemo(() => {
    const arr = [...vendorMetrics];
    if (sortBy === 'rating') arr.sort((a, b) => Number(b.avgRating) - Number(a.avgRating));
    else if (sortBy === 'fulfillment') arr.sort((a, b) => b.fulfillmentRate - a.fulfillmentRate);
    else if (sortBy === 'revenue') arr.sort((a, b) => b.revenue - a.revenue);
    else if (sortBy === 'score') arr.sort((a, b) => b.score - a.score);
    return arr;
  }, [vendorMetrics, sortBy]);

  const topPerformer = sorted[0];
  const needsAttention = vendorMetrics.filter(v => v.score < 60 || v.lowStockCount > 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Vendors', value: suppliers.length, icon: Truck, color: 'text-[#c9a962]' },
          { label: 'Top Performer', value: topPerformer ? topPerformer.company_name.split(' ')[0] : '—', icon: Award, color: 'text-emerald-400' },
          { label: 'Avg Fulfillment', value: vendorMetrics.length ? Math.round(vendorMetrics.reduce((s, v) => s + v.fulfillmentRate, 0) / vendorMetrics.length) + '%' : '—', icon: Package, color: 'text-blue-400' },
          { label: 'Needs Attention', value: needsAttention.length, icon: AlertTriangle, color: 'text-orange-400' },
        ].map((s, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="font-playfair text-xl text-white truncate">{s.value}</p>
            <p className="font-inter text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-inter text-xs text-white/40">Sort by:</span>
        {[
          { id: 'score', label: 'Performance Score' },
          { id: 'rating', label: 'Avg Rating' },
          { id: 'fulfillment', label: 'Fulfillment Rate' },
          { id: 'revenue', label: 'Revenue' },
        ].map(opt => (
          <button key={opt.id} onClick={() => setSortBy(opt.id)}
            className={`px-3 py-1.5 rounded-lg font-inter text-xs transition-all ${sortBy === opt.id ? 'bg-[#c9a962] text-[#0a0a0a] font-semibold' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Vendor list */}
      <div className="space-y-3">
        {sorted.map((v, idx) => (
          <motion.div key={v.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
            onClick={() => setSelected(v)}
            className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-2xl p-5 cursor-pointer hover:border-[#c9a962]/30 transition-all">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#c9a962]/10 flex items-center justify-center shrink-0">
                  <span className="font-playfair text-lg text-[#c9a962]">{(v.company_name || '?')[0]}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-inter text-white font-semibold text-sm truncate">{v.company_name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[v.status] || STATUS_COLORS.archived}`}>{v.status}</span>
                    {idx === 0 && sortBy === 'score' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Top Performer</span>}
                  </div>
                  <p className="font-inter text-xs text-white/40 truncate">{v.contact_person} · {v.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                {/* Score */}
                <div className="text-center">
                  <p className="font-playfair text-2xl text-white">{v.score}</p>
                  <p className="font-inter text-[9px] text-white/40 uppercase">Score</p>
                </div>
                {/* Rating */}
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Star className="w-3 h-3 text-[#c9a962] fill-[#c9a962]" />
                    <p className="font-playfair text-lg text-white">{v.avgRating}</p>
                  </div>
                  <p className="font-inter text-[9px] text-white/40 uppercase">{v.reviewCount} reviews</p>
                </div>
                {/* Fulfillment */}
                <div className="text-center">
                  <p className="font-playfair text-lg text-white">{v.fulfillmentRate}%</p>
                  <p className="font-inter text-[9px] text-white/40 uppercase">Fulfillment</p>
                </div>
                {/* Revenue */}
                <div className="text-center">
                  <p className="font-playfair text-lg text-white">{formatKSh(v.revenue)}</p>
                  <p className="font-inter text-[9px] text-white/40 uppercase">Revenue</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </div>
            </div>

            {/* Mini progress bar for score */}
            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${v.score >= 80 ? 'bg-emerald-400' : v.score >= 60 ? 'bg-[#c9a962]' : 'bg-orange-400'}`} style={{ width: `${v.score}%` }} />
            </div>
            {v.lowStockCount > 0 && (
              <div className="mt-2 flex items-center gap-1 text-orange-400 font-inter text-xs">
                <AlertTriangle className="w-3 h-3" /> {v.lowStockCount} product(s) low on stock
              </div>
            )}
          </motion.div>
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-inter text-sm">No vendors yet</p>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <VendorDetailModal vendor={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function VendorDetailModal({ vendor, onClose }) {
  const v = vendor;
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#c9a962]/10 flex items-center justify-center">
              <span className="font-playfair text-2xl text-[#c9a962]">{(v.company_name || '?')[0]}</span>
            </div>
            <div>
              <h3 className="font-playfair text-xl text-white">{v.company_name}</h3>
              <p className="font-inter text-xs text-white/40">{v.contact_person} · {v.email}</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-white/40" /></button>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Performance Score', value: v.score, suffix: '/100', color: v.score >= 80 ? 'text-emerald-400' : v.score >= 60 ? 'text-[#c9a962]' : 'text-orange-400' },
            { label: 'Avg Rating', value: v.avgRating, suffix: '★', color: 'text-[#c9a962]' },
            { label: 'Fulfillment Rate', value: v.fulfillmentRate, suffix: '%', color: 'text-blue-400' },
            { label: 'On-Time Delivery', value: v.onTimeRate, suffix: '%', color: 'text-emerald-400' },
          ].map((m, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-center">
              <p className={`font-playfair text-2xl ${m.color}`}>{m.value}<span className="text-sm">{m.suffix}</span></p>
              <p className="font-inter text-[9px] text-white/40 uppercase mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Rejection rate + revenue */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3">
            <p className="font-inter text-xs text-white/40 mb-1">Rejection Rate</p>
            <p className="font-playfair text-lg text-white">{v.rejectionRate}%</p>
          </div>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3">
            <p className="font-inter text-xs text-white/40 mb-1">Total Revenue</p>
            <p className="font-playfair text-lg text-white">{formatKSh(v.revenue)}</p>
          </div>
        </div>

        {/* Fulfillment history (GRNs) */}
        <div className="mb-6">
          <h4 className="font-inter text-sm text-white/60 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-[#c9a962]" /> Fulfillment History ({v.grnCount})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {v._grns.map(grn => (
              <div key={grn.id} className="bg-[#0a0a0a] border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-inter text-xs text-white">{grn.po_number || 'PO'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${grn.status === 'complete' ? 'text-emerald-400 bg-emerald-500/10' : grn.status === 'partial' ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10'}`}>{grn.status}</span>
                </div>
                <p className="font-inter text-xs text-white/40">{grn.received_date} · by {grn.received_by || '—'}</p>
                {(grn.items || []).map((it, i) => (
                  <div key={i} className="flex justify-between font-inter text-xs text-white/60 mt-1">
                    <span>{it.item_name}</span>
                    <span>{it.quantity_received}/{it.quantity_ordered} {it.unit || ''}{it.quantity_rejected > 0 ? ` · ${it.quantity_rejected} rejected` : ''}</span>
                  </div>
                ))}
              </div>
            ))}
            {v._grns.length === 0 && <p className="font-inter text-xs text-white/30 py-4 text-center">No goods received yet</p>}
          </div>
        </div>

        {/* Recent reviews */}
        <div className="mb-6">
          <h4 className="font-inter text-sm text-white/60 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-[#c9a962]" /> Recent Reviews ({v.reviewCount})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {v._reviews.slice(0, 5).map(r => (
              <div key={r.id} className="bg-[#0a0a0a] border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-inter text-xs text-white">{r.reviewer_name}</span>
                  <span className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(n => <Star key={n} className={`w-3 h-3 ${n <= r.rating ? 'text-[#c9a962] fill-[#c9a962]' : 'text-white/10'}`} />)}
                  </span>
                </div>
                {r.review_text && <p className="font-inter text-xs text-white/50 italic">"{r.review_text}"</p>}
              </div>
            ))}
            {v._reviews.length === 0 && <p className="font-inter text-xs text-white/30 py-4 text-center">No reviews yet</p>}
          </div>
        </div>

        {/* Products summary */}
        <div>
          <h4 className="font-inter text-sm text-white/60 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#c9a962]" /> Products ({v.productCount})</h4>
          <div className="grid grid-cols-2 gap-2">
            {v._products.slice(0, 6).map(p => (
              <div key={p.id} className="bg-[#0a0a0a] border border-white/10 rounded-lg p-2">
                <p className="font-inter text-xs text-white truncate">{p.product_name}</p>
                <p className="font-inter text-[10px] text-white/40">Stock: {p.stock_available} {p.unit} · {formatKSh(p.unit_price)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}