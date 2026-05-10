import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, ChefHat, AlertTriangle, Flame, Utensils, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS = {
  pending: 'border-yellow-500/50 bg-yellow-500/5',
  confirmed: 'border-blue-500/50 bg-blue-500/5',
  preparing: 'border-orange-500/50 bg-orange-500/5',
  ready: 'border-green-500/50 bg-green-500/5',
};

const ORDER_TYPE_PRIORITY = { dine_in: 1, takeaway: 2, delivery: 3 };

function ElapsedTimer({ createdDate }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calc = () => setElapsed(Math.floor((Date.now() - new Date(createdDate).getTime()) / 1000));
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [createdDate]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isUrgent = mins >= 15;
  const isWarning = mins >= 8;

  return (
    <span className={`font-mono text-sm font-bold tabular-nums ${isUrgent ? 'text-red-400 animate-pulse' : isWarning ? 'text-amber-400' : 'text-green-400'}`}>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

export default function KDS() {
  const qc = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kds-orders'],
    queryFn: () => base44.entities.Order.filter({ status: ['pending', 'confirmed', 'preparing'] }, '-created_date', 50),
    refetchInterval: 10000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kds-orders'] }),
  });

  const markReady = (order) => {
    updateMutation.mutate({ id: order.id, status: 'ready' });
    toast.success(`Order ${order.order_reference} marked as Ready!`);
  };

  const markPreparing = (order) => {
    updateMutation.mutate({ id: order.id, status: 'preparing' });
  };

  // Sort by priority: dine_in first, then by time
  const sorted = [...orders].sort((a, b) => {
    const pa = ORDER_TYPE_PRIORITY[a.order_type] || 3;
    const pb = ORDER_TYPE_PRIORITY[b.order_type] || 3;
    if (pa !== pb) return pa - pb;
    return new Date(a.created_date) - new Date(b.created_date);
  });

  const pending = sorted.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const preparing = sorted.filter(o => o.status === 'preparing');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-[#c9a962]" />
          </div>
          <div>
            <h1 className="font-playfair text-2xl" style={{ background: 'linear-gradient(135deg, #c9a962, #e4d5a7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Kitchen Display System
            </h1>
            <p className="text-xs text-white/40 font-inter">Live order queue — auto-refreshes every 10s</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-inter">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-white/60">New: {pending.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-inter">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-white/60">Preparing: {preparing.length}</span>
          </div>
          <button onClick={() => qc.invalidateQueries({ queryKey: ['kds-orders'] })} className="p-2 rounded-lg border border-[#c9a962]/20 hover:bg-[#c9a962]/10 transition-all">
            <RefreshCw className="w-4 h-4 text-[#c9a962]" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Utensils className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="font-playfair text-2xl mb-2">All Clear!</p>
          <p className="font-inter text-sm">No active orders in the kitchen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QUEUE Column */}
          <div>
            <h2 className="font-inter text-xs uppercase tracking-widest text-yellow-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" /> New / Queued ({pending.length})
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {pending.map((order) => (
                  <OrderCard key={order.id} order={order} onAction={markPreparing} actionLabel="Start Preparing" actionColor="bg-orange-500 hover:bg-orange-400" />
                ))}
              </AnimatePresence>
              {pending.length === 0 && <p className="text-white/30 font-inter text-sm text-center py-8">No queued orders</p>}
            </div>
          </div>

          {/* PREPARING Column */}
          <div>
            <h2 className="font-inter text-xs uppercase tracking-widest text-orange-400 mb-4 flex items-center gap-2">
              <Flame className="w-3 h-3" /> Preparing ({preparing.length})
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {preparing.map((order) => (
                  <OrderCard key={order.id} order={order} onAction={markReady} actionLabel="Mark Ready ✓" actionColor="bg-green-600 hover:bg-green-500" />
                ))}
              </AnimatePresence>
              {preparing.length === 0 && <p className="text-white/30 font-inter text-sm text-center py-8">Nothing being prepared</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onAction, actionLabel, actionColor }) {
  const typeColors = { dine_in: 'text-blue-400', takeaway: 'text-purple-400', delivery: 'text-amber-400' };
  const typeLabel = { dine_in: '🍽 Dine-In', takeaway: '📦 Takeaway', delivery: '🚚 Delivery' };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`rounded-2xl border p-5 ${STATUS_COLORS[order.status] || 'border-white/10 bg-white/5'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono text-lg font-bold text-white">{order.order_reference}</p>
          <p className={`font-inter text-xs font-semibold ${typeColors[order.order_type]}`}>{typeLabel[order.order_type]}</p>
          {order.table_room_number && <p className="font-inter text-xs text-white/50 mt-0.5">Table: {order.table_room_number}</p>}
          {order.pickup_time && <p className="font-inter text-xs text-white/50 mt-0.5">Pickup: {order.pickup_time}</p>}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-white/40" />
            <ElapsedTimer createdDate={order.created_date} />
          </div>
          <p className="font-inter text-xs text-white/40">{order.customer_name}</p>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
            <span className="font-inter text-sm text-white">{item.name}</span>
            <span className="font-inter text-sm font-bold text-[#c9a962]">×{item.quantity}</span>
          </div>
        ))}
      </div>

      {order.special_instructions && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
          <p className="font-inter text-xs text-amber-300">⚠ {order.special_instructions}</p>
        </div>
      )}

      <button
        onClick={() => onAction(order)}
        className={`w-full py-2.5 rounded-xl text-sm font-inter font-semibold text-white transition-all ${actionColor}`}
      >
        {actionLabel}
      </button>
    </motion.div>
  );
}