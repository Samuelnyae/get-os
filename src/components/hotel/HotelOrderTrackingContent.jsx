// Re-exports the OrderTracking page body without its own layout
// We do this by simply rendering the same content inline
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, CheckCircle, Truck, Home, User, Mail, Phone, ChefHat, Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import LuxuryButton from '@/components/common/LuxuryButton';
import SectionHeader from '@/components/common/SectionHeader';
import { format } from 'date-fns';
import { useNotifications, requestNotificationPermission } from '@/components/notifications/NotificationManager';
import { toast } from 'sonner';
import DeliveryFeedbackWidget from '@/components/feedback/DeliveryFeedbackWidget';
import DeliveryMap from '@/components/tracking/DeliveryMap';

export default function OrderTrackingContent() {
  const [orderRef, setOrderRef] = useState('');
  const [email, setEmail] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackedOrderId, setTrackedOrderId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const lastStatusRef = useRef(null);
  const { sendNotification, permission } = useNotifications();

  const statusMessages = {
    confirmed: { title: '✅ Order Confirmed!', body: 'Your order has been confirmed.', icon: '✅' },
    preparing: { title: '👨‍🍳 Being Prepared', body: 'Our chefs are preparing your meal!', icon: '👨‍🍳' },
    ready: { title: '✨ Order Ready!', body: 'Your order is ready for pickup/delivery.', icon: '✨' },
    out_for_delivery: { title: '🚚 Out for Delivery', body: 'Your order is on its way!', icon: '🚚' },
    delivered: { title: '🎉 Order Delivered!', body: 'Enjoy your meal!', icon: '🎉' },
  };

  const handleStatusChange = (newOrder) => {
    if (newOrder.status !== lastStatusRef.current) {
      lastStatusRef.current = newOrder.status;
      const notification = statusMessages[newOrder.status];
      if (notification) {
        toast.success(`${notification.icon} ${notification.title}`, { duration: 6000 });
        sendNotification(notification.title, { body: notification.body, tag: `order-${newOrder.id}` });
      }
    }
  };

  useQuery({
    queryKey: ['tracked-order', trackedOrderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.list('-created_date', 500);
      const found = orders.find(o => o.id === trackedOrderId);
      if (found) { handleStatusChange(found); setTrackedOrder(found); }
      return found;
    },
    enabled: !!trackedOrderId,
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!trackedOrderId) return;
    const unsubscribe = base44.entities.Order.subscribe((event) => {
      if (event.id === trackedOrderId && event.type === 'update') {
        handleStatusChange(event.data);
        setTrackedOrder(event.data);
      }
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [trackedOrderId]);

  const handleTrackOrder = async () => {
    if (!orderRef || !email) { toast.error('Please enter both order reference and email'); return; }
    setIsSearching(true);
    try {
      const allOrders = await base44.entities.Order.list('-created_date', 500);
      const found = allOrders.find(o =>
        o.order_reference?.toLowerCase() === orderRef.trim().toLowerCase() &&
        o.customer_email?.toLowerCase() === email.trim().toLowerCase()
      );
      if (found) {
        lastStatusRef.current = found.status;
        setTrackedOrder(found);
        setTrackedOrderId(found.id);
        if (permission !== 'granted') requestNotificationPermission();
        toast.success('Order found! Live updates enabled.');
      } else {
        toast.error('Order not found. Please check your reference and email.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Package },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { key: 'preparing', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready', icon: Clock },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Home },
  ];

  const currentStepIndex = trackedOrder ? statusSteps.findIndex(s => s.key === trackedOrder.status) : -1;

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      {trackedOrder && <DeliveryFeedbackWidget key={trackedOrder.id} order={trackedOrder} />}
      <div className="max-w-4xl mx-auto">
        <SectionHeader title="Track Your Order" subtitle="Real-Time Updates" />
        {!trackedOrder ? (
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/20">
            <div className="flex items-center gap-3 mb-6"><Search className="w-6 h-6 text-[#c9a962]" /><h3 className="font-playfair text-2xl text-white">Find Your Order</h3></div>
            <div className="space-y-4">
              <div>
                <label className="font-inter text-sm text-white/70 mb-2 block">Order Reference</label>
                <Input placeholder="e.g., HB-123456" value={orderRef} onChange={e => setOrderRef(e.target.value)} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
              </div>
              <div>
                <label className="font-inter text-sm text-white/70 mb-2 block">Email Address</label>
                <Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
              </div>
              <LuxuryButton onClick={handleTrackOrder} disabled={isSearching || !orderRef || !email} className="w-full">
                {isSearching ? 'Searching...' : 'Track Order'}
              </LuxuryButton>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/20">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h3 className="font-playfair text-2xl text-white">{trackedOrder.customer_name}</h3>
                  <p className="font-inter text-sm text-[#c9a962] font-mono">{trackedOrder.order_reference}</p>
                </div>
                <LuxuryButton variant="secondary" size="sm" onClick={() => { setTrackedOrder(null); setTrackedOrderId(null); lastStatusRef.current = null; }}>
                  Track Another
                </LuxuryButton>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-white/60"><Mail className="w-4 h-4 text-[#c9a962]" /><span className="font-inter">{trackedOrder.customer_email}</span></div>
                <div className="flex items-center gap-2 text-white/60"><Phone className="w-4 h-4 text-[#c9a962]" /><span className="font-inter">{trackedOrder.customer_phone}</span></div>
                <div className="flex items-center gap-2 text-white/60"><Clock className="w-4 h-4 text-[#c9a962]" /><span className="font-inter">{format(new Date(trackedOrder.created_date), 'MMM d, h:mm a')}</span></div>
              </div>
            </div>

            {(trackedOrder.status === 'out_for_delivery' || trackedOrder.status === 'delivered') && (
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/20">
                <div className="flex items-center gap-3 mb-4"><Truck className="w-5 h-5 text-[#c9a962]" /><h4 className="font-playfair text-xl text-white">Live Driver Location</h4></div>
                <DeliveryMap order={trackedOrder} />
              </div>
            )}

            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/20">
              <h4 className="font-playfair text-xl text-white mb-8">Order Progress</h4>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#c9a962]/20" />
                <div className="absolute left-6 top-0 w-0.5 bg-[#c9a962] transition-all duration-500" style={{ height: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }} />
                <div className="space-y-8">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="relative flex items-start gap-4">
                        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-[#c9a962] shadow-lg shadow-[#c9a962]/50' : 'bg-[#0a0a0a] border border-[#c9a962]/20'}`}>
                          <Icon className={`w-6 h-6 ${isCompleted ? 'text-[#0a0a0a]' : 'text-[#c9a962]/40'}`} />
                        </div>
                        <div className="flex-1 pt-2">
                          <h5 className={`font-inter font-medium mb-1 ${isCompleted ? 'text-white' : 'text-white/40'}`}>{step.label}</h5>
                          {isCurrent && <div className="mt-2 inline-block px-3 py-1 rounded-full bg-[#c9a962]/20 border border-[#c9a962]"><p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider">Current Status</p></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/20">
              <h4 className="font-playfair text-xl text-white mb-4">Order Items</h4>
              <div className="space-y-3">
                {trackedOrder.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a]">
                    <div><p className="font-inter text-sm text-white">{item.name}</p><p className="font-inter text-xs text-white/50">Qty: {item.quantity}</p></div>
                    <p className="font-inter text-sm text-[#c9a962]">KES {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#c9a962]/10 flex items-center justify-between">
                <span className="font-playfair text-lg text-white">Total</span>
                <span className="font-playfair text-2xl text-[#c9a962]">KES {trackedOrder.total_amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}