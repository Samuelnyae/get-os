import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Clock, CheckCircle, Truck, Home, User, 
  Mail, Phone, MapPin, ChefHat, Search, Bell 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import LuxuryButton from '@/components/common/LuxuryButton';
import SectionHeader from '@/components/common/SectionHeader';
import { format } from 'date-fns';
import { useNotifications, requestNotificationPermission } from '@/components/notifications/NotificationManager';
import { toast } from 'sonner';
import DeliveryFeedbackWidget from '@/components/feedback/DeliveryFeedbackWidget';
import DeliveryMap from '@/components/tracking/DeliveryMap';

export default function OrderTracking() {
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
    delivered: { title: '🎉 Order Delivered!', body: 'Enjoy your meal from Hermanas Bites!', icon: '🎉' },
  };

  const handleStatusChange = (newOrder) => {
    if (newOrder.status !== lastStatusRef.current) {
      lastStatusRef.current = newOrder.status;
      const notification = statusMessages[newOrder.status];
      if (notification) {
        toast.success(`${notification.icon} ${notification.title}`, { duration: 6000 });
        sendNotification(notification.title, {
          body: notification.body,
          tag: `order-${newOrder.id}`,
          priority: ['ready', 'out_for_delivery', 'delivered'].includes(newOrder.status) ? 'high' : 'normal',
          requireInteraction: newOrder.status === 'delivered',
        });
      }
    }
  };

  // Polling every 4 seconds as primary live update mechanism
  useQuery({
    queryKey: ['tracked-order', trackedOrderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.list('-created_date', 500);
      const found = orders.find(o => o.id === trackedOrderId);
      if (found) {
        handleStatusChange(found);
        setTrackedOrder(found);
      }
      return found;
    },
    enabled: !!trackedOrderId,
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
  });

  // Real-time subscription as instant update layer on top of polling
  useEffect(() => {
    if (!trackedOrderId) return;

    const unsubscribe = base44.entities.Order.subscribe((event) => {
      if (event.id === trackedOrderId && event.type === 'update') {
        const newOrder = event.data;
        handleStatusChange(newOrder);
        setTrackedOrder(newOrder);
      }
    });

    return () => { if (unsubscribe) unsubscribe(); };
  }, [trackedOrderId]);

  const handleTrackOrder = async () => {
    if (!orderRef || !email) {
      toast.error('Please enter both order reference and email');
      return;
    }
    
    setIsSearching(true);
    try {
      const allOrders = await base44.entities.Order.list('-created_date', 500);
      const found = allOrders.find(
        order => order.order_reference?.toLowerCase() === orderRef.trim().toLowerCase() && 
                 order.customer_email?.toLowerCase() === email.trim().toLowerCase()
      );
      
      if (found) {
        lastStatusRef.current = found.status;
        setTrackedOrder(found);
        setTrackedOrderId(found.id);
        
        if (permission !== 'granted') {
          requestNotificationPermission();
        }
        
        toast.success('Order found! Live updates enabled.');
      } else {
        toast.error('Order not found. Please check your order reference and email.');
        setTrackedOrder(null);
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      toast.error('Error tracking order. Please try again.');
      setTrackedOrder(null);
    } finally {
      setIsSearching(false);
    }
  };

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Package, description: 'Your order has been received' },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Order confirmed and queued' },
    { key: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Our chefs are preparing your food' },
    { key: 'ready', label: 'Ready', icon: Clock, description: 'Your order is ready' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'On the way to you' },
    { key: 'delivered', label: 'Delivered', icon: Home, description: 'Enjoy your meal!' },
  ];

  const getCurrentStepIndex = (status) => {
    const index = statusSteps.findIndex(step => step.key === status);
    return index !== -1 ? index : 0;
  };

  const currentStepIndex = trackedOrder ? getCurrentStepIndex(trackedOrder.status) : -1;

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      {trackedOrder && <DeliveryFeedbackWidget key={trackedOrder.id} order={trackedOrder} />}
      <div className="max-w-4xl mx-auto">
        <SectionHeader 
          title="Track Your Order" 
          subtitle="Real-Time Updates"
        />

        {!trackedOrder ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-6 h-6 text-[#c9a962]" />
              <h3 className="font-playfair text-2xl text-white">Find Your Order</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="font-inter text-sm text-white/70 mb-2 block">
                  Order Reference
                </label>
                <Input
                  placeholder="e.g., HB-123456"
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value)}
                  className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                />
              </div>
              
              <div>
                <label className="font-inter text-sm text-white/70 mb-2 block">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                />
              </div>
              
              <LuxuryButton
                onClick={handleTrackOrder}
                disabled={isSearching || !orderRef || !email}
                className="w-full"
              >
                {isSearching ? 'Searching...' : 'Track Order'}
              </LuxuryButton>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Order Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/20"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="font-playfair text-2xl text-white mb-1">
                    {trackedOrder.customer_name}
                  </h3>
                  <p className="font-inter text-sm text-[#c9a962] font-mono">
                    {trackedOrder.order_reference}
                  </p>
                </div>
