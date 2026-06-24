import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Package, Plus, Search, X, Check, Clock, Star, Phone, Mail, MapPin,
  TrendingUp, ShoppingBag, LogOut, Edit, Trash2, Box, DollarSign
} from 'lucide-react';

const CATEGORIES = ['food', 'beverage', 'cleaning', 'furniture', 'linen', 'maintenance', 'other'];
const CAT_EMOJI = { food: '🥩', beverage: '🍷', cleaning: '🧼', furniture: '🪑', linen: '🧺', maintenance: '🔧', other: '📦' };
const STATUS_BADGE = {
  pending: { label: 'Pending Approval', cls: 'text-orange-400 bg-orange-400/10' },
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

const EMPTY_SUPPLIER = {
  company_name: '', contact_person: '', phone: '', email: '', address: '',
  tax_pin: '', category: 'food', payment_terms: 'Net 30', notes: '',
};
const EMPTY_PRODUCT = {
  product_name: '', description: '', category: 'food', unit: 'kg',
  unit_price: 0, min_order_qty: 1, stock_available: 0, image_url: '',
};

export default function SupplierMarketplace() {
  const [tab, setTab] = useState('browse');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [mySupplierId, setMySupplierId] = useState(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [supplierForm, setSupplierForm] = useState(EMPTY_SUPPLIER);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [submitMsg, setSubmitMsg] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem('marketplace_supplier_id');
    if (stored) setMySupplierId(stored);
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['marketplace_products'],
    queryFn: () => base44.entities.SupplierProduct.list('-created_date', 200),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['marketplace_suppliers'],
    queryFn: () => base44.entities.Supplier.list('-created_date', 200),
  });

  const mySupplier = suppliers.find(s => s.id === mySupplierId);
  const myProducts = products.filter(p => p.supplier_id === mySupplierId);

  const registerSupplier = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create({
      ...data,
      status: 'active',
      marketplace_registered: true,
      registration_source: 'marketplace',
    }),
    onSuccess: (rec) => {
      localStorage.setItem('marketplace_supplier_id', rec.id);
      setMySupplierId(rec.id);
      setShowSupplierForm(false);
      setSupplierForm(EMPTY_SUPPLIER);
      setSubmitMsg({ type: 'success', text: 'Registration complete! Your supplier account is active. You can now list products.' });
      qc.invalidateQueries(['marketplace_suppliers']);
      setTab('myproducts');
    },
    onError: () => setSubmitMsg({ type: 'error', text: 'Registration failed. Please try again.' }),
  });

  const saveProduct = useMutation({
    mutationFn: (data) => editingProduct
      ? base44.entities.SupplierProduct.update(editingProduct.id, data)
      : base44.entities.SupplierProduct.create({
          ...data,
          supplier_id: mySupplierId,
          supplier_name: mySupplier?.company_name || '',
          status: 'pending_review',
        }),
    onSuccess: () => {
      qc.invalidateQueries(['marketplace_products']);
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm(EMPTY_PRODUCT);
      setSubmitMsg({ type: 'success', text: editingProduct ? 'Product updated.' : 'Product listed! Pending admin review.' });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => base44.entities.SupplierProduct.delete(id),
    onSuccess: () => qc.invalidateQueries(['marketplace_products']),
  });

  const logoutSupplier = () => {
    localStorage.removeItem('marketplace_supplier_id');
    setMySupplierId(null);
    setTab('browse');
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setProductForm({
      product_name: p.product_name || '', description: p.description || '',
      category: p.category || 'food', unit: p.unit || 'kg', unit_price: p.unit_price || 0,
      min_order_qty: p.min_order_qty || 1, stock_available: p.stock_available || 0,
      image_url: p.image_url || '',
    });
    setShowProductForm(true);
  };

  const filteredProducts = products.filter(p => {
    if (p.status !== 'active') return false;
    const matchSearch = p.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const activeSuppliers = suppliers.filter(s => s.status === 'active' && s.marketplace_registered);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .gold-gradient {
          background: linear-gradient(135deg, #c9a962 0%, #e4d5a7 50%, #c9a962 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
      `}</style>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[#c9a962]/20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#c9a962]/10 border border-[#c9a962]/20 mb-6">
              <Store className="w-4 h-4 text-[#c9a962]" />
              <span className="font-inter text-xs tracking-wider text-[#c9a962] uppercase">Supplier Marketplace</span>
            </div>
            <h1 className="font-playfair text-4xl md:text-5xl gold-gradient mb-4">Supplier Marketplace</h1>
            <p className="font-inter text-white/60 max-w-2xl mx-auto text-sm leading-relaxed">
              Register as a supplier, list your products, and connect with Digital Bites procurement.
              Browse the active supplier catalog and submit your offerings for review.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-10">
            {[
              { icon: Store, label: 'Active Suppliers', value: activeSuppliers.length },
              { icon: Package, label: 'Products Listed', value: products.filter(p => p.status === 'active').length },
              { icon: TrendingUp, label: 'Categories', value: CATEGORIES.length },
            ].map((s, i) => (
              <div key={i} className="bg-[#1a1a1a]/60 border border-[#c9a962]/10 rounded-xl p-4 text-center">
                <s.icon className="w-5 h-5 text-[#c9a962] mx-auto mb-2" />
                <p className="font-playfair text-2xl text-white">{s.value}</p>
                <p className="font-inter text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Message banner */}
        <AnimatePresence>
          {submitMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mb-6 p-4 rounded-xl border font-inter text-sm flex items-center gap-2 ${
                submitMsg.type === 'success' ? 'bg-green-400/10 border-green-400/20 text-green-400' : 'bg-red-400/10 border-red-400/20 text-red-400'
              }`}>
              {submitMsg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {submitMsg.text}
              <button onClick={() => setSubmitMsg(null)} className="ml-auto"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-8 border-b border-[#c9a962]/10 pb-4">
          <button onClick={() => setTab('browse')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-inter text-sm transition-all ${tab === 'browse' ? 'bg-[#c9a962] text-[#0a0a0a] font-semibold' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>
            <Search className="w-4 h-4" /> Browse Marketplace
          </button>
          {mySupplier ? (
            <>
              <button onClick={() => setTab('myproducts')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-inter text-sm transition-all ${tab === 'myproducts' ? 'bg-[#c9a962] text-[#0a0a0a] font-semibold' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>
                <Package className="w-4 h-4" /> My Products ({myProducts.length})
              </button>
              <button onClick={logoutSupplier} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-inter text-sm bg-[#1a1a1a] text-white/40 border border-[#c9a962]/10 hover:text-red-400 ml-auto">
                <LogOut className="w-4 h-4" /> Exit Supplier Session
              </button>
            </>
          ) : (
            <button onClick={() => setShowSupplierForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-inter text-sm bg-[#c9a962] text-[#0a0a0a] font-semibold hover:bg-[#c9a962]/90 ml-auto">
              <Plus className="w-4 h-4" /> Register as Supplier
            </button>
          )}
        </div>

        {/* My Supplier Status Banner */}
        {mySupplier && (
          <div className="mb-6 bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#c9a962]/20 flex items-center justify-center">
                <Store className="w-5 h-5 text-[#c9a962]" />
              </div>
              <div>
                <p className="font-inter text-white font-semibold text-sm">{mySupplier.company_name}</p>
                <p className="font-inter text-xs text-white/40">{mySupplier.contact_person} · {mySupplier.email}</p>
              </div>
            </div>
            <span className={`font-inter text-xs px-3 py-1 rounded-full ${STATUS_BADGE[mySupplier.status]?.cls}`}>
              {STATUS_BADGE[mySupplier.status]?.label}
            </span>
          </div>
        )}

        {/* Browse Tab */}
        {tab === 'browse' && (
          <div className="space-y-6">
            {/* Filters */}
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

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <motion.div key={p.id} layout
                  className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden hover:border-[#c9a962]/30 transition-all group">
                  <div className="aspect-square bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Box className="w-12 h-12 text-white/20" />
                    )}
                    {p.featured && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-[#c9a962] text-[#0a0a0a] text-[10px] font-bold rounded-full font-inter">FEATURED</span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-inter text-white font-semibold text-sm line-clamp-1">{p.product_name}</p>
                      <span className="text-xs">{CAT_EMOJI[p.category]}</span>
                    </div>
                    <p className="font-inter text-xs text-white/40 mb-2 line-clamp-1">{p.supplier_name}</p>
                    {p.description && <p className="font-inter text-xs text-white/50 mb-3 line-clamp-2">{p.description}</p>}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div>
                        <p className="font-playfair text-lg text-[#c9a962]">KSh {Number(p.unit_price).toLocaleString()}</p>
                        <p className="font-inter text-[10px] text-white/40">per {p.unit} · min {p.min_order_qty}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-inter text-xs text-white/60">{p.stock_available} {p.unit}</p>
                        <p className="font-inter text-[10px] text-white/30">in stock</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-4 py-16 text-center">
                  <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
                  <p className="font-inter text-white/30 text-sm">No active products found. Be the first to list!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Products Tab */}
        {tab === 'myproducts' && mySupplier && (
          <div className="space-y-5">
            {mySupplier.status !== 'active' && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-orange-400/10 border border-orange-400/20 text-orange-400 font-inter text-sm">
                <Clock className="w-4 h-4" />
                Your supplier account is currently {mySupplier.status}. Please contact the administrator.
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-inter text-white font-semibold text-lg">My Products</h3>
                <p className="text-white/40 font-inter text-xs mt-0.5">{myProducts.length} products listed</p>
              </div>
              <button onClick={() => { setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setShowProductForm(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myProducts.map(p => (
                <div key={p.id} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl overflow-hidden">
                  <div className="aspect-video bg-[#0a0a0a] flex items-center justify-center">
                    {p.image_url ? <img src={p.image_url} alt={p.product_name} className="w-full h-full object-cover" /> : <Box className="w-10 h-10 text-white/20" />}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-inter text-white font-semibold text-sm">{p.product_name}</p>
                      <span className={`font-inter text-[10px] px-2 py-0.5 rounded-full ${PRODUCT_STATUS[p.status]?.cls}`}>{PRODUCT_STATUS[p.status]?.label}</span>
                    </div>
                    <p className="font-playfair text-lg text-[#c9a962] mb-2">KSh {Number(p.unit_price).toLocaleString()} <span className="font-inter text-xs text-white/40">/ {p.unit}</span></p>
                    <p className="font-inter text-xs text-white/50 mb-3">Stock: {p.stock_available} {p.unit} · Min order: {p.min_order_qty}</p>
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      <button onClick={() => openEditProduct(p)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all">
                        <Edit className="w-3 h-3" /><span className="font-inter text-xs">Edit</span>
                      </button>
                      <button onClick={() => deleteProduct.mutate(p.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-red-400/10 rounded-lg text-white/60 hover:text-red-400 transition-all">
                        <Trash2 className="w-3 h-3" /><span className="font-inter text-xs">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {myProducts.length === 0 && (
                <div className="col-span-3 py-12 text-center">
                  <Package className="w-10 h-10 text-white/10 mx-auto mb-2" />
                  <p className="font-inter text-white/30 text-sm">No products yet. Add your first product.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Not registered prompt */}
        {tab === 'myproducts' && !mySupplier && (
          <div className="py-16 text-center">
            <Store className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="font-inter text-white/50 mb-4">You need to register as a supplier first.</p>
            <button onClick={() => setShowSupplierForm(true)} className="px-6 py-2.5 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold">
              Register Now
            </button>
          </div>
        )}
      </div>

      {/* Supplier Registration Modal */}
      <AnimatePresence>
        {showSupplierForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#c9a962]" />
                  <h3 className="font-inter text-white font-semibold">Register as Supplier</h3>
                </div>
                <button onClick={() => setShowSupplierForm(false)}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'company_name', label: 'Company Name', span: 2 },
                  { key: 'contact_person', label: 'Contact Person' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'email', label: 'Email' },
                  { key: 'address', label: 'Address' },
                  { key: 'tax_pin', label: 'Tax/VAT PIN' },
                  { key: 'payment_terms', label: 'Payment Terms' },
                ].map(f => (
                  <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                    <label className="font-inter text-xs text-white/50 mb-1 block">{f.label}</label>
                    <input value={supplierForm[f.key] || ''} onChange={e => setSupplierForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                  </div>
                ))}
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Category</label>
                  <select value={supplierForm.category} onChange={e => setSupplierForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Notes (optional)</label>
                  <textarea value={supplierForm.notes || ''} onChange={e => setSupplierForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowSupplierForm(false)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm hover:bg-white/5">Cancel</button>
                <button onClick={() => registerSupplier.mutate(supplierForm)} disabled={registerSupplier.isPending || !supplierForm.company_name || !supplierForm.email}
                  className="flex-1 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                  {registerSupplier.isPending ? 'Submitting...' : 'Submit Registration'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showProductForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#c9a962]" />
                  <h3 className="font-inter text-white font-semibold">{editingProduct ? 'Edit Product' : 'List New Product'}</h3>
                </div>
                <button onClick={() => setShowProductForm(false)}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Product Name</label>
                  <input value={productForm.product_name} onChange={e => setProductForm(p => ({ ...p, product_name: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Description</label>
                  <textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} rows={2}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Category</label>
                  <select value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Unit (kg, liter, box...)</label>
                  <input value={productForm.unit} onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Unit Price (KSh)</label>
                  <input type="number" min={0} value={productForm.unit_price} onChange={e => setProductForm(p => ({ ...p, unit_price: +e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Min Order Qty</label>
                  <input type="number" min={1} value={productForm.min_order_qty} onChange={e => setProductForm(p => ({ ...p, min_order_qty: +e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Stock Available</label>
                  <input type="number" min={0} value={productForm.stock_available} onChange={e => setProductForm(p => ({ ...p, stock_available: +e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Image URL (optional)</label>
                  <input value={productForm.image_url} onChange={e => setProductForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..."
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowProductForm(false)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm hover:bg-white/5">Cancel</button>
                <button onClick={() => saveProduct.mutate(productForm)} disabled={saveProduct.isPending || !productForm.product_name}
                  className="flex-1 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                  {saveProduct.isPending ? 'Saving...' : editingProduct ? 'Update Product' : 'List Product'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}