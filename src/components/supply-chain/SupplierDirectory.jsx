import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Star, Phone, Mail, MapPin, Edit, Archive, X, Check } from 'lucide-react';

const CATEGORIES = ['food', 'beverage', 'cleaning', 'furniture', 'linen', 'maintenance', 'other'];
const STATUS_COLORS = { active: 'text-green-400 bg-green-400/10', suspended: 'text-orange-400 bg-orange-400/10', archived: 'text-white/30 bg-white/5' };
const EMPTY = { company_name: '', contact_person: '', phone: '', email: '', address: '', tax_pin: '', category: 'food', payment_terms: 'Net 30', status: 'active', rating: 0, notes: '' };

export default function SupplierDirectory() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const qc = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list('-created_date', 200),
  });

  const save = useMutation({
    mutationFn: (data) => editing ? base44.entities.Supplier.update(editing.id, data) : base44.entities.Supplier.create(data),
    onSuccess: () => { qc.invalidateQueries(['suppliers']); setShowForm(false); setEditing(null); setForm(EMPTY); }
  });

  const archive = useMutation({
    mutationFn: (id) => base44.entities.Supplier.update(id, { status: 'archived' }),
    onSuccess: () => qc.invalidateQueries(['suppliers']),
  });

  const filtered = suppliers.filter(s => {
    const matchSearch = s.company_name?.toLowerCase().includes(search.toLowerCase()) || s.contact_person?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || s.category === catFilter;
    return matchSearch && matchCat;
  });

  const openEdit = (s) => { setEditing(s); setForm({ ...EMPTY, ...s }); setShowForm(true); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-inter text-white font-semibold text-lg">Supplier Directory</h3>
          <p className="text-white/40 font-inter text-xs mt-0.5">{suppliers.filter(s=>s.status==='active').length} active suppliers</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90 transition-all">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
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
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4 hover:border-[#c9a962]/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-inter font-semibold text-sm">{s.company_name}</p>
                <p className="text-white/50 font-inter text-xs">{s.contact_person}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className={`font-inter text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[s.status]}`}>{s.status}</span>
              </div>
            </div>
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-white/30" /><span className="text-white/60 font-inter text-xs">{s.phone}</span></div>
              <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-white/30" /><span className="text-white/60 font-inter text-xs">{s.email}</span></div>
              {s.address && <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-white/30" /><span className="text-white/60 font-inter text-xs">{s.address}</span></div>}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= (s.rating||0) ? 'text-[#c9a962] fill-[#c9a962]' : 'text-white/20'}`} />)}
              </div>
              <span className="font-inter text-xs px-2 py-0.5 bg-white/5 text-white/50 rounded-full capitalize">{s.category}</span>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
              <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all">
                <Edit className="w-3 h-3" /><span className="font-inter text-xs">Edit</span>
              </button>
              {s.status !== 'archived' && (
                <button onClick={() => archive.mutate(s.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-red-400/10 rounded-lg text-white/60 hover:text-red-400 transition-all">
                  <Archive className="w-3 h-3" /><span className="font-inter text-xs">Archive</span>
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-12 text-center text-white/30 font-inter text-sm">No suppliers found. Add your first supplier.</div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-inter text-white font-semibold">{editing ? 'Edit Supplier' : 'New Supplier'}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
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
                  <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
                </div>
              ))}
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-inter text-xs text-white/50 mb-1 block">Rating (1-5)</label>
                <input type="number" min={0} max={5} value={form.rating || 0} onChange={e => setForm(p => ({ ...p, rating: +e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
              <div className="col-span-2">
                <label className="font-inter text-xs text-white/50 mb-1 block">Notes</label>
                <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-[#c9a962]/20 text-white/60 rounded-lg font-inter text-sm hover:bg-white/5">Cancel</button>
              <button onClick={() => save.mutate(form)} disabled={save.isPending}
                className="flex-1 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold disabled:opacity-50">
                {save.isPending ? 'Saving...' : 'Save Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}