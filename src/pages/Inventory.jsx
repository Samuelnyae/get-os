import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, AlertTriangle, Plus, Pencil, Trash2, X,
  CheckCircle, Search, RefreshCw, Link as LinkIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const CATEGORIES = ['all', 'proteins', 'vegetables', 'grains', 'dairy', 'beverages', 'spices', 'other'];
const UNITS = ['kg', 'g', 'L', 'ml', 'pieces', 'bottles', 'packs'];

function StockBadge({ current, threshold }) {
  const pct = threshold > 0 ? (current / threshold) : 1;
  if (current === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">Out of Stock</span>;
  if (pct <= 1) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">Low Stock</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">In Stock</span>;
}

export default function Inventory() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', unit: 'kg', current_stock: 0, low_stock_threshold: 10,
    deduct_per_order: 1, supplier: '', cost_per_unit: '', category: 'other',
    notes: '', linked_menu_item_ids: []
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.Inventory.list(),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items-for-inventory'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Inventory.update(editing.id, data)
      : base44.entities.Inventory.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(editing ? 'Item updated' : 'Item added');
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Inventory.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item deleted');
    },
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, amount, current }) =>
      base44.entities.Inventory.update(id, { current_stock: current + amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Stock updated');
    },
  });

  const openForm = (item = null) => {
    if (item) {
      setEditing(item);
      setForm({ ...item });
    } else {
      setEditing(null);
      setForm({ name: '', unit: 'kg', current_stock: 0, low_stock_threshold: 10, deduct_per_order: 1, supplier: '', cost_per_unit: '', category: 'other', notes: '', linked_menu_item_ids: [] });
    }
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      current_stock: Number(form.current_stock),
      low_stock_threshold: Number(form.low_stock_threshold),
      deduct_per_order: Number(form.deduct_per_order),
      cost_per_unit: form.cost_per_unit ? Number(form.cost_per_unit) : undefined,
    });
  };

  const toggleMenuLink = (id) => {
    setForm(f => ({
      ...f,
      linked_menu_item_ids: f.linked_menu_item_ids.includes(id)
        ? f.linked_menu_item_ids.filter(x => x !== id)
        : [...f.linked_menu_item_ids, id]
    }));
  };

  const filtered = items.filter(i => {
    const matchCat = category === 'all' || i.category === category;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const lowStockItems = items.filter(i => i.current_stock <= i.low_stock_threshold && i.current_stock > 0);
  const outOfStock = items.filter(i => i.current_stock === 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-playfair text-3xl md:text-4xl" style={{ background: 'linear-gradient(135deg, #c9a962 0%, #e4d5a7 50%, #c9a962 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Inventory Management
            </h1>
            <p className="font-inter text-white/50 text-sm mt-1">Track stock levels and link ingredients to menu items</p>
          </div>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9a962] hover:bg-[#e4d5a7] text-[#0a0a0a] font-inter font-semibold text-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Inventory Item
          </button>
        </div>

        {/* Alert Banners */}
        {outOfStock.length > 0 && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-inter font-semibold text-red-400 text-sm">OUT OF STOCK ({outOfStock.length} items)</p>
              <p className="font-inter text-white/60 text-xs mt-0.5">{outOfStock.map(i => i.name).join(', ')}</p>
            </div>
          </div>
        )}
        {lowStockItems.length > 0 && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-inter font-semibold text-amber-400 text-sm">LOW STOCK ALERT ({lowStockItems.length} items)</p>
              <p className="font-inter text-white/60 text-xs mt-0.5">{lowStockItems.map(i => `${i.name} (${i.current_stock} ${i.unit})`).join(', ')}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Items', value: items.length, icon: Package, color: 'text-[#c9a962]' },
            { label: 'In Stock', value: items.filter(i => i.current_stock > i.low_stock_threshold).length, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Low Stock', value: lowStockItems.length, icon: AlertTriangle, color: 'text-amber-400' },
            { label: 'Out of Stock', value: outOfStock.length, icon: AlertTriangle, color: 'text-red-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#1a1a1a] rounded-xl p-4 border border-[#c9a962]/10">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="font-playfair text-2xl text-white">{stat.value}</p>
              <p className="font-inter text-xs text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..." className="pl-9 bg-[#1a1a1a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-inter capitalize transition-all ${category === c ? 'bg-[#c9a962] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-white/60 hover:bg-[#c9a962]/10 border border-[#c9a962]/10'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-inter">No inventory items found</p>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#c9a962]/10">
                    {['Item', 'Category', 'Stock', 'Threshold', 'Deduct/Order', 'Linked Items', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-inter text-xs text-[#c9a962] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => {
                    const linked = menuItems.filter(m => item.linked_menu_item_ids?.includes(m.id));
                    return (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                        className="border-b border-[#c9a962]/5 hover:bg-[#c9a962]/5 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-inter font-medium text-white text-sm">{item.name}</p>
                          {item.supplier && <p className="font-inter text-xs text-white/40">{item.supplier}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-inter text-xs text-white/60 capitalize">{item.category}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-inter font-semibold text-white">{item.current_stock}</span>
                            <span className="font-inter text-xs text-white/40">{item.unit}</span>
                            <button onClick={() => restockMutation.mutate({ id: item.id, amount: 10, current: item.current_stock })}
                              title="Quick +10 restock"
                              className="p-1 rounded hover:bg-[#c9a962]/20 text-[#c9a962]/60 hover:text-[#c9a962] transition-all">
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-inter text-xs text-white/60">{item.low_stock_threshold} {item.unit}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-inter text-xs text-white/60">{item.deduct_per_order} {item.unit}</span>
                        </td>
                        <td className="px-4 py-3">
                          {linked.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {linked.slice(0, 2).map(m => (
                                <span key={m.id} className="text-xs px-1.5 py-0.5 rounded bg-[#c9a962]/10 text-[#c9a962]/80">{m.name}</span>
                              ))}
                              {linked.length > 2 && <span className="text-xs text-white/40">+{linked.length - 2}</span>}
                            </div>
                          ) : <span className="text-xs text-white/30">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <StockBadge current={item.current_stock} threshold={item.low_stock_threshold} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openForm(item)} className="p-1.5 rounded hover:bg-[#c9a962]/20 text-white/60 hover:text-[#c9a962] transition-all">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteMutation.mutate(item.id)} className="p-1.5 rounded hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-2xl my-4">
              <div className="flex items-center justify-between p-6 border-b border-[#c9a962]/10">
                <h2 className="font-playfair text-xl text-white">{editing ? 'Edit Item' : 'Add Inventory Item'}</h2>
                <button onClick={closeForm} className="p-2 rounded-full hover:bg-white/10 text-white/60"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1.5">Name *</label>
                    <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Chicken Breast" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1.5">Unit *</label>
                    <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full h-9 rounded-md border border-[#c9a962]/20 bg-[#0a0a0a] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c9a962]">
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1.5">Current Stock *</label>
                    <Input type="number" min="0" required value={form.current_stock} onChange={e => setForm(f => ({ ...f, current_stock: e.target.value }))} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1.5">Low Stock Alert Threshold</label>
                    <Input type="number" min="0" value={form.low_stock_threshold} onChange={e => setForm(f => ({ ...f, low_stock_threshold: e.target.value }))} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1.5">Deduct Per Order</label>
                    <Input type="number" min="0" step="0.1" value={form.deduct_per_order} onChange={e => setForm(f => ({ ...f, deduct_per_order: e.target.value }))} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1.5">Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full h-9 rounded-md border border-[#c9a962]/20 bg-[#0a0a0a] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c9a962]">
                      {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1.5">Supplier</label>
                    <Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Supplier name" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1.5">Cost per Unit (KES)</label>
                    <Input type="number" min="0" value={form.cost_per_unit} onChange={e => setForm(f => ({ ...f, cost_per_unit: e.target.value }))} placeholder="0" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                  </div>
                </div>

                {/* Link to Menu Items */}
                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> Link to Menu Items
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {menuItems.map(m => (
                      <label key={m.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all text-xs ${form.linked_menu_item_ids.includes(m.id) ? 'border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]' : 'border-[#c9a962]/10 text-white/60 hover:border-[#c9a962]/30'}`}>
                        <input type="checkbox" className="hidden" checked={form.linked_menu_item_ids.includes(m.id)} onChange={() => toggleMenuLink(m.id)} />
                        <span className="truncate">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1.5">Notes</label>
                  <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saveMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-[#c9a962] hover:bg-[#e4d5a7] text-[#0a0a0a] font-inter font-semibold text-sm transition-all disabled:opacity-50">
                    {saveMutation.isPending ? 'Saving...' : (editing ? 'Update Item' : 'Add Item')}
                  </button>
                  <button type="button" onClick={closeForm} className="px-6 py-2.5 rounded-xl border border-[#c9a962]/20 text-white/60 hover:bg-white/5 font-inter text-sm transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}