import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Pencil, Trash2, BedDouble } from 'lucide-react';

const EMPTY_FORM = {
  room_number: '', room_type: 'standard', floor: 1, capacity: 2,
  price_per_night: '', description: '', status: 'available',
  amenities: [], image_url: '',
};

const AMENITY_OPTIONS = ['WiFi', 'TV', 'AC', 'Minibar', 'Room Service', 'Balcony', 'Jacuzzi', 'King Bed', 'Hot Water', 'Safe', 'Bathtub', 'Private Pool', 'Butler', 'Crib', 'Bunk Beds'];

const STATUS_COLORS = {
  available:   'bg-emerald-500/20 text-emerald-400',
  occupied:    'bg-blue-500/20 text-blue-400',
  reserved:    'bg-amber-500/20 text-amber-400',
  maintenance: 'bg-red-500/20 text-red-400',
  cleaning:    'bg-purple-500/20 text-purple-400',
};

export default function RoomManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const save = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Room.update(editing.id, data)
      : base44.entities.Room.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); closeForm(); },
  });

  const deleteRoom = useMutation({
    mutationFn: (id) => base44.entities.Room.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); setDeleteConfirm(null); },
  });

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (room) => { setEditing(room); setForm({ ...room }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const toggleAmenity = (a) => setForm(f => ({
    ...f,
    amenities: f.amenities?.includes(a) ? f.amenities.filter(x => x !== a) : [...(f.amenities || []), a],
  }));

  const sortedRooms = [...rooms].sort((a, b) => a.room_number?.localeCompare(b.room_number, undefined, { numeric: true }));

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#c9a962]/30 border-t-[#c9a962] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Room Inventory</h3>
          <p className="text-white/40 text-sm">{rooms.length} rooms configured</p>
        </div>
        <Button onClick={openNew} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> Add Room
        </Button>
      </div>

      {/* Room Table */}
      <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Room', 'Type', 'Floor', 'Capacity', 'Price/Night', 'Status', 'Amenities', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-white/40 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRooms.map(room => (
              <tr key={room.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-[#c9a962]" />
                    <span className="text-white font-medium">#{room.room_number}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/70 capitalize">{room.room_type}</td>
                <td className="px-4 py-3 text-white/70">{room.floor}</td>
                <td className="px-4 py-3 text-white/70">{room.capacity} guests</td>
                <td className="px-4 py-3 text-[#c9a962]">KES {(room.price_per_night || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[room.status] || STATUS_COLORS.available}`}>
                    {room.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[160px]">
                    {(room.amenities || []).slice(0, 3).map(a => (
                      <span key={a} className="text-xs bg-white/5 text-white/40 px-1.5 py-0.5 rounded">{a}</span>
                    ))}
                    {(room.amenities || []).length > 3 && (
                      <span className="text-xs text-white/30">+{room.amenities.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(room)}
                      className="p-1.5 rounded-lg bg-[#c9a962]/10 text-[#c9a962] hover:bg-[#c9a962]/20 transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(room)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-white/30">No rooms yet. Add your first room!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">{editing ? `Edit Room #${editing.room_number}` : 'Add New Room'}</h3>
              <button onClick={closeForm}><X className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Room Number *</label>
                  <Input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))}
                    className="bg-[#111] border-white/10 text-white" placeholder="e.g. 101" />
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Floor</label>
                  <Input type="number" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: Number(e.target.value) }))}
                    className="bg-[#111] border-white/10 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Room Type</label>
                  <select value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                    {['standard', 'deluxe', 'suite', 'penthouse', 'family'].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Capacity (guests)</label>
                  <Input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                    className="bg-[#111] border-white/10 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Price per Night (KES) *</label>
                  <Input type="number" value={form.price_per_night} onChange={e => setForm(f => ({ ...f, price_per_night: Number(e.target.value) }))}
                    className="bg-[#111] border-white/10 text-white" placeholder="e.g. 5500" />
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                    {['available', 'occupied', 'reserved', 'maintenance', 'cleaning'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Image URL</label>
                <Input value={form.image_url || ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  className="bg-[#111] border-white/10 text-white" placeholder="https://..." />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Description</label>
                <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-2 block">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map(a => (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        form.amenities?.includes(a)
                          ? 'bg-[#c9a962]/20 border-[#c9a962]/40 text-[#c9a962]'
                          : 'border-white/10 text-white/50 hover:text-white'
                      }`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={() => save.mutate(form)} disabled={!form.room_number || !form.price_per_night || save.isPending}
                className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black font-medium">
                {save.isPending ? 'Saving...' : editing ? 'Update Room' : 'Add Room'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-red-500/20 p-6 max-w-sm w-full text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Delete Room #{deleteConfirm.room_number}?</h3>
            <p className="text-white/40 text-sm mb-6">This cannot be undone. All booking data linked to this room will be orphaned.</p>
            <div className="flex gap-3">
              <Button onClick={() => setDeleteConfirm(null)} variant="outline" className="flex-1 border-white/10 text-white/60">Cancel</Button>
              <Button onClick={() => deleteRoom.mutate(deleteConfirm.id)} className="flex-1 bg-red-600 hover:bg-red-500 text-white">Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}