<div className="flex gap-2">
                  {permission !== 'granted' && (
                    <LuxuryButton
                      variant="ghost"
                      size="sm"
                      onClick={requestNotificationPermission}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Enable Alerts
                    </LuxuryButton>
                  )}
                  <LuxuryButton
                    variant="secondary"
                    size="sm"
                    onClick={() => { setTrackedOrder(null); setTrackedOrderId(null); lastStatusRef.current = null; }}
                  >
                    Track Another Order
                  </LuxuryButton>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Mail className="w-4 h-4 text-[#c9a962]" />
                  <span className="font-inter">{trackedOrder.customer_email}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Phone className="w-4 h-4 text-[#c9a962]" />
                  <span className="font-inter">{trackedOrder.customer_phone}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Clock className="w-4 h-4 text-[#c9a962]" />
                  <span className="font-inter">
                    {format(new Date(trackedOrder.created_date), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>

              {trackedOrder.assigned_staff_name && (
                <div className="mt-4 p-3 rounded-lg bg-[#0a0a0a] border border-[#c9a962]/10">
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">
                    Assigned To
                  </p>
                  <p className="font-inter text-sm text-white">
                    {trackedOrder.assigned_staff_name}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Live Delivery Map — only for delivery orders when out for delivery or delivered */}
            {trackedOrder.order_type === 'delivery' && (trackedOrder.status === 'out_for_delivery' || trackedOrder.status === 'delivered') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="w-5 h-5 text-[#c9a962]" />
                  <h4 className="font-playfair text-xl text-white">
                    {trackedOrder.status === 'delivered' ? 'Order Delivered' : 'Live Driver Location'}
                  </h4>
                  {trackedOrder.status === 'out_for_delivery' && (
                    <span className="ml-auto flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-inter text-xs text-green-400">Live</span>
                    </span>
                  )}
                </div>
                <DeliveryMap order={trackedOrder} />
                <p className="font-inter text-xs text-white/40 mt-3 text-center">
                  {trackedOrder.status === 'delivered'
                    ? 'Your order has been delivered. Enjoy your meal!'
                    : 'Driver location updates in real-time as they approach you.'}
                </p>
              </motion.div>
            )}

            {/* Status Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/20"
            >
              <h4 className="font-playfair text-xl text-white mb-8">Order Progress</h4>
              
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#c9a962]/20" />
                <div 
                  className="absolute left-6 top-0 w-0.5 bg-[#c9a962] transition-all duration-500 ease-out"
                  style={{ height: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                />

                <div className="space-y-8">
                  {statusSteps.map((step, index) => {
                    // Mark delivered as completed when out_for_delivery is active
                    const isCompleted = index <= currentStepIndex || 
                      (trackedOrder.status === 'out_for_delivery' && step.key === 'delivered');
                    const isCurrent = index === currentStepIndex;
                    const Icon = step.icon;

                    return (
                      <motion.div
                        key={step.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex items-start gap-4"
                      >
                        <div 
                          className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ease-out ${
                            isCompleted 
                              ? 'bg-[#c9a962] shadow-lg shadow-[#c9a962]/50 scale-100' 
                              : 'bg-[#0a0a0a] border border-[#c9a962]/20 scale-95'
                          }`}
                        >
                          <Icon className={`w-6 h-6 transition-colors duration-300 ${isCompleted ? 'text-[#0a0a0a]' : 'text-[#c9a962]/40'}`} />
                        </div>
                        
                        <div className="flex-1 pt-2">
                          <h5 className={`font-inter font-medium mb-1 ${
                            isCompleted ? 'text-white' : 'text-white/40'
                          }`}>
                            {step.label}
                          </h5>
                          <p className={`font-inter text-sm ${
                            isCompleted ? 'text-white/60' : 'text-white/30'
                          }`}>
                            {step.description}
                          </p>
                          
                          {isCurrent && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="mt-2 inline-block px-3 py-1 rounded-full bg-[#c9a962]/20 border border-[#c9a962]"
                            >
                              <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider">
                                Current Status
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {trackedOrder.estimated_completion && (
                <div className="mt-8 p-4 rounded-lg bg-[#0a0a0a] border border-[#c9a962]/10">
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">
                    Estimated Completion
                  </p>
                  <p className="font-inter text-lg text-white">
                    {format(new Date(trackedOrder.estimated_completion), 'h:mm a')}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/20"
            >
              <h4 className="font-playfair text-xl text-white mb-4">Order Items</h4>
              
              <div className="space-y-3">
                {trackedOrder.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a]">
                    <div className="flex-1">
                      <p className="font-inter text-sm text-white">{item.name}</p>
                      <p className="font-inter text-xs text-white/50">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-inter text-sm text-[#c9a962]">
                      KES {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-[#c9a962]/10 flex items-center justify-between">
                <span className="font-playfair text-lg text-white">Total</span>
                <span className="font-playfair text-2xl text-[#c9a962]">
                  KES {trackedOrder.total_amount?.toLocaleString()}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}