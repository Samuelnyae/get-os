import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Store, Package, Check, X, Clock, Star, Search, Box, Trash2, Award, AlertCircle
} from 'lucide-react';

const CATEGORIES = ['food', 'beverage', 'cleaning', 'furniture', 'linen', 'maintenance', 'other'];
const CAT_EMOJI = { food: '🥩', beverage: '🍷', cleaning: '🧼', furniture: '🪑', linen: '🧺', maintenance: '🔧', other: '📦' };
const SUPPLIER_STATUS = {
  pending: { label: 'Pending', cls: 'text-orange-400 bg-orange-400/10' },
  active: { label: 'Active', cls: 'text-green-400 bg-green-400/10' },
  suspended: { label: 'Suspended', cls: 'text-red-400 bg-red-400/10' },
  archived: { label: 'Archived', cls: 'text-white/30 bg-white/5' },
};
const PRODUCT_STATUS = {
  pending_review: { label: 'Pending Review', cls: 'text-orange-400 bg-orange-400/10' },
  active: { label: 'Active', cls: 'text-green-400 bg-green-400/10' },
  out_of_stock: { label: 'Out of Stock', cls: 'text-red-400 bg-red-400/10' },
  discontinued: { label: 'Discontinued', cls: 'text-white/30 bg-white/5' },
};

