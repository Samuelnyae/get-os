import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coffee, Plus, Minus, RefreshCw, ShoppingBag, AlertTriangle } from 'lucide-react';

const DEFAULT_MINIBAR = [
  { name: 'Water (500ml)', quantity: 4, price: 100, consumed: 0 },
  { name: 'Soda (330ml)', quantity: 4, price: 150, consumed: 0 },
  { name: 'Beer (330ml)', quantity: 2, price: 300, consumed: 0 },
  { name: 'Wine (miniature)', quantity: 2, price: 500, consumed: 0 },
  { name: 'Juice (250ml)', quantity: 3, price: 120, consumed: 0 },
  { name: 'Snack Bar', quantity: 3, price: 200, consumed: 0 },
  { name: 'Nuts', quantity: 2, price: 180, consumed: 0 },
  { name: 'Coffee Sachet', quantity: 5, price: 80, consumed: 0 },
];

export default function MinibarManager({ preSelectedRoom = null }) {
  const qc = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState(preSelectedRoom);

  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => base44.entities.Room.list() });

  const updateMinibar = useMutation({
    mutationFn: ({ id, minibar_items }) => base44.entities.Room.update(id, { minibar_items }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const initMinibar = (room) => {
    if (!room.minibar_items || room.minibar_items.length === 0) {
      updateMinibar.mutate({ id: room.id, minibar_items: DEFAULT_MINIBAR });
    }
  };

  const updateConsumed = (room, idx, delta) => {
    const items = [...(room.minibar_items || [])];
    const item = { ...items[idx] };
    item.consumed = Math.max(0, Math.min(item.quantity, (item.consumed || 0) + delta));
    items[idx] = item;
    updateMinibar.mutate({ id: room.id, minibar_items: items });
    // Sync local selected
    setSelectedRoom(r => r ? { ...r, minibar_items: items } : r);
  };

  const restock = (room) => {
    const items = (room.minibar_items || []).map(i => ({ ...i, consumed: 0 }));
    updateMinibar.mutate({ id: room.id, minibar_items: items });
    setSelectedRoom(r => r ? { ...r, minibar_items: items } : r);
  };

  const occupiedRooms = rooms.filter(r => r.status === 'occupied' || r.status === 'reserved');
  const currentRoom = rooms.find(r => r.id === selectedRoom?.id) || selectedRoom;

  const totalConsumedValue = (currentRoom?.minibar_items || []).reduce((s, i) => s + ((i.consumed || 0) * (i.price || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Room Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {occupiedRooms.map(room => {
          const items = room.minibar_items || [];
          const consumed = items.reduce((s, i) => s + (i.consumed || 0), 0);
          const hasLow = items.some(i => (i.quantity - (i.consumed || 0)) <= 1);
          return (
            <button key={room.id}
              onClick={() => { setSelectedRoom(room); initMinibar(room); }}
              className={`bg-[#1a1a1a] rounded-xl border p-4 text-left transition-all ${selectedRoom?.id === room.id ? 'border-[#c9a962]/40 ring-1 ring-[#c9a962]/20' : 'border-white/10 hover:border-[#c9a962]/20'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">#{room.room_number}</span>
                {hasLow && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="text-xs text-white/40 capitalize">{room.room_type}</div>
              {consumed > 0 && <div className="text-xs text-[#c9a962] mt-1">{consumed} items consumed</div>}
            </button>
          );
        })}
        {occupiedRooms.length === 0 && (
          <div className="col-span-full text-center py-8 text-white/30 text-sm">No occupied rooms</div>
        )}
      </div>

      {/* Minibar Detail */}
      {currentRoom && (
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-semibold">Room #{currentRoom.room_number} Minibar</h3>
              <p className="text-white/40 text-sm capitalize">{currentRoom.room_type}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right mr-2">
                <div className="text-[#c9a962] font-bold">KES {totalConsumedValue.toLocaleString()}</div>
                <div className="text-xs text-white/40">Charges</div>
              </div>
              <Button onClick={() => restock(currentRoom)} size="sm" variant="outline"
                className="border-white/10 text-white/60 hover:text-white">
                <RefreshCw className="w-3 h-3 mr-1" /> Restock
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {(currentRoom.minibar_items || DEFAULT_MINIBAR).map((item, idx) => {
              const remaining = item.quantity - (item.consumed || 0);
              return (
                <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl border ${remaining <= 1 ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5 bg-[#111]'}`}>
                  <Coffee className={`w-4 h-4 ${remaining <= 1 ? 'text-amber-400' : 'text-[#c9a962]/60'}`} />
                  <div className="flex-1">
                    <div className="text-white text-sm">{item.name}</div>
                    <div className="text-white/40 text-xs">KES {item.price} each · {remaining}/{item.quantity} remaining</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${item.consumed ? 'text-[#c9a962]' : 'text-white/30'}`}>
                      {item.consumed || 0} used
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateConsumed(currentRoom, idx, -1)} disabled={!item.consumed}
                        className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30">
                        <Minus className="w-3 h-3" />
                      </button>
                      <button onClick={() => updateConsumed(currentRoom, idx, 1)} disabled={remaining === 0}
                        className="w-7 h-7 rounded-lg bg-[#c9a962]/20 border border-[#c9a962]/30 flex items-center justify-center text-[#c9a962] hover:bg-[#c9a962]/30 disabled:opacity-30">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalConsumedValue > 0 && (
            <div className="mt-4 p-4 bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[#c9a962] font-medium">Total Minibar Charges</span>
                <span className="text-[#c9a962] font-bold text-lg">KES {totalConsumedValue.toLocaleString()}</span>
              </div>
              <p className="text-white/40 text-xs mt-1">Will be added to guest's bill on checkout</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}