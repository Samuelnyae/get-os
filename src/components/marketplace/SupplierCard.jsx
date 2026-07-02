import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Star, BadgeCheck, MapPin, Package, ChevronDown, ShoppingCart, Plus } from 'lucide-react';
import { formatKSh, CAT_LABELS } from '@/lib/marketplace';

const CAT_BADGE = {
  food: 'bg-green-500/15 text-green-400',
  beverage: 'bg-purple-500/15 text-purple-400',
  cleaning: 'bg-blue-500/15 text-blue-400',
  furniture: 'bg-orange-500/15 text-orange-400',
  linen: 'bg-pink-500/15 text-pink-400',
  maintenance: 'bg-yellow-500/15 text-yellow-400',
  other: 'bg-white/10 text-white/60',
};

export default function SupplierCard({ supplier, rating, products, onAddToCart, onPlaceOrder }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-5 hover:border-[#c5a059]/20 transition-all"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-[#c5a059]/20 flex items-center justify-center flex-shrink-0">
          <Store className="w-6 h-6 text-[#c5a059]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm truncate">{supplier.company_name}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${CAT_BADGE[supplier.category] || CAT_BADGE.other}`}>
              {CAT_LABELS[supplier.category] || supplier.category}
            </span>
          </div>
          <p className="text-white/40 text-xs mt-0.5">{supplier.contact_person}</p>
        </div>
      </div>

      {/* Rating + Verified */}
      <div className="flex items-center gap-3 mb-3">
        {rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-[#c5a059] fill-[#c5a059]" />
            <span className="text-white text-sm font-medium">{rating}</span>
          </div>
        )}
        <span className="flex items-center gap-1 text-green-400 text-xs">
          <BadgeCheck className="w-3.5 h-3.5" /> Verified
        </span>
      </div>

      {/* Description */}
      {supplier.notes && (
        <p className="text-white/40 text-xs leading-relaxed mb-3 line-clamp-2">{supplier.notes}</p>
      )}

      {/* Footer meta */}
      <div className="flex items-center gap-4 text-white/40 text-xs mb-3">
        <span className="flex items-center gap-1">
          <Package className="w-3 h-3" /> {products.length} products
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {supplier.address || 'N/A'}
        </span>
      </div>

      {/* Expand products */}
      {products.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[#c5a059] text-xs font-medium mb-3 hover:opacity-80"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Hide' : 'Show'} products
        </button>
      )}

      {expanded && products.length > 0 && (
        <div className="space-y-2 mb-3 border-t border-white/5 pt-3">
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-medium truncate">{p.product_name}</p>
                <p className="text-white/30 text-[10px]">{formatKSh(p.unit_price)}/{p.unit}</p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.stock_available > 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                {p.stock_available > 0 ? 'In Stock' : 'Out'}
              </span>
              {onAddToCart && p.stock_available > 0 && (
                <button
                  onClick={() => onAddToCart(p)}
                  className="w-6 h-6 rounded-lg bg-[#c5a059] text-black flex items-center justify-center hover:opacity-80"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-white/5">
        <button
          onClick={() => onPlaceOrder?.(supplier)}
          className="flex-1 py-2 rounded-lg border border-[#c5a059]/40 text-[#c5a059] text-xs font-medium hover:bg-[#c5a059]/10 transition-all flex items-center justify-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5" /> Place Order
        </button>
      </div>
    </motion.div>
  );
}