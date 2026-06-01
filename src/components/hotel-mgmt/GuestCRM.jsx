import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Star, User, Phone, Mail, Crown, Search } from 'lucide-react';

export default function GuestCRM() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', nationality: '',
    id_type: 'national_id', id_number: '', allergies: '',
    dietary_preferences: [], room_preferences: [],
    vip_status: false, notes: '', preferred_room_type: '',
  });

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guest-profiles'],
    queryFn: () => base44.entities.GuestProfile.list('-created_date', 100),
  });

  const save = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.GuestProfile.update(editing.id, data)
      : base44.entities.GuestProfile.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guest-profiles'] }); setShowForm(false); setEditing(null); },
  });

  const openEdit = (guest) => {
    setEditing(guest);
    setForm({ ...guest });
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ full_name: '', email: '', phone: '', nationality: '', id_type: 'national_id', id_number: '', allergies: '', dietary_preferences: [], room_preferences: [], vip_status: false, notes: '', preferred_room_type: '' });
    setShowForm(true);
  };

  const filtered = guests.filter(g =>
    !search || g.full_name?.toLowerCase().includes(search.toLowerCase()) || g.email?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guests..."
            className="pl-10 bg-[#111] border-white/10 text-white" />
        </div>
        <Button onClick={openNew} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> Add Guest
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-white">{guests.length}</div>
          <div className="text-xs text-white/40 mt-1">Total Guests</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/20 p-4 text-center">
          <div className="text-2xl font-bold text-[#c9a962]">{guests.filter(g => g.vip_status).length}</div>
          <div className="text-xs text-white/40 mt-1">VIP Guests</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-white">
            KES {guests.reduce((s, g) => s + (g.total_spent || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-white/40 mt-1">Total Revenue</div>
        </div>
      </div>

      {/* Guest Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(g => (
          <div key={g.id} onClick={() => openEdit(g)}
            className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 cursor-pointer hover:border-[#c9a962]/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#c9a962]/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#c9a962]" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-medium text-sm">{g.full_name}</span>
                    {g.vip_status && <Crown className="w-3 h-3 text-[#c9a962]" />}
                  </div>
                  <div className="text-white/40 text-xs">{g.nationality || 'N/A'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[#c9a962] text-xs font-medium">{g.total_stays || 0} stays</div>
                <div className="text-white/30 text-xs">{g.loyalty_points || 0} pts</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-white/40"><Mail className="w-3 h-3" />{g.email}</div>
              <div className="flex items-center gap-1 text-xs text-white/40"><Phone className="w-3 h-3" />{g.phone}</div>
            </div>
            {g.dietary_preferences?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {g.dietary_preferences.slice(0, 3).map(d => (
                  <span key={d} className="text-xs bg-[#c9a962]/10 text-[#c9a962]/80 px-1.5 py-0.5 rounded">{d}</span>
                ))}
              </div>
            )}
            <div className="text-white/30 text-xs mt-2">Total spent: KES {(g.total_spent||0).toLocaleString()}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-white/30">No guests found</div>
        )}
      </div>

      {/* Guest Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold">{editing ? 'Edit Guest' : 'New Guest Profile'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }}><X className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="space-y-4">
              {[['full_name','Full Name','text'],['email','Email','email'],['phone','Phone','tel'],
                ['nationality','Nationality','text'],['id_number','ID Number','text']].map(([key,label,type]) => (
                <div key={key}>
                  <label className="text-white/60 text-xs mb-1 block">{label}</label>
                  <Input type={type} value={form[key] || ''} onChange={e => setForm(f=>({...f,[key]:e.target.value}))}
                    className="bg-[#111] border-white/10 text-white" />
                </div>
              ))}
              <div>
                <label className="text-white/60 text-xs mb-1 block">ID Type</label>
                <select value={form.id_type} onChange={e => setForm(f=>({...f,id_type:e.target.value}))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="national_id">National ID</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Preferred Room Type</label>
                <select value={form.preferred_room_type || ''} onChange={e => setForm(f=>({...f,preferred_room_type:e.target.value}))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Any</option>
                  {['standard','deluxe','suite','penthouse','family'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Allergies</label>
                <Input value={form.allergies || ''} onChange={e => setForm(f=>({...f,allergies:e.target.value}))}
                  className="bg-[#111] border-white/10 text-white" placeholder="e.g. nuts, dairy" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="vip" checked={!!form.vip_status} onChange={e => setForm(f=>({...f,vip_status:e.target.checked}))} />
                <label htmlFor="vip" className="text-white/70 text-sm flex items-center gap-1"><Crown className="w-3 h-3 text-[#c9a962]" /> VIP Guest</label>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Notes</label>
                <textarea value={form.notes || ''} onChange={e => setForm(f=>({...f,notes:e.target.value}))}
                  rows={2} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              </div>
              <Button onClick={() => save.mutate(form)} disabled={!form.full_name || !form.email}
                className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">
                {editing ? 'Update Guest' : 'Add Guest'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}