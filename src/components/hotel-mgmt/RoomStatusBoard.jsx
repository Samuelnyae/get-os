import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BedDouble, Coffee, Wrench, Sparkles, Moon, CheckCircle, AlertCircle } from 'lucide-react';


const STATUS_CONFIG = {
  available:    { label: 'Available',    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  occupied:     { label: 'Occupied',     color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',         dot: 'bg-blue-400' },
  reserved:     { label: 'Reserved',     color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',      dot: 'bg-amber-400' },
  maintenance:  { label: 'Maintenance',  color: 'bg-red-500/20 text-red-400 border-red-500/30',            dot: 'bg-red-400' },
  cleaning:     { label: 'Cleaning',     color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',   dot: 'bg-purple-400' },
};

const TYPE_ICONS = {
  standard: BedDouble, deluxe: BedDouble, suite: Sparkles, penthouse: Sparkles, family: BedDouble
};

export default function RoomStatusBoard({ onSelectRoom, onOpenMinibar }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const toggleDND = useMutation({
    mutationFn: ({ id, val }) => base44.entities.Room.update(id, { do_not_disturb: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Room.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = rooms.filter(r => r.status === s).length;
    return acc;
  }, {});

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#c9a962]/30 border-t-[#c9a962] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
          <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
            className={`rounded-xl border p-3 text-left transition-all ${filter === s ? 'ring-2 ring-[#c9a962]' : ''} ${cfg.color}`}>
            <div className="text-2xl font-bold">{counts[s] || 0}</div>
            <div className="text-xs mt-1">{cfg.label}</div>
          </button>
        ))}
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map(room => {
          const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.available;
          const Icon = TYPE_ICONS[room.room_type] || BedDouble;
          return (
            <div key={room.id} className={`bg-[#1a1a1a] rounded-xl border p-4 cursor-pointer hover:ring-1 hover:ring-[#c9a962]/50 transition-all ${cfg.color}`}
              onClick={() => onSelectRoom?.(room)}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-white text-lg">#{room.room_number}</span>
                {room.do_not_disturb && <Moon className="w-4 h-4 text-amber-400" />}
              </div>
              <Icon className="w-6 h-6 mb-2 opacity-60" />
              <div className="text-xs capitalize mb-1 opacity-80">{room.room_type}</div>
              <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </div>
              <div className="text-xs text-white/40 mt-2">KES {(room.price_per_night || 0).toLocaleString()}/night</div>

              {/* Quick actions */}
              <div className="flex gap-1 mt-3" onClick={e => e.stopPropagation()}>
                <button title="Toggle DND" onClick={() => toggleDND.mutate({ id: room.id, val: !room.do_not_disturb })}
                  className={`flex-1 text-xs py-1 rounded-lg border transition-all ${room.do_not_disturb ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'border-white/10 text-white/40 hover:text-amber-400'}`}>
                  <Moon className="w-3 h-3 mx-auto" />
                </button>
                {(room.status === 'occupied' || room.status === 'reserved') && onOpenMinibar && (
                  <button title="Minibar" onClick={() => onOpenMinibar(room)}
                    className="flex-1 text-xs py-1 rounded-lg border border-[#c9a962]/30 text-[#c9a962] hover:bg-[#c9a962]/10 transition-all">
                    <Coffee className="w-3 h-3 mx-auto" />
                  </button>
                )}
                {room.status === 'cleaning' && (
                  <button title="Mark Available" onClick={() => updateStatus.mutate({ id: room.id, status: 'available' })}
                    className="flex-1 text-xs py-1 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all">
                    <CheckCircle className="w-3 h-3 mx-auto" />
                  </button>
                )}
                {room.status === 'available' && (
                  <button title="Set Cleaning" onClick={() => updateStatus.mutate({ id: room.id, status: 'cleaning' })}
                    className="flex-1 text-xs py-1 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-all">
                    <Sparkles className="w-3 h-3 mx-auto" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-white/40">No rooms found</div>
        )}
      </div>
    </div>
  );
}