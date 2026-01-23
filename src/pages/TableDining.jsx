import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Utensils, DollarSign, UserPlus, Share2, ShoppingCart, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import LuxuryButton from '@/components/common/LuxuryButton';
import SectionHeader from '@/components/common/SectionHeader';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import MenuCard from '@/components/menu/MenuCard';

export default function TableDining() {
  const [view, setView] = useState('start'); // start, join, menu, cart, split
  const [tableNumber, setTableNumber] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [currentTableOrder, setCurrentTableOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Generate participant ID on mount
  useEffect(() => {
    const stored = localStorage.getItem('table_participant_id');
    if (stored) {
      setParticipantId(stored);
    } else {
      const newId = `P-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setParticipantId(newId);
      localStorage.setItem('table_participant_id', newId);
    }
  }, []);

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => base44.entities.MenuItem.list(),
    enabled: view === 'menu',
  });

  const { data: tableOrder } = useQuery({
    queryKey: ['table-order', sessionCode],
    queryFn: () => base44.entities.TableOrder.filter({ session_code: sessionCode }).then(orders => orders[0]),
    enabled: !!sessionCode && view !== 'start' && view !== 'join',
    refetchInterval: 2000, // Real-time updates every 2 seconds
  });

  // Real-time subscription
  useEffect(() => {
    if (sessionCode) {
      const unsubscribe = base44.entities.TableOrder.subscribe((event) => {
        if (event.data?.session_code === sessionCode) {
          queryClient.invalidateQueries(['table-order', sessionCode]);
        }
      });
      return unsubscribe;
    }
  }, [sessionCode, queryClient]);

  // Update current order when data changes
  useEffect(() => {
    if (tableOrder) {
      setCurrentTableOrder(tableOrder);
    }
  }, [tableOrder]);

  const createTableMutation = useMutation({
    mutationFn: async () => {
      const code = `T${tableNumber}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const order = await base44.entities.TableOrder.create({
        table_number: tableNumber,
        session_code: code,
        items: [],
        participants: [{
          id: participantId,
          name: participantName,
          joined_at: new Date().toISOString()
        }],
        status: 'active',
        total_amount: 0
      });
      return { order, code };
    },
    onSuccess: ({ order, code }) => {
      setSessionCode(code);
      setCurrentTableOrder(order);
      setView('menu');
      toast.success(`Table ${tableNumber} created! Share code: ${code}`);
    },
  });

  const joinTableMutation = useMutation({
    mutationFn: async () => {
      const orders = await base44.entities.TableOrder.filter({ session_code: sessionCode });
      if (!orders || orders.length === 0) {
        throw new Error('Table not found');
      }
      const order = orders[0];
      
      // Add participant if not already in
      const existingParticipant = order.participants?.find(p => p.id === participantId);
      if (!existingParticipant) {
        const updatedParticipants = [
          ...(order.participants || []),
          {
            id: participantId,
            name: participantName,
            joined_at: new Date().toISOString()
          }
        ];
        await base44.entities.TableOrder.update(order.id, {
          participants: updatedParticipants
        });
      }
      
      return order;
    },
    onSuccess: (order) => {
      setCurrentTableOrder(order);
      setView('menu');
      toast.success(`Joined table ${order.table_number}!`);
    },
    onError: () => {
      toast.error('Invalid session code');
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (menuItem) => {
      const existingItem = currentTableOrder.items?.find(
        item => item.menu_item_id === menuItem.id && item.added_by_id === participantId
      );

      let updatedItems;
      if (existingItem) {
        updatedItems = currentTableOrder.items.map(item =>
          item.menu_item_id === menuItem.id && item.added_by_id === participantId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedItems = [
          ...(currentTableOrder.items || []),
          {
            menu_item_id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
            added_by: participantName,
            added_by_id: participantId
          }
        ];
      }

      const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return base44.entities.TableOrder.update(currentTableOrder.id, {
        items: updatedItems,
        total_amount: newTotal
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['table-order', sessionCode]);
      toast.success('Item added to table order');
    },
  });

  const updateItemQuantity = async (itemIndex, delta) => {
    const updatedItems = [...currentTableOrder.items];
    updatedItems[itemIndex].quantity += delta;
    
    if (updatedItems[itemIndex].quantity <= 0) {
      updatedItems.splice(itemIndex, 1);
    }

    const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await base44.entities.TableOrder.update(currentTableOrder.id, {
      items: updatedItems,
      total_amount: newTotal
    });
    queryClient.invalidateQueries(['table-order', sessionCode]);
  };

  const filteredMenuItems = menuItems.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myItems = currentTableOrder?.items?.filter(item => item.added_by_id === participantId) || [];
  const myTotal = myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Start/Join View
  if (view === 'start' || view === 'join') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <SectionHeader
            title="Table Dining"
            subtitle="Dine Together"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <LuxuryButton
              variant={view === 'start' ? 'primary' : 'secondary'}
              onClick={() => setView('start')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Start New Table
            </LuxuryButton>
            <LuxuryButton
              variant={view === 'join' ? 'primary' : 'secondary'}
              onClick={() => setView('join')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Join Existing Table
            </LuxuryButton>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10"
          >
            {view === 'start' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-playfair text-2xl text-white mb-2">Start a New Table Order</h3>
                  <p className="font-inter text-sm text-white/60">
                    Create a shared order for your table. Others can join and add items.
                  </p>
                </div>

                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Your Name
                  </label>
                  <Input
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                  />
                </div>

                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Table Number
                  </label>
                  <Input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g., 5, A3, Garden-2"
                    className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                  />
                </div>

                <LuxuryButton
                  onClick={() => createTableMutation.mutate()}
                  disabled={!participantName || !tableNumber || createTableMutation.isPending}
                  className="w-full"
                >
                  {createTableMutation.isPending ? 'Creating...' : 'Create Table Order'}
                </LuxuryButton>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-playfair text-2xl text-white mb-2">Join a Table Order</h3>
                  <p className="font-inter text-sm text-white/60">
                    Enter the session code shared by your table host.
                  </p>
                </div>

                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Your Name
                  </label>
                  <Input
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                  />
                </div>

                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Session Code
                  </label>
                  <Input
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    placeholder="e.g., T5-ABC123"
                    className="bg-[#0a0a0a] border-[#c9a962]/20 text-white font-mono"
                  />
                </div>

                <LuxuryButton
                  onClick={() => joinTableMutation.mutate()}
                  disabled={!participantName || !sessionCode || joinTableMutation.isPending}
                  className="w-full"
                >
                  {joinTableMutation.isPending ? 'Joining...' : 'Join Table'}
                </LuxuryButton>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Menu View
  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-playfair text-3xl text-white">
                  Table {currentTableOrder?.table_number}
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#c9a962]" />
                    <code className="font-mono text-sm text-[#c9a962] bg-[#0a0a0a] px-3 py-1 rounded">
                      {sessionCode}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#c9a962]" />
                    <span className="font-inter text-sm text-white/70">
                      {currentTableOrder?.participants?.length || 0} people
                    </span>
                  </div>
                </div>
              </div>
              <LuxuryButton onClick={() => setView('cart')}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart ({currentTableOrder?.items?.length || 0})
              </LuxuryButton>
            </div>

            <div className="flex flex-wrap gap-2">
              {currentTableOrder?.participants?.map((p) => (
                <div
                  key={p.id}
                  className={`px-3 py-1 rounded-full text-xs font-inter ${
                    p.id === participantId
                      ? 'bg-[#c9a962] text-[#0a0a0a]'
                      : 'bg-[#0a0a0a] text-white/70 border border-[#c9a962]/20'
                  }`}
                >
                  {p.name}
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu..."
            className="mb-8 bg-[#1a1a1a] border-[#c9a962]/20 text-white"
          />

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.map((item) => (
              <div key={item.id} className="relative">
                <MenuCard item={item} onAddToCart={() => {}} />
                <LuxuryButton
                  onClick={() => addItemMutation.mutate(item)}
                  size="sm"
                  className="absolute bottom-4 right-4"
                >
                  <Plus className="w-4 h-4" />
                </LuxuryButton>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Cart/Split View
  if (view === 'cart' || view === 'split') {
    const groupedByPerson = {};
    currentTableOrder?.items?.forEach(item => {
      if (!groupedByPerson[item.added_by]) {
        groupedByPerson[item.added_by] = [];
      }
      groupedByPerson[item.added_by].push(item);
    });

    return (
      <div className="min-h-screen bg-[#0a0a0a] py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <LuxuryButton variant="ghost" onClick={() => setView('menu')}>
              ← Back to Menu
            </LuxuryButton>
          </div>

          <SectionHeader title="Table Order" subtitle={`Table ${currentTableOrder?.table_number}`} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <LuxuryButton
              variant={view === 'cart' ? 'primary' : 'secondary'}
              onClick={() => setView('cart')}
            >
              Full Order
            </LuxuryButton>
            <LuxuryButton
              variant={view === 'split' ? 'primary' : 'secondary'}
              onClick={() => setView('split')}
            >
              Split by Person
            </LuxuryButton>
          </div>

          {view === 'cart' ? (
            <div className="space-y-4">
              {currentTableOrder?.items?.map((item, index) => (
                <motion.div
                  key={index}
                  className="bg-[#1a1a1a] rounded-xl p-6 border border-[#c9a962]/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-playfair text-xl text-white">{item.name}</h3>
                      <p className="font-inter text-sm text-[#c9a962] mt-1">
                        Added by {item.added_by}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-playfair text-xl text-white">
                        KES {(item.price * item.quantity).toLocaleString()}
                      </p>
                      {item.added_by_id === participantId && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateItemQuantity(index, -1)}
                            className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#c9a962]/20 flex items-center justify-center text-white"
                          >
                            -
                          </button>
                          <span className="font-inter text-white w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(index, 1)}
                            className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#c9a962]/20 flex items-center justify-center text-white"
                          >
                            +
                          </button>
                        </div>
                      )}
                      {item.added_by_id !== participantId && (
                        <p className="font-inter text-sm text-white/50 mt-2">Qty: {item.quantity}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#c9a962]/30">
                <div className="flex items-center justify-between">
                  <span className="font-playfair text-2xl text-white">Total</span>
                  <span className="font-playfair text-3xl text-[#c9a962]">
                    KES {currentTableOrder?.total_amount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByPerson).map(([person, items]) => {
                const personTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                return (
                  <div key={person} className="bg-[#1a1a1a] rounded-xl p-6 border border-[#c9a962]/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-playfair text-xl text-white">{person}</h3>
                      <span className="font-playfair text-xl text-[#c9a962]">
                        KES {personTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="font-inter text-white/70">
                            {item.name} x{item.quantity}
                          </span>
                          <span className="font-inter text-white/70">
                            KES {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 bg-[#1a1a1a] rounded-xl p-6 border border-[#c9a962]/10">
            <h3 className="font-playfair text-xl text-white mb-4">Your Items</h3>
            {myItems.length === 0 ? (
              <p className="font-inter text-white/50">You haven't added any items yet</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {myItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-inter text-white">{item.name} x{item.quantity}</span>
                      <span className="font-inter text-[#c9a962]">
                        KES {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#c9a962]/20 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-playfair text-lg text-white">Your Total</span>
                    <span className="font-playfair text-2xl text-[#c9a962]">
                      KES {myTotal.toLocaleString()}
                    </span>
                  </div>
                  <Link to={createPageUrl('Order')}>
                    <LuxuryButton className="w-full">
                      <Check className="w-4 h-4 mr-2" />
                      Proceed to Checkout (My Items)
                    </LuxuryButton>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}