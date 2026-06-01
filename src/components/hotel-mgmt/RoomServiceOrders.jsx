import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Minus, ShoppingCart, Send, CheckCircle } from 'lucide-react';

export default function RoomServiceOrders() {
  const qc = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState('');
  const [cart, setCart] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [sent, setSent] = useState(false);

  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => base44.entities.Room.list() });
  const { data: menuItems = [] } = useQuery({ queryKey: ['menu-items'], queryFn: () => base44.entities.MenuItem.list() });
  const [category, setCategory] = useState('all');

  const placeOrder = useMutation({
    mutationFn: async () => {
      const room = rooms.find(r => r.id === selectedRoom);
      const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
      return base44.entities.Order.create({
        customer_name: `Room #${room?.room_number} (Room Service)`,
        customer_email: 'roomservice@hotel.com',
        table_room_number: room?.room_number,
        order_type: 'dine_in',
        items: cart.map(i => ({ menu_item_id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        total_amount: total,
        special_instructions: instructions,
        status: 'confirmed',
        payment_method: 'Room Charge',
      });
    },
    onSuccess: () => { setSent(true); setCart([]); setInstructions(''); setTimeout(() => setSent(false), 3000); },
  });

  const addToCart = (item) => {
    setCart(c => {
      const ex = c.find(i => i.id === item.id);
      return ex ? c.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...c, { ...item, quantity: 1 }];
    });
  };
  const removeFromCart = (itemId) => setCart(c => c.filter(i => i.id !== itemId).map(i => i));
  const changeQty = (itemId, delta) => setCart(c => c.map(i => i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));

  const categories = ['all', ...new Set(menuItems.map(m => m.category))];
  const filteredMenu = category === 'all' ? menuItems : menuItems.filter(m => m.category === category);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const occupiedRooms = rooms.filter(r => r.status === 'occupied');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <label className="text-white/60 text-xs mb-2 block">Select Room</label>
          <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-4">
            <option value="">Choose occupied room...</option>
            {occupiedRooms.map(r => <option key={r.id} value={r.id}>#{r.room_number} — {r.room_type}</option>)}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-all ${category===c ? 'bg-[#c9a962]/20 border-[#c9a962]/40 text-[#c9a962]' : 'border-white/10 text-white/50 hover:text-white'}`}>
              {c.replace(/_/g,' ')}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredMenu.map(item => {
            const inCart = cart.find(i => i.id === item.id);
            return (
              <div key={item.id} className="bg-[#111] rounded-xl border border-white/5 p-3 flex gap-3">
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{item.name}</div>
                  <div className="text-[#c9a962] text-sm">KES {(item.price||0).toLocaleString()}</div>
                  <div className="flex items-center gap-2 mt-2">
                    {inCart ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white/60 hover:text-white">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-white text-sm w-5 text-center">{inCart.quantity}</span>
                        <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 rounded bg-[#c9a962]/20 border border-[#c9a962]/30 flex items-center justify-center text-[#c9a962] hover:bg-[#c9a962]/30">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)}
                        className="text-xs px-3 py-1 rounded-lg bg-[#c9a962]/20 border border-[#c9a962]/30 text-[#c9a962] hover:bg-[#c9a962]/30">
                        <Plus className="w-3 h-3 inline mr-1" />Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-4 h-fit sticky top-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#c9a962]" /> Order Cart
        </h3>
        {cart.length === 0 ? (
          <div className="text-white/30 text-sm text-center py-8">No items added</div>
        ) : (
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-white/70 truncate flex-1">{item.name} x{item.quantity}</span>
                <span className="text-[#c9a962] ml-2">KES {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-medium">
              <span className="text-white">Total</span>
              <span className="text-[#c9a962]">KES {cartTotal.toLocaleString()}</span>
            </div>
          </div>
        )}
        <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
          placeholder="Special instructions..." rows={2}
          className="w-full mt-3 bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
        {sent ? (
          <div className="mt-3 flex items-center justify-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" /> Order sent to kitchen!
          </div>
        ) : (
          <Button onClick={() => placeOrder.mutate()} disabled={!selectedRoom || cart.length === 0}
            className="w-full mt-3 bg-[#c9a962] hover:bg-[#b8944f] text-black">
            <Send className="w-4 h-4 mr-1" /> Send to Kitchen
          </Button>
        )}
      </div>
    </div>
  );
}