export default function SupplierMarketplaceAdmin() {
  const [view, setView] = useState('overview');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const qc = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list('-created_date', 200),
  });
  const { data: products = [] } = useQuery({
    queryKey: ['supplier_products'],
    queryFn: () => base44.entities.SupplierProduct.list('-created_date', 200),
  });

  const updateSupplier = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Supplier.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['suppliers']); qc.invalidateQueries(['marketplace_suppliers']); },
  });
  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupplierProduct.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['supplier_products']); qc.invalidateQueries(['marketplace_products']); },
  });
  const deleteProduct = useMutation({
    mutationFn: (id) => base44.entities.SupplierProduct.delete(id),
    onSuccess: () => qc.invalidateQueries(['supplier_products']),
  });

  const marketplaceSuppliers = suppliers.filter(s => s.marketplace_registered);
  const pendingSuppliers = marketplaceSuppliers.filter(s => s.status === 'pending');
  const pendingProducts = products.filter(p => p.status === 'pending_review');

  const filteredProducts = products.filter(p => {
    const matchSearch = p.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-inter text-white font-semibold text-lg">Supplier Marketplace</h3>
          <p className="text-white/40 font-inter text-xs mt-0.5">
            {marketplaceSuppliers.length} marketplace suppliers · {pendingSuppliers.length} pending approval · {pendingProducts.length} products pending review
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'overview', label: 'Overview', icon: Store },
          { id: 'suppliers', label: `Suppliers (${marketplaceSuppliers.length})`, icon: Store },
          { id: 'products', label: `Products (${products.length})`, icon: Package },
          { id: 'pending', label: `Pending Approvals (${pendingSuppliers.length + pendingProducts.length})`, icon: Clock },
        ].map(t => (
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
            { label: 'Marketplace Suppliers', value: marketplaceSuppliers.length, icon: Store, color: 'text-[#c9a962]' },
            { label: 'Pending Approval', value: pendingSuppliers.length, icon: Clock, color: 'text-orange-400' },
            { label: 'Products Listed', value: products.length, icon: Package, color: 'text-green-400' },
            { label: 'Pending Review', value: pendingProducts.length, icon: AlertCircle, color: 'text-orange-400' },
          ].map((s, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="font-playfair text-2xl text-white">{s.value}</p>
              <p className="font-inter text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Suppliers */}
      {view === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketplaceSuppliers.map(s => {
            const productCount = products.filter(p => p.supplier_id === s.id).length;
            return (
              <div key={s.id} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-inter font-semibold text-sm">{s.company_name}</p>
                    <p className="text-white/50 font-inter text-xs">{s.contact_person}</p>
                  </div>
                  <span className={`font-inter text-xs px-2 py-0.5 rounded-full ${SUPPLIER_STATUS[s.status]?.cls}`}>{SUPPLIER_STATUS[s.status]?.label}</span>
                </div>
                <div className="space-y-1 mb-3">
                  <p className="text-white/60 font-inter text-xs">📧 {s.email}</p>
                  <p className="text-white/60 font-inter text-xs">📞 {s.phone}</p>
                  <p className="text-white/60 font-inter text-xs">📦 {productCount} products listed</p>
                </div>
                <div className="flex gap-2 pt-3 border-t border-white/5">
                  {s.status === 'pending' && (
                    <button onClick={() => updateSupplier.mutate({ id: s.id, data: { status: 'active' } })}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-400/10 hover:bg-green-400/20 rounded-lg text-green-400 transition-all">
                      <Check className="w-3 h-3" /><span className="font-inter text-xs">Approve</span>
                    </button>
                  )}
                  {s.status === 'active' && (
                    <button onClick={() => updateSupplier.mutate({ id: s.id, data: { status: 'suspended' } })}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-400/10 hover:bg-red-400/20 rounded-lg text-red-400 transition-all">
                      <X className="w-3 h-3" /><span className="font-inter text-xs">Suspend</span>
                    </button>
                  )}
                  {s.status === 'suspended' && (
                    <button onClick={() => updateSupplier.mutate({ id: s.id, data: { status: 'active' } })}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-400/10 hover:bg-green-400/20 rounded-lg text-green-400 transition-all">
                      <Check className="w-3 h-3" /><span className="font-inter text-xs">Reactivate</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {marketplaceSuppliers.length === 0 && (
            <div className="col-span-3 py-12 text-center text-white/30 font-inter text-sm">No marketplace suppliers yet.</div>
          )}
        </div>
      )}

      {/* Products */}
      {view === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#c9a962]/10 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or suppliers..."
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
                <div className="aspect-square bg-[#0a0a0a] flex items-center justify-center relative">
                  {p.image_url ? <img src={p.image_url} alt={p.product_name} className="w-full h-full object-cover" /> : <Box className="w-10 h-10 text-white/20" />}
                  {p.featured && <span className="absolute top-2 right-2 px-2 py-0.5 bg-[#c9a962] text-[#0a0a0a] text-[10px] font-bold rounded-full font-inter">FEATURED</span>}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-inter text-white font-semibold text-sm line-clamp-1">{p.product_name}</p>
                    <span className={`font-inter text-[10px] px-2 py-0.5 rounded-full ${PRODUCT_STATUS[p.status]?.cls}`}>{PRODUCT_STATUS[p.status]?.label}</span>
                  </div>
                  <p className="font-inter text-xs text-white/40 mb-2">{p.supplier_name}</p>
                  <p className="font-playfair text-lg text-[#c9a962] mb-2">KSh {Number(p.unit_price).toLocaleString()}<span className="font-inter text-xs text-white/40"> /{p.unit}</span></p>
                  <div className="flex gap-1 pt-2 border-t border-white/5">
                    {p.status === 'pending_review' && (
                      <button onClick={() => updateProduct.mutate({ id: p.id, data: { status: 'active' } })}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-400/10 hover:bg-green-400/20 rounded-lg text-green-400 transition-all">
                        <Check className="w-3 h-3" /><span className="font-inter text-[10px]">Approve</span>
                      </button>
                    )}
                    {p.status === 'active' && (
                      <button onClick={() => updateProduct.mutate({ id: p.id, data: { featured: !p.featured } })}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#c9a962]/10 hover:bg-[#c9a962]/20 rounded-lg text-[#c9a962] transition-all">
                        <Award className="w-3 h-3" /><span className="font-inter text-[10px]">{p.featured ? 'Unfeature' : 'Feature'}</span>
                      </button>
                    )}
                    <button onClick={() => deleteProduct.mutate(p.id)}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-red-400/10 rounded-lg text-white/60 hover:text-red-400 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-4 py-12 text-center text-white/30 font-inter text-sm">No products found.</div>
            )}
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {view === 'pending' && (
        <div className="space-y-6">
          {/* Pending Suppliers */}
          <div>
            <h4 className="font-inter text-white font-semibold text-sm mb-3">Pending Supplier Registrations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSuppliers.map(s => (
                <div key={s.id} className="bg-[#1a1a1a] border border-orange-400/20 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-inter font-semibold text-sm">{s.company_name}</p>
                      <p className="text-white/50 font-inter text-xs">{s.contact_person} · {s.email}</p>
                    </div>
                    <span className="font-inter text-xs px-2 py-0.5 rounded-full text-orange-400 bg-orange-400/10">Pending</span>
                  </div>
                  <p className="text-white/40 font-inter text-xs mb-3">📞 {s.phone} · 📦 {s.category}</p>
                  <div className="flex gap-2">
                    <button onClick={() => updateSupplier.mutate({ id: s.id, data: { status: 'active' } })}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-400/10 hover:bg-green-400/20 rounded-lg text-green-400 transition-all">
                      <Check className="w-3 h-3" /><span className="font-inter text-xs">Approve</span>
                    </button>
                    <button onClick={() => updateSupplier.mutate({ id: s.id, data: { status: 'archived' } })}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-400/10 hover:bg-red-400/20 rounded-lg text-red-400 transition-all">
                      <X className="w-3 h-3" /><span className="font-inter text-xs">Reject</span>
                    </button>
                  </div>
                </div>
              ))}
              {pendingSuppliers.length === 0 && <p className="text-white/30 font-inter text-sm">No pending supplier registrations.</p>}
            </div>
          </div>

          {/* Pending Products */}
          <div>
            <h4 className="font-inter text-white font-semibold text-sm mb-3">Pending Product Reviews</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingProducts.map(p => (
                <div key={p.id} className="bg-[#1a1a1a] border border-orange-400/20 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-white font-inter font-semibold text-sm">{p.product_name}</p>
                    <span className="font-inter text-xs px-2 py-0.5 rounded-full text-orange-400 bg-orange-400/10">Pending</span>
                  </div>
                  <p className="text-white/40 font-inter text-xs mb-2">{p.supplier_name}</p>
                  <p className="font-playfair text-lg text-[#c9a962] mb-3">KSh {Number(p.unit_price).toLocaleString()} / {p.unit}</p>
                  <div className="flex gap-2">
                    <button onClick={() => updateProduct.mutate({ id: p.id, data: { status: 'active' } })}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-400/10 hover:bg-green-400/20 rounded-lg text-green-400 transition-all">
                      <Check className="w-3 h-3" /><span className="font-inter text-xs">Approve</span>
                    </button>
                    <button onClick={() => updateProduct.mutate({ id: p.id, data: { status: 'discontinued' } })}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-400/10 hover:bg-red-400/20 rounded-lg text-red-400 transition-all">
                      <X className="w-3 h-3" /><span className="font-inter text-xs">Reject</span>
                    </button>
                  </div>
                </div>
              ))}
              {pendingProducts.length === 0 && <p className="text-white/30 font-inter text-sm">No pending product reviews.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}