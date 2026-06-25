import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Check, Package, Percent, Truck } from 'lucide-react';
import { getCart, saveCart, getEffectivePrice, computeVendorSplits, formatKSh, PLATFORM_COMMISSION_RATE } from '@/lib/marketplace';

export default function MarketplaceCart() {
  const [cart, setCart] = useState([]);
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({ buyer_name: '', buyer_email: '', buyer_phone: '', delivery_address: '', notes: '' });
  const [done, setDone] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    const refresh = () => setCart(getCart());
    refresh();
    window.addEventListener('marketplace_cart_updated', refresh);
    return () => window.removeEventListener('marketplace_cart_updated', refresh);
  }, []);

  const updateQty = (productId, delta) => {
    const updated = cart.map(i => i.product_id === productId ? { ...i, quantity: Math.max(i.min_order_qty || 1, i.quantity + delta) } : i);
    saveCart(updated);
  };

  const removeItem = (productId) => {
    saveCart(cart.filter(i => i.product_id !== productId));
  };

  const vendorSplits = computeVendorSplits(cart);
  const totalAmount = vendorSplits.reduce((s, v) => s + v.subtotal, 0);
  const commissionTotal = vendorSplits.reduce((s, v) => s + v.commission_amount, 0);
  const totalPayout = vendorSplits.reduce((s, v) => s + v.net_payout, 0);

  const byVendor = {};
  cart.forEach(i => { (byVendor[i.supplier_id] = byVendor[i.supplier_id] || { name: i.supplier_name, items: [] }).items.push(i); });

  const placeOrder = useMutation({
    mutationFn: (data) => base44.entities.MarketplaceProcurementOrder.create(data),
    onSuccess: (rec) => {
      saveCart([]);
      setCart([]);
      setCheckout(false);
      setDone(rec);
      qc.invalidateQueries(['procurement_orders']);
    },
  });

  const submitOrder = () => {
    const items = cart.map(i => {
      const price = getEffectivePrice(i);
      return {
        product_id: i.product_id, supplier_id: i.supplier_id, supplier_name: i.supplier_name,
        product_name: i.product_name, quantity: i.quantity, unit: i.unit,
        unit_price: price, line_total: price * i.quantity,
      };
    });
    placeOrder.mutate({
      ...form,
      items,
      vendor_splits: vendorSplits,
      total_amount: totalAmount,
      commission_rate: PLATFORM_COMMISSION_RATE,
      commission_total: commissionTotal,
      total_payout: totalPayout,
      status: 'pending',
    });
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-16 h-16 rounded-full bg-green-400/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="font-inter text-white font-semibold text-xl mb-2">Order Placed Successfully</h3>
          <p className="font-inter text-white/50 text-sm mb-1">Total: {formatKSh(done.total_amount)}</p>
          <p className="font-inter text-white/40 text-xs mb-6">Split across {done.vendor_splits?.length || 0} vendor(s) · Platform commission: {formatKSh(done.commission_total)}</p>
          <button onClick={() => setDone(null)} className="px-6 py-2.5 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold">Continue Browsing</button>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0 && !checkout) {
    return (
      <div className="py-16 text-center">
        <ShoppingCart className="w-12 h-12 text-white/10 mx-auto mb-3" />
        <p className="font-inter text-white/30 text-sm">Your cart is empty. Browse the marketplace to add products.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-inter text-white font-semibold text-lg flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-[#c9a962]" /> Procurement Cart</h3>
          <p className="text-white/40 font-inter text-xs mt-0.5">{cart.length} items · {vendorSplits.length} vendor(s)</p>
        </div>
        {!checkout && (
          <button onClick={() => setCheckout(true)} className="px-5 py-2.5 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90">Checkout</button>
        )}
      </div>

      {/* Vendor-grouped items */}
      {!checkout && (
        <div className="space-y-4">
          {Object.entries(byVendor).map(([sid, group]) => (
            <div key={sid} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-[#0f0f0f] border-b border-white/5 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#c9a962]" />
                <span className="font-inter text-sm text-white font-semibold">{group.name}</span>
              </div>
              {group.items.map(item => {
                const effPrice = getEffectivePrice(item);
                const hasTierDiscount = effPrice !== item.unit_price;
                return (
                  <div key={item.product_id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
                    <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] flex items-center justify-center flex-shrink-0">
                      {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover rounded-lg" alt="" /> : <Package className="w-4 h-4 text-white/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-white text-sm font-medium line-clamp-1">{item.product_name}</p>
                      <p className="font-inter text-xs text-white/40">{item.unit} · min {item.min_order_qty}</p>
                      {hasTierDiscount && <span className="font-inter text-[10px] text-green-400">Tier pricing applied</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(item.product_id, -1)} className="w-7 h-7 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 flex items-center justify-center">−</button>
                      <span className="font-inter text-sm text-white w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product_id, 1)} className="w-7 h-7 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 flex items-center justify-center">+</button>
                    </div>
                    <p className="font-playfair text-sm text-[#c9a962] w-20 text-right">{formatKSh(effPrice * item.quantity)}</p>
                    <button onClick={() => removeItem(item.product_id)} className="text-white/30 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Checkout */}
      {checkout && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5 space-y-3">
            <h4 className="font-inter text-white font-semibold text-sm mb-2">Buyer Details</h4>
            {[
              { key: 'buyer_name', label: 'Full Name', type: 'text' },
              { key: 'buyer_email', label: 'Email', type: 'email' },
              { key: 'buyer_phone', label: 'Phone', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="font-inter text-xs text-white/50 mb-1 block">{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
            ))}
            <div>
              <label className="font-inter text-xs text-white/50 mb-1 block">Delivery Address</label>
              <textarea value={form.delivery_address} onChange={e => setForm(p => ({ ...p, delivery_address: e.target.value }))} rows={2}
                className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
            </div>
            <div>
              <label className="font-inter text-xs text-white/50 mb-1 block">Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
            <h4 className="font-inter text-white font-semibold text-sm mb-3">Order Summary & Payment Split</h4>
            <div className="space-y-2 mb-4">
              {vendorSplits.map(v => (
                <div key={v.supplier_id} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="font-inter text-sm text-white">{v.supplier_name}</p>
                    <p className="font-inter text-[10px] text-white/40">{v.item_count} item(s) · {v.commission_rate}% commission</p>
                  </div>
                  <div className="text-right">
                    <p className="font-inter text-sm text-white">{formatKSh(v.subtotal)}</p>
                    <p className="font-inter text-[10px] text-green-400">Payout: {formatKSh(v.net_payout)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between font-inter text-sm"><span className="text-white/60">Total Order Value</span><span className="text-white font-semibold">{formatKSh(totalAmount)}</span></div>
              <div className="flex justify-between font-inter text-xs"><span className="text-white/40 flex items-center gap-1"><Percent className="w-3 h-3" />Platform Commission ({PLATFORM_COMMISSION_RATE}%)</span><span className="text-[#c9a962]">{formatKSh(commissionTotal)}</span></div>
              <div className="flex justify-between font-inter text-xs"><span className="text-white/40 flex items-center gap-1"><Truck className="w-3 h-3" />Total Vendor Payouts</span><span className="text-green-400">{formatKSh(totalPayout)}</span></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setCheckout(false)} className="flex-1 py-2.5 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm hover:bg-white/5">Back</button>
              <button onClick={submitOrder} disabled={placeOrder.isPending || !form.buyer_name || !form.buyer_email}
                className="flex-1 py-2.5 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                {placeOrder.isPending ? 'Placing...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}