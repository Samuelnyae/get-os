import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Coffee, Users, QrCode, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import LuxuryButton from '@/components/common/LuxuryButton';
import SectionHeader from '@/components/common/SectionHeader';
import { toast } from 'sonner';

export default function HotelTableDiningContent({ hotel }) {
  const [step, setStep] = useState('start'); // start | join | session
  const [tableNumber, setTableNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [tableOrder, setTableOrder] = useState(null);
  const [guestId] = useState(() => Math.random().toString(36).substr(2, 8));

  const { data: menuItems = [] } = useQuery({
    queryKey: ['hotel-menu', hotel?.id],
    queryFn: () => base44.entities.MenuItem.filter({ hotel_id: hotel.id }),
    enabled: !!hotel?.id,
  });

  const createSession = useMutation({
    mutationFn: () => {
      const code = `T${tableNumber}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      return base44.entities.TableOrder.create({
        table_number: tableNumber,
        session_code: code,
        participants: [{ id: guestId, name: guestName, joined_at: new Date().toISOString() }],
        items: [],
        status: 'active',
        total_amount: 0,
      });
    },
    onSuccess: (data) => { setTableOrder(data); setSessionCode(data.session_code); setStep('session'); },
  });

  const joinSession = useMutation({
    mutationFn: async () => {
      const orders = await base44.entities.TableOrder.filter({ session_code: sessionCode });
      if (!orders[0]) throw new Error('Session not found');
      const updated = await base44.entities.TableOrder.update(orders[0].id, {
        participants: [...(orders[0].participants || []), { id: guestId, name: guestName, joined_at: new Date().toISOString() }]
      });
      return updated;
    },
    onSuccess: (data) => { setTableOrder(data); setStep('session'); },
    onError: () => toast.error('Session code not found'),
  });

  const addItem = async (item) => {
    if (!tableOrder) return;
    const existing = tableOrder.items?.find(i => i.menu_item_id === item.id && i.added_by_id === guestId);
    let newItems;
    if (existing) {
      newItems = tableOrder.items.map(i => i.menu_item_id === item.id && i.added_by_id === guestId ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
      newItems = [...(tableOrder.items || []), { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1, added_by: guestName, added_by_id: guestId }];
    }
    const total = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const updated = await base44.entities.TableOrder.update(tableOrder.id, { items: newItems, total_amount: total });
    setTableOrder(updated);
  };

  const removeItem = async (itemId) => {
    const newItems = tableOrder.items
      .map(i => i.menu_item_id === itemId && i.added_by_id === guestId ? { ...i, quantity: i.quantity - 1 } : i)
      .filter(i => i.quantity > 0);
    const total = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const updated = await base44.entities.TableOrder.update(tableOrder.id, { items: newItems, total_amount: total });
    setTableOrder(updated);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <SectionHeader title="Table Dining" subtitle={hotel?.name || 'Group Ordering'} />

        {step === 'start' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10">
              <div className="w-12 h-12 rounded-xl bg-[#c9a962]/10 flex items-center justify-center mb-4"><Coffee className="w-6 h-6 text-[#c9a962]" /></div>
              <h3 className="font-playfair text-2xl text-white mb-2">New Table Session</h3>
              <p className="font-inter text-sm text-white/50 mb-6">Start a group order for your table</p>
              <div className="space-y-3 mb-6">
                <Input placeholder="Table Number" value={tableNumber} onChange={e => setTableNumber(e.target.value)} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
                <Input placeholder="Your Name" value={guestName} onChange={e => setGuestName(e.target.value)} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
              </div>
              <LuxuryButton onClick={() => createSession.mutate()} disabled={!tableNumber || !guestName || createSession.isPending} className="w-full">
                {createSession.isPending ? 'Creating...' : 'Start Session'}
              </LuxuryButton>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10">
              <div className="w-12 h-12 rounded-xl bg-[#c9a962]/10 flex items-center justify-center mb-4"><QrCode className="w-6 h-6 text-[#c9a962]" /></div>
              <h3 className="font-playfair text-2xl text-white mb-2">Join a Session</h3>
              <p className="font-inter text-sm text-white/50 mb-6">Join your table's existing order</p>
              <div className="space-y-3 mb-6">
                <Input placeholder="Session Code (e.g. T5-AB12)" value={sessionCode} onChange={e => setSessionCode(e.target.value)} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
                <Input placeholder="Your Name" value={guestName} onChange={e => setGuestName(e.target.value)} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
              </div>
              <LuxuryButton variant="secondary" onClick={() => joinSession.mutate()} disabled={!sessionCode || !guestName || joinSession.isPending} className="w-full">
                {joinSession.isPending ? 'Joining...' : 'Join Session'}
              </LuxuryButton>
            </motion.div>
          </div>
        )}

        {step === 'session' && tableOrder && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#c9a962]/10 flex items-center justify-between">
                <div>
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider">Session</p>
                  <p className="font-playfair text-xl text-white">{tableOrder.session_code}</p>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <Users className="w-4 h-4 text-[#c9a962]" />
                  <span className="font-inter text-sm">{tableOrder.participants?.length || 1} guests</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {menuItems.map(item => {
                  const myQty = tableOrder.items?.find(i => i.menu_item_id === item.id && i.added_by_id === guestId)?.quantity || 0;
                  return (
                    <div key={item.id} className="bg-[#1a1a1a] rounded-xl p-4 border border-[#c9a962]/10 flex items-center gap-3">
                      <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-inter text-sm text-white truncate">{item.name}</p>
                        <p className="font-inter text-xs text-[#c9a962]">KES {item.price?.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {myQty > 0 ? (
                          <>
                            <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] hover:bg-[#c9a962]/20"><Minus className="w-3 h-3" /></button>
                            <span className="font-inter text-sm text-white w-6 text-center">{myQty}</span>
                            <button onClick={() => addItem(item)} className="w-7 h-7 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] hover:bg-[#c9a962]/20"><Plus className="w-3 h-3" /></button>
                          </>
                        ) : (
                          <button onClick={() => addItem(item)} className="w-7 h-7 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] hover:bg-[#c9a962]/20"><Plus className="w-3 h-3" /></button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10 h-fit sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5 text-[#c9a962]" />
                <h3 className="font-playfair text-xl text-white">Table Order</h3>
              </div>
              {tableOrder.items?.length === 0 ? (
                <p className="font-inter text-sm text-white/40 text-center py-6">No items yet</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {tableOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-inter text-white/80">{item.name} ×{item.quantity}</p>
                        <p className="font-inter text-xs text-white/40">by {item.added_by}</p>
                      </div>
                      <p className="font-inter text-[#c9a962]">KES {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-[#c9a962]/10 pt-4 flex justify-between">
                <span className="font-inter text-white/70">Total</span>
                <span className="font-playfair text-xl text-[#c9a962]">KES {tableOrder.total_amount?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}