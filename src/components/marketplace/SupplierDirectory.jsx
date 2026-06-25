import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Search, Star, Package, X, MapPin, Phone, FileText } from 'lucide-react';
import { CATEGORIES, CAT_EMOJI } from '@/lib/marketplace';
import SupplierReviews from './SupplierReviews';

export default function SupplierDirectory({ onTargetRFQ }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['marketplace_suppliers'],
    queryFn: () => base44.entities.Supplier.list('-created_date', 200),
  });
  const { data: products = [] } = useQuery({
    queryKey: ['marketplace_products'],
    queryFn: () => base44.entities.SupplierProduct.list('-created_date', 200),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ['all_supplier_reviews'],
    queryFn: () => base44.entities.SupplierReview.filter({ status: 'published' }, '-created_date', 200),
  });

  const activeSuppliers = suppliers.filter(s => s.status === 'active' && s.marketplace_registered);
  const filtered = activeSuppliers.filter(s => {
    const matchSearch = s.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.contact_person?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || s.category === catFilter;
    return matchSearch && matchCat;
  });

  const getRating = (sid) => {
    const r = reviews.filter(rv => rv.supplier_id === sid);
    return r.length > 0 ? (r.reduce((sum, rv) => sum + rv.rating, 0) / r.length).toFixed(1) : null;
  };
  const getProductCount = (sid) => products.filter(p => p.supplier_id === sid && p.status === 'active').length;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-inter text-white font-semibold text-lg flex items-center gap-2"><Store className="w-5 h-5 text-[#c9a962]" /> Supplier Directory</h3>
        <p className="text-white/40 font-inter text-xs mt-0.5">Browse verified suppliers, view ratings, and request quotes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#c9a962]/10 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..."
            className="bg-transparent text-white font-inter text-sm outline-none flex-1 placeholder:text-white/30" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-2 rounded-lg font-inter text-xs capitalize transition-all ${catFilter === c ? 'bg-[#c9a962] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>
              {CAT_EMOJI[c] || '🌐'} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Supplier grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const rating = getRating(s.id);
          const productCount = getProductCount(s.id);
          return (
            <div key={s.id} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4 hover:border-[#c9a962]/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#c9a962]/20 flex items-center justify-center">
                    <Store className="w-5 h-5 text-[#c9a962]" />
                  </div>
                  <div>
                    <p className="font-inter text-white font-semibold text-sm">{s.company_name}</p>
                    <p className="font-inter text-xs text-white/40">{CAT_EMOJI[s.category]} {s.category}</p>
                  </div>
                </div>
                {rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-[#c9a962] fill-[#c9a962]" />
                    <span className="font-inter text-sm text-white">{rating}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1 mb-3">
                <p className="font-inter text-xs text-white/50 flex items-center gap-1.5"><Package className="w-3 h-3" /> {productCount} active products</p>
                <p className="font-inter text-xs text-white/50 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {s.address || 'N/A'}</p>
                <p className="font-inter text-xs text-white/50 flex items-center gap-1.5"><Phone className="w-3 h-3" /> {s.phone}</p>
              </div>
              <div className="flex gap-2 pt-3 border-t border-white/5">
                <button onClick={() => setSelected(s)} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white font-inter text-xs transition-all">
                  View Profile
                </button>
                <button onClick={() => onTargetRFQ?.(s)} className="flex-1 py-1.5 bg-[#c9a962]/10 hover:bg-[#c9a962]/20 text-[#c9a962] rounded-lg font-inter text-xs flex items-center justify-center gap-1 transition-all">
                  <FileText className="w-3 h-3" /> Request Quote
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 py-12 text-center">
            <Store className="w-10 h-10 text-white/10 mx-auto mb-2" />
            <p className="font-inter text-white/30 text-sm">No suppliers found.</p>
          </div>
        )}
      </div>

      {/* Supplier Profile Modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#c9a962]/20 flex items-center justify-center">
                    <Store className="w-6 h-6 text-[#c9a962]" />
                  </div>
                  <div>
                    <h3 className="font-inter text-white font-semibold text-lg">{selected.company_name}</h3>
                    <p className="font-inter text-xs text-white/40">{CAT_EMOJI[selected.category]} {selected.category} · {selected.payment_terms}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#0f0f0f] rounded-lg p-3"><p className="font-inter text-[10px] text-white/40 uppercase">Contact</p><p className="font-inter text-sm text-white">{selected.contact_person}</p></div>
                <div className="bg-[#0f0f0f] rounded-lg p-3"><p className="font-inter text-[10px] text-white/40 uppercase">Phone</p><p className="font-inter text-sm text-white">{selected.phone}</p></div>
                <div className="bg-[#0f0f0f] rounded-lg p-3"><p className="font-inter text-[10px] text-white/40 uppercase">Email</p><p className="font-inter text-sm text-white truncate">{selected.email}</p></div>
                <div className="bg-[#0f0f0f] rounded-lg p-3"><p className="font-inter text-[10px] text-white/40 uppercase">Products</p><p className="font-inter text-sm text-white">{getProductCount(selected.id)} active</p></div>
              </div>
              {selected.notes && <p className="font-inter text-sm text-white/60 mb-4">{selected.notes}</p>}
              <SupplierReviews supplierId={selected.id} supplierName={selected.company_name} />
              <div className="flex gap-3 mt-5">
                <button onClick={() => setSelected(null)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm hover:bg-white/5">Close</button>
                <button onClick={() => { onTargetRFQ?.(selected); setSelected(null); }} className="flex-1 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold flex items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4" /> Request Quote
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}