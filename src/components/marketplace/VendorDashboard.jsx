import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Package, RefreshCw, ShoppingBag, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { formatKSh } from '@/lib/marketplace';
import SupplierReviews from './SupplierReviews';

export default function VendorDashboard({ supplier }) {
  const [view, setView] = useState('overview');
  const [syncing, setSyncing] = useState(null);
  const qc = useQueryClient();

  const { data: myProducts = [] } = useQuery({
    queryKey: ['vendor_products', supplier.id],
    queryFn: () => base44.entities.SupplierProduct.filter({ supplier_id: supplier.id }, '-created_date', 200),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ['procurement_orders'],
    queryFn: () => base44.entities.MarketplaceProcurementOrder.list('-created_date', 100),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ['supplier_reviews', supplier.id],
    queryFn: () => base44.entities.SupplierReview.filter({ supplier_id: supplier.id, status: 'published' }, '-created_date', 50),
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupplierProduct.update(id, data),
    onSuccess: () => qc.invalidateQueries(['vendor_products', supplier.id]),
  });

  const syncStock = (productId, newStock) => {
    setSyncing(productId);
    updateProduct.mutate({ id: productId, data: { stock_available: newStock, status: newStock > 0 ? 'active' : 'out_of_stock' } }, {
      onSuccess: () => setTimeout(() => setSyncing(null), 600),
    });
  };

  const myOrderItems = orders.filter(o => o.items?.some(i => i.supplier_id === supplier.id));
  const totalRevenue = myOrderItems.reduce((sum, o) => {
    const myItems = o.items?.filter(i => i.supplier_id === supplier.id) || [];
    return sum + myItems.reduce((s, i) => s + (i.line_total || 0), 0);
  }, 0);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 'N/A';
  const lowStock = myProducts.filter(p => p.stock_available <= 5 && p.status !== 'discontinued');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory Sync', icon: RefreshCw },
    { id: 'orders', label: `Orders (${myOrderItems.length})`, icon: ShoppingBag },
    { id: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-inter text-sm transition-all ${view === t.id ? 'bg-[#c9a962] text-[#0a0a0a] font-semibold' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {view === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Products Listed', value: myProducts.length, icon: Package, color: 'text-[#c9a962]' },
            { label: 'Orders Received', value: myOrderItems.length, icon: ShoppingBag, color: 'text-green-400' },
            { label: 'Revenue', value: formatKSh(totalRevenue), icon: TrendingUp, color: 'text-green-400' },
            { label: 'Avg Rating', value: avgRating, icon: Star, color: 'text-[#c9a962]' },
          ].map((s, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="font-playfair text-xl text-white">{s.value}</p>
              <p className="font-inter text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
          {lowStock.length > 0 && (
            <div className="col-span-2 md:col-span-4 flex items-center gap-2 p-4 rounded-xl bg-orange-400/10 border border-orange-400/20 text-orange-400 font-inter text-sm">
              <AlertCircle className="w-4 h-4" /> {lowStock.length} product(s) running low on stock. Sync inventory now.
            </div>
          )}
        </div>
      )}

      {/* Inventory Sync */}
      {view === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white/50 font-inter text-sm">
            <RefreshCw className="w-4 h-4 text-[#c9a962]" />
            Real-time inventory sync — update stock levels and they reflect instantly on the marketplace.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myProducts.map(p => (
              <div key={p.id} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-inter text-white font-semibold text-sm">{p.product_name}</p>
                    <p className="font-inter text-xs text-white/40">{formatKSh(p.unit_price)} / {p.unit}</p>
                  </div>
                  <span className={`font-inter text-[10px] px-2 py-0.5 rounded-full ${p.status === 'active' ? 'text-green-400 bg-green-400/10' : p.status === 'out_of_stock' ? 'text-red-400 bg-red-400/10' : 'text-white/30 bg-white/5'}`}>{p.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-inter text-xs text-white/50">Stock:</label>
                  <input type="number" min={0} defaultValue={p.stock_available}
                    onBlur={e => { const v = +e.target.value; if (v !== p.stock_available) syncStock(p.id, v); }}
                    className="w-24 bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-1.5 font-inter text-sm" />
                  <span className="font-inter text-xs text-white/40">{p.unit}</span>
                  {syncing === p.id && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-inter text-xs text-green-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
                    </motion.span>
                  )}
                </div>
              </div>
            ))}
            {myProducts.length === 0 && <p className="text-white/30 font-inter text-sm">No products to manage.</p>}
          </div>
        </div>
      )}

      {/* Orders */}
      {view === 'orders' && (
        <div className="space-y-3">
          {myOrderItems.map(o => {
            const myItems = o.items?.filter(i => i.supplier_id === supplier.id) || [];
            const mySubtotal = myItems.reduce((s, i) => s + (i.line_total || 0), 0);
            const mySplit = o.vendor_splits?.find(v => v.supplier_id === supplier.id);
            return (
              <div key={o.id} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-inter text-white font-semibold text-sm">{o.buyer_name}</p>
                    <p className="font-inter text-xs text-white/40">{o.buyer_email}</p>
                  </div>
                  <span className={`font-inter text-[10px] px-2 py-0.5 rounded-full ${o.status === 'pending' ? 'text-orange-400 bg-orange-400/10' : o.status === 'confirmed' || o.status === 'processing' ? 'text-blue-400 bg-blue-400/10' : o.status === 'delivered' ? 'text-green-400 bg-green-400/10' : 'text-white/30 bg-white/5'}`}>{o.status}</span>
                </div>
                <div className="space-y-1 mb-3">
                  {myItems.map((i, idx) => (
                    <div key={idx} className="flex justify-between font-inter text-xs">
                      <span className="text-white/60">{i.product_name} × {i.quantity} {i.unit}</span>
                      <span className="text-white">{formatKSh(i.line_total)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 border-t border-white/5 font-inter text-xs">
                  <span className="text-white/40">Your subtotal: <span className="text-white">{formatKSh(mySubtotal)}</span></span>
                  {mySplit && <span className="text-green-400">Payout after commission: {formatKSh(mySplit.net_payout)}</span>}
                </div>
              </div>
            );
          })}
          {myOrderItems.length === 0 && <p className="text-white/30 font-inter text-sm py-8 text-center">No orders containing your products yet.</p>}
        </div>
      )}

      {/* Reviews */}
      {view === 'reviews' && <SupplierReviews supplierId={supplier.id} supplierName={supplier.company_name} />}
    </div>
  );
}