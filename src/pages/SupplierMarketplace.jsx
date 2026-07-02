import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Package, Plus, Search, X, Check, Clock, LogOut, Edit, Trash2, Box,
  ShoppingCart, FileText, Upload, Loader2, UserPlus, LayoutGrid, Star,
  BadgeCheck, Truck, Filter
} from 'lucide-react';
import { CATEGORIES, CAT_LABELS, CAT_EMOJI, addToCart, getCart, formatKSh } from '@/lib/marketplace';
import MarketplaceCart from '@/components/marketplace/MarketplaceCart';
import RFQPanel from '@/components/marketplace/RFQPanel';
import SupplierCard from '@/components/marketplace/SupplierCard';
import SupplierRegistrationModal from '@/components/marketplace/SupplierRegistrationModal';
import VendorDashboardV2 from '@/components/marketplace/VendorDashboardV2';

const EMPTY_PRODUCT = {
  product_name: '', description: '', category: 'food', unit: 'kg',
  unit_price: 0, min_order_qty: 1, stock_available: 0, image_url: '', tier_pricing: [],
};

export default function SupplierMarketplace() {
  const [tab, setTab] = useState('browse');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [mySupplierId, setMySupplierId] = useState(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [buyerInfo, setBuyerInfo] = useState({ name: '', email: '', phone: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [expandedSupplier, setExpandedSupplier] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem('marketplace_supplier_id');
    if (stored) setMySupplierId(stored);
    const refreshCart = () => setCartCount(getCart().reduce((s, i) => s + i.quantity, 0));
    refreshCart();
    window.addEventListener('marketplace_cart_updated', refreshCart);
    return () => window.removeEventListener('marketplace_cart_updated', refreshCart);
  }, []);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) setBuyerInfo(p => ({ ...p, name: u.full_name || p.name, email: u.email || p.email }));
    }).catch(() => {});
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['marketplace_products'],
    queryFn: () => base44.entities.SupplierProduct.list('-created_date', 200),
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ['marketplace_suppliers'],
    queryFn: () => base44.entities.Supplier.list('-created_date', 200),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ['marketplace_reviews'],
    queryFn: () => base44.entities.SupplierReview.filter({ status: 'published' }, '-created_date', 200),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ['marketplace_orders'],
    queryFn: () => base44.entities.MarketplaceProcurementOrder.list('-created_date', 200),
  });

  const mySupplier = suppliers.find(s => s.id === mySupplierId);
  const myProducts = products.filter(p => p.supplier_id === mySupplierId);

  const registerSupplier = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create({
      ...data, status: 'active', marketplace_registered: true, registration_source: 'marketplace',
    }),
    onSuccess: (rec) => {
      localStorage.setItem('marketplace_supplier_id', rec.id);
      setMySupplierId(rec.id);
      setShowRegModal(false);
      setSubmitMsg({ type: 'success', text: 'Registration complete! Your supplier account is active.' });
      qc.invalidateQueries(['marketplace_suppliers']);
      setTab('dashboard');
    },
    onError: () => setSubmitMsg({ type: 'error', text: 'Registration failed. Please try again.' }),
  });

  const saveProduct = useMutation({
    mutationFn: (data) => editingProduct
      ? base44.entities.SupplierProduct.update(editingProduct.id, data)
      : base44.entities.SupplierProduct.create({ ...data, supplier_id: mySupplierId, supplier_name: mySupplier?.company_name || '', status: 'pending_review' }),
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
      image_url: p.image_url || '', tier_pricing: p.tier_pricing || [],
    });
    setShowProductForm(true);
  };

  const handleAddToCart = (p) => {
    addToCart(p, p.min_order_qty || 1);
    setSubmitMsg({ type: 'success', text: `${p.product_name} added to cart.` });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProductForm(p => ({ ...p, image_url: file_url }));
      setSubmitMsg({ type: 'success', text: 'Image uploaded.' });
    } catch {
      setSubmitMsg({ type: 'error', text: 'Image upload failed. Try a URL instead.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const activeSuppliers = suppliers.filter(s => s.status === 'active');
  const filteredSuppliers = activeSuppliers.filter(s => {
    const matchSearch = s.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
      products.some(p => p.supplier_id === s.id && p.product_name?.toLowerCase().includes(search.toLowerCase()));
    const matchCat = catFilter === 'all' || s.category === catFilter;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sortBy === 'rating') {
      const ra = reviews.filter(r => r.supplier_id === a.id).reduce((s, r) => s + r.rating, 0) / Math.max(1, reviews.filter(r => r.supplier_id === a.id).length);
      const rb = reviews.filter(r => r.supplier_id === b.id).reduce((s, r) => s + r.rating, 0) / Math.max(1, reviews.filter(r => r.supplier_id === b.id).length);
      return rb - ra;
    }
    return 0;
  });

  const getRating = (sid) => {
    const r = reviews.filter(rv => rv.supplier_id === sid);
    return r.length > 0 ? (r.reduce((sum, rv) => sum + rv.rating, 0) / r.length).toFixed(1) : null;
  };
  const getSupplierProducts = (sid) => products.filter(p => p.supplier_id === sid && p.status === 'active');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a1a1a] border border-[#c5a059]/30 mb-6">
              <Store className="w-4 h-4 text-[#c5a059]" />
              <span className="font-inter text-xs tracking-wider text-[#c5a059] uppercase">Get OS Supplier Marketplace</span>
            </div>
            <h1 className="font-playfair text-4xl md:text-5xl text-white mb-4">Supplier Marketplace</h1>
            <p className="font-inter text-white/50 max-w-xl mx-auto text-sm leading-relaxed mb-8">
              Connect with verified suppliers. Browse products, place orders, and build lasting partnerships.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button onClick={() => setShowRegModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#d4af37] text-black rounded-lg font-inter text-sm font-semibold hover:opacity-90 transition-opacity">
                <UserPlus className="w-4 h-4" /> List Your Business
              </button>
              <button onClick={() => mySupplier ? setTab('dashboard') : setShowRegModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-[#d4af37] rounded-lg font-inter text-sm font-semibold hover:opacity-90 transition-opacity">
                <LayoutGrid className="w-4 h-4" /> Supplier Dashboard
              </button>
            </div>
          </motion.div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
            <span className="flex items-center gap-1.5 text-white/40 text-xs">
              <Check className="w-3.5 h-3.5 text-green-400" /> {activeSuppliers.length} Active Suppliers
            </span>
            <span className="flex items-center gap-1.5 text-white/40 text-xs">
              <Star className="w-3.5 h-3.5 text-[#d4af37]" /> Verified & Rated
            </span>
            <span className="flex items-center gap-1.5 text-white/40 text-xs">
              <Truck className="w-3.5 h-3.5 text-[#d4af37]" /> Direct Ordering
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message banner */}
        <AnimatePresence>
          {submitMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mb-6 p-4 rounded-xl border font-inter text-sm flex items-center gap-2 ${submitMsg.type === 'success' ? 'bg-green-400/10 border-green-400/20 text-green-400' : 'bg-red-400/10 border-red-400/20 text-red-400'}`}>
              {submitMsg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {submitMsg.text}
              <button onClick={() => setSubmitMsg(null)} className="ml-auto"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs */}
        <div className="flex items-center gap-1 border-b border-white/5 mb-5 overflow-x-auto">
          {['all', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap relative transition-colors ${
                catFilter === c ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}>
              {c === 'all' ? 'All' : CAT_LABELS[c] || c}
              {catFilter === c && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c5a059]" />}
            </button>
          ))}
        </div>

        {/* Search + Sort + Count */}
        <div className="flex items-center gap-3 flex-wrap mb-6">
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers or products..."
              className="bg-transparent text-white font-inter text-sm outline-none flex-1 placeholder:text-white/30" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm cursor-pointer">
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
          </select>
          <span className="text-white/40 text-sm font-inter">{filteredSuppliers.length} supplier(s)</span>
        </div>

        {/* Browse: Supplier Cards */}
        {tab === 'browse' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {filteredSuppliers.map(s => (
              <SupplierCard
                key={s.id}
                supplier={s}
                rating={getRating(s.id)}
                products={getSupplierProducts(s.id)}
                onAddToCart={handleAddToCart}
                onPlaceOrder={() => { setExpandedSupplier(s); setTab('suppliers'); }}
              />
            ))}
            {filteredSuppliers.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <Store className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="font-inter text-white/30 text-sm">No suppliers found.</p>
              </div>
            )}
          </div>
        )}

        {/* Cart Tab */}
        {tab === 'cart' && <MarketplaceCart />}

        {/* Suppliers Tab (directory) */}
        {tab === 'suppliers' && (
          <RFQPanel mode="buyer" buyerInfo={buyerInfo} />
        )}

        {/* RFQ Tab */}
        {tab === 'rfq' && (
          <RFQPanel mode={mySupplier ? 'supplier' : 'buyer'} mySupplierId={mySupplierId} mySupplier={mySupplier} buyerInfo={buyerInfo} />
        )}

        {/* Vendor Dashboard */}
        {tab === 'dashboard' && mySupplier && (
          <VendorDashboardV2
            supplier={mySupplier}
            orders={orders}
            onViewMarketplace={() => setTab('browse')}
            onLogout={logoutSupplier}
          />
        )}

        {tab === 'dashboard' && !mySupplier && (
          <div className="py-16 text-center">
            <Store className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="font-inter text-white/50 mb-4">You need to register as a supplier first.</p>
            <button onClick={() => setShowRegModal(true)} className="px-6 py-2.5 bg-[#d4af37] text-black rounded-lg font-inter text-sm font-semibold">Register Now</button>
          </div>
        )}

        {/* My Products Tab */}
        {tab === 'myproducts' && mySupplier && (
          <div className="space-y-5 mb-12">
            {mySupplier.status !== 'active' && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-orange-400/10 border border-orange-400/20 text-orange-400 font-inter text-sm">
                <Clock className="w-4 h-4" /> Your supplier account is currently {mySupplier.status}. Please contact the administrator.
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-inter text-white font-semibold text-lg">My Products</h3>
                <p className="text-white/40 font-inter text-xs mt-0.5">{myProducts.length} products listed</p>
              </div>
              <button onClick={() => { setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setShowProductForm(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#d4af37] text-black rounded-lg font-inter text-sm font-semibold hover:opacity-90">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myProducts.map(p => (
                <div key={p.id} className="bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden">
                  <div className="aspect-video bg-[#0a0a0a] flex items-center justify-center">
                    {p.image_url ? <img src={p.image_url} alt={p.product_name} className="w-full h-full object-cover" /> : <Box className="w-10 h-10 text-white/20" />}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-inter text-white font-semibold text-sm">{p.product_name}</p>
                      <span className={`font-inter text-[10px] px-2 py-0.5 rounded-full ${p.status === 'active' ? 'text-green-400 bg-green-400/10' : 'text-orange-400 bg-orange-400/10'}`}>
                        {p.status === 'active' ? 'Active' : 'Pending'}
                      </span>
                    </div>
                    <p className="font-playfair text-lg text-[#d4af37] mb-2">{formatKSh(p.unit_price)} <span className="font-inter text-xs text-white/40">/ {p.unit}</span></p>
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

        {/* Cart floating tab */}
        {cartCount > 0 && tab !== 'cart' && (
          <button onClick={() => setTab('cart')}
            className="fixed bottom-24 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-[#d4af37] text-black rounded-full font-inter text-sm font-semibold shadow-lg shadow-[#d4af37]/20 hover:scale-105 transition-transform">
            <ShoppingCart className="w-4 h-4" /> {cartCount}
          </button>
        )}

        {/* Supplier CTA Section */}
        <div className="bg-[#1a1a1a] rounded-2xl p-8 mt-12 flex items-center justify-between flex-wrap gap-6">
          <div className="max-w-md">
            <h2 className="font-playfair text-2xl text-white mb-2">Are you a supplier?</h2>
            <p className="font-inter text-white/50 text-sm leading-relaxed">
              Join our verified marketplace, showcase your products, and connect with hotels and restaurants in the Get OS network.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowRegModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-[#d4af37] text-black rounded-lg font-inter text-sm font-semibold hover:opacity-90">
              <UserPlus className="w-4 h-4" /> Join Marketplace
            </button>
            <button onClick={() => mySupplier ? setTab('dashboard') : setShowRegModal(true)}
              className="flex items-center gap-2 px-5 py-3 border border-[#d4af37] text-[#d4af37] rounded-lg font-inter text-sm font-semibold hover:bg-[#d4af37]/10">
              <LayoutGrid className="w-4 h-4" /> My Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <SupplierRegistrationModal
        open={showRegModal}
        onClose={() => setShowRegModal(false)}
        onSubmit={registerSupplier.mutate}
        pending={registerSupplier.isPending}
      />

      {/* Product Form Modal */}
      <AnimatePresence>
        {showProductForm && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-[#c5a059]/20 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2"><Package className="w-5 h-5 text-[#c5a059]" /><h3 className="font-inter text-white font-semibold">{editingProduct ? 'Edit Product' : 'List New Product'}</h3></div>
                <button onClick={() => setShowProductForm(false)}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Product Name</label>
                  <input value={productForm.product_name} onChange={e => setProductForm(p => ({ ...p, product_name: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Description</label>
                  <textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} rows={2}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-3 py-2 font-inter text-sm resize-none" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Category</label>
                  <select value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-3 py-2 font-inter text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c] || c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Unit (kg, liter, box...)</label>
                  <input value={productForm.unit} onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Unit Price (KSh)</label>
                  <input type="number" min={0} value={productForm.unit_price} onChange={e => setProductForm(p => ({ ...p, unit_price: +e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Min Order Qty</label>
                  <input type="number" min={1} value={productForm.min_order_qty} onChange={e => setProductForm(p => ({ ...p, min_order_qty: +e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div>
                  <label className="font-inter text-xs text-white/50 mb-1 block">Stock Available</label>
                  <input type="number" min={0} value={productForm.stock_available} onChange={e => setProductForm(p => ({ ...p, stock_available: +e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="font-inter text-xs text-white/50 mb-1 block">Product Image</label>
                  <div className="flex items-center gap-3">
                    <label className={`flex items-center gap-2 px-3 py-2 bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] rounded-lg font-inter text-sm cursor-pointer hover:bg-[#c5a059]/20 ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                    </label>
                    <input value={productForm.image_url} onChange={e => setProductForm(p => ({ ...p, image_url: e.target.value }))} placeholder="...or paste image URL"
                      className="flex-1 bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                  </div>
                  {productForm.image_url && (
                    <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-[#c5a059]/20">
                      <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setProductForm(p => ({ ...p, image_url: '' }))} className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowProductForm(false)} className="flex-1 py-2 border border-white/10 text-white/60 rounded-lg font-inter text-sm hover:bg-white/5">Cancel</button>
                <button onClick={() => saveProduct.mutate(productForm)} disabled={saveProduct.isPending || !productForm.product_name}
                  className="flex-1 py-2 bg-[#d4af37] text-black rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
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