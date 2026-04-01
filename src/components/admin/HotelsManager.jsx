import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, MapPin, Phone, Mail, Clock, Globe, X, Check, ExternalLink, Shield, MessageCircle, QrCode } from 'lucide-react';
import HotelQRCode from '@/components/hotel/HotelQRCode';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

const EMPTY_HOTEL = {
  name: '', slug: '', location: '', address: '', phone: '', email: '',
  description: '', image_url: '', owner_email: '', opening_hours: '',
  latitude: '', longitude: '', is_active: true
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Collapsible QR code panel per hotel card */
function QRToggle({ hotel }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-white/30 hover:text-[#c9a962] font-inter text-xs transition-colors"
      >
        <QrCode className="w-3.5 h-3.5" /> {open ? 'Hide QR Code' : 'Show QR Code'}
      </button>
      {open && (
        <div className="mt-3 flex justify-center">
          <HotelQRCode hotel={hotel} size={140} />
        </div>
      )}
    </div>
  );
}

export default function HotelsManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null = closed, {} = new, hotel = edit
  const [form, setForm] = useState(EMPTY_HOTEL);

  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['hotels-admin'],
    queryFn: () => base44.entities.Hotel.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Hotel.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hotels-admin'] }); toast.success('Hotel created!'); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Hotel.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hotels-admin'] }); toast.success('Hotel updated!'); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Hotel.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hotels-admin'] }); toast.success('Hotel deleted'); },
  });

  const openNew = () => { setForm(EMPTY_HOTEL); setEditing('new'); };
  const openEdit = (h) => { setForm({ ...h, latitude: h.latitude || '', longitude: h.longitude || '' }); setEditing(h.id); };

  const handleNameChange = (val) => {
    setForm(f => ({ ...f, name: val, slug: editing === 'new' ? slugify(val) : f.slug }));
  };

  const handleSave = () => {
    const payload = {
      ...form,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
    };
    if (editing === 'new') createMutation.mutate(payload);
    else updateMutation.mutate({ id: editing, data: payload });
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1 block">{label}</label>
      <Input
        type={type}
        value={form[key] ?? ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/20"
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-playfair text-2xl text-white">Hotel Locations</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a962] text-[#0a0a0a] font-inter text-sm font-medium hover:bg-[#e4d5a7] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {editing !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-[#1a1a1a] px-6 pt-6 pb-4 border-b border-[#c9a962]/10 flex items-center justify-between z-10">
                <h3 className="font-playfair text-xl text-white">
                  {editing === 'new' ? 'Add New Location' : 'Edit Location'}
                </h3>
                <button onClick={() => setEditing(null)} className="p-1 text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">{field('Hotel Name *', 'name', 'text', 'e.g. Hermanas Bites Westlands')}</div>
                {/* Auto-slug preview */}
                <div className="sm:col-span-2">
                  <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1 block">URL Slug *</label>
                  <div className="flex items-center gap-2">
                    <span className="font-inter text-xs text-white/30">/hotel/</span>
                    <Input
                      value={form.slug}
                      onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                      placeholder="westlands"
                      className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/20"
                    />
                  </div>
                </div>
                {field('Location / City *', 'location', 'text', 'e.g. Nairobi')}
                {field('Full Address', 'address', 'text', 'e.g. 123 Westlands Road')}
                {field('Phone', 'phone', 'text', '+254 700 000 000')}
                {field('Email', 'email', 'email', 'branch@hermanasbites.com')}
                {field('Opening Hours', 'opening_hours', 'text', 'Mon-Sun 8am-10pm')}
                {field('Owner Email', 'owner_email', 'email', 'manager@example.com')}
                {field('Cover Image URL', 'image_url', 'text', 'https://...')}
                {field('Logo URL', 'logo_url', 'text', 'https://... (shown in navbar)')}
                <div className="sm:col-span-2">
                  <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1 block">WhatsApp Number (for order notifications)</label>
                  <div className="flex items-center gap-2">
                    <span className="font-inter text-xs text-white/30">+</span>
                    <Input
                      value={form.whatsapp_number ?? ''}
                      onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="254700000000 (no + or spaces)"
                      className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/20"
                    />
                  </div>
                  <p className="font-inter text-xs text-white/30 mt-1">Customers will be redirected here after placing an order.</p>
                </div>
                {field('Latitude', 'latitude', 'number', '-1.286389')}
                {field('Longitude', 'longitude', 'number', '36.817223')}
                <div className="sm:col-span-2">
                  <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="A short description of this location..."
                    className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 rounded-lg px-3 py-2 font-inter text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a962]/50 resize-none"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={!!form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="accent-[#c9a962]"
                  />
                  <label htmlFor="is_active" className="font-inter text-sm text-white/70">Active (visible to customers)</label>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3 justify-end">
                <button
                  onClick={() => setEditing(null)}
                  className="px-5 py-2 rounded-full border border-[#c9a962]/20 text-white/60 font-inter text-sm hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name || !form.slug || !form.location}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#c9a962] text-[#0a0a0a] font-inter text-sm font-medium hover:bg-[#e4d5a7] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  {editing === 'new' ? 'Create Hotel' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hotel List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
        </div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#c9a962]/20 rounded-2xl">
          <p className="font-inter text-white/40 mb-4">No hotel locations yet.</p>
          <button onClick={openNew} className="text-[#c9a962] font-inter text-sm hover:underline">Add your first location</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotels.map(hotel => (
            <div key={hotel.id} className="bg-[#0a0a0a] rounded-xl p-5 border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-playfair text-lg text-white">{hotel.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full font-inter text-xs ${hotel.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {hotel.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span className="font-inter text-xs text-[#c9a962]/70 font-mono">/hotel/{hotel.slug}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(hotel)} className="p-2 rounded-lg text-white/40 hover:text-[#c9a962] hover:bg-[#c9a962]/10 transition-all">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete ${hotel.name}?`)) deleteMutation.mutate(hotel.id); }}
                    className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {hotel.location && <div className="flex items-center gap-2 text-white/40"><MapPin className="w-3.5 h-3.5 text-[#c9a962]" /><span className="font-inter text-xs">{hotel.location}</span></div>}
                {hotel.address && <div className="flex items-center gap-2 text-white/40"><Globe className="w-3.5 h-3.5 text-[#c9a962]" /><span className="font-inter text-xs">{hotel.address}</span></div>}
                {hotel.phone && <div className="flex items-center gap-2 text-white/40"><Phone className="w-3.5 h-3.5 text-[#c9a962]" /><span className="font-inter text-xs">{hotel.phone}</span></div>}
                {hotel.opening_hours && <div className="flex items-center gap-2 text-white/40"><Clock className="w-3.5 h-3.5 text-[#c9a962]" /><span className="font-inter text-xs">{hotel.opening_hours}</span></div>}
                {hotel.owner_email && <div className="flex items-center gap-2 text-white/40"><Mail className="w-3.5 h-3.5 text-[#c9a962]" /><span className="font-inter text-xs">Owner: {hotel.owner_email}</span></div>}
              </div>
              {/* Quick Links */}
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#c9a962]/10">
                <a
                  href={`/hotel/${hotel.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c9a962]/10 text-[#c9a962] font-inter text-xs hover:bg-[#c9a962]/20 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> View Hotel
                </a>
                <a
                  href={`/hotel/${hotel.slug}/admin`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 font-inter text-xs hover:bg-white/10 transition-colors"
                >
                  <Shield className="w-3 h-3" /> Hotel Admin
                </a>
                {hotel.whatsapp_number && (
                  <a
                    href={`https://wa.me/${hotel.whatsapp_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 font-inter text-xs hover:bg-green-500/20 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </a>
                )}
              </div>

              {/* QR Code collapsible */}
              <QRToggle hotel={hotel} />
            </div>
          ))}
              </div>
      )}
    </div>
  );
}