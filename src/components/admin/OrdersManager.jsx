import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, User, Mail, Phone, Clock, Package, 
  UserCheck, Play, CheckCircle, Bell, DollarSign, MapPin, Utensils, Home
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LuxuryButton from '../common/LuxuryButton';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNotifications, requestNotificationPermission } from '@/components/notifications/NotificationManager';

export default function OrdersManager({ hotelId } = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [queueView, setQueueView] = useState('active'); // active, completed
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const queryClient = useQueryClient();
  const { sendNotification, permission } = useNotifications();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders-list', hotelId],
    queryFn: () => hotelId
      ? base44.entities.Order.filter({ hotel_id: hotelId }, '-created_date', 200)
      : base44.entities.Order.list('-created_date', 200),
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => base44.entities.Staff.list(),
    initialData: [],
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Real-time order updates with notifications
  useEffect(() => {
    const unsubscribe = base44.entities.Order.subscribe((event) => {
      if (event.type === 'create') {
        // New order notification - always urgent
        const order = event.data;
        const noStaffAssigned = !order.assigned_staff_id;
        
        sendNotification('🔔 New Order Received!', {
          body: `Order ${order.order_reference} from ${order.customer_name} - KES ${order.total_amount?.toLocaleString()}${noStaffAssigned ? ' (NO STAFF ASSIGNED)' : ''}`,
          tag: `new-order-${order.id}`,
          priority: noStaffAssigned ? 'urgent' : 'high',
          requireInteraction: true,
          ignoreDND: true, // New orders bypass DND
          toastOptions: {
            duration: 10000,
            action: {
              label: 'Assign Now',
              onClick: () => {
                setQueueView('active');
                setStatusFilter('pending');
                const orders = queryClient.getQueryData(['admin-orders-list']) || [];
                const foundOrder = orders.find(o => o.id === order.id);
                if (foundOrder) {
                  setSelectedOrder(foundOrder);
                  setAssignDialogOpen(true);
                }
              },
            },
          },
        });
      }
      
      if (event.type === 'update') {
        const order = event.data;
        
        // Alert if order is pending and has no staff for more than 5 minutes
        if (order.status === 'pending' && !order.assigned_staff_id) {
          const orderAge = Date.now() - new Date(order.created_date).getTime();
          if (orderAge > 5 * 60 * 1000) { // 5 minutes
            sendNotification('⚠️ Urgent: Unassigned Order', {
              body: `Order ${order.order_reference} has been waiting for ${Math.round(orderAge / 60000)} minutes`,
              tag: `urgent-unassigned-${order.id}`,
              priority: 'urgent',
              requireInteraction: true,
              ignoreDND: true,
              toastOptions: {
                duration: 15000,
                action: {
                  label: 'Assign Staff',
                  onClick: () => {
                    setSelectedOrder(order);
                    setAssignDialogOpen(true);
                  },
                },
              },
            });
          }
        }

        // Notify on payment status change
        if (order.payment_status === 'paid' && orders.find(o => o.id === order.id)?.payment_status === 'pending') {
          sendNotification('💰 Payment Received', {
            body: `Order ${order.order_reference} has been paid`,
            tag: `payment-${order.id}`,
            priority: 'high',
            ignoreDND: true,
            toastOptions: { duration: 5000 },
          });
        }
      }
      
      queryClient.invalidateQueries(['admin-orders-list', hotelId]);
    });
    return unsubscribe;
  }, [queryClient, sendNotification]);

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders-list', hotelId]);
      toast.success('Order updated');
    },
  });

  const assignStaffMutation = useMutation({
    mutationFn: async ({ orderId, staffId }) => {
      const selectedStaff = staff.find(s => s.id === staffId);
      const estimatedTime = new Date();
      estimatedTime.setMinutes(estimatedTime.getMinutes() + 30); // 30 min default

      return base44.entities.Order.update(orderId, {
        assigned_staff_id: staffId,
        assigned_staff_name: selectedStaff?.name,
        estimated_completion: estimatedTime.toISOString(),
        status: 'confirmed',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['admin-orders-list', hotelId]);
      setAssignDialogOpen(false);
      
      // Notify about staff assignment
      const order = selectedOrder;
      sendNotification('👨‍🍳 Staff Assigned', {
        body: `${data.assigned_staff_name} assigned to order ${order?.order_reference}`,
        tag: `staff-assigned-${order?.id}`,
        toastOptions: { duration: 4000 },
      });
      
      toast.success('Staff assigned successfully');
    },
  });

  const handleMarkAsPaid = (orderId) => {
    updateOrderMutation.mutate({
      id: orderId,
      data: { payment_status: 'paid' }
    });
  };

  // Workflow automation - auto-progress orders
  const autoProgressOrder = (order) => {
    const workflows = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'ready',
      'ready': 'out_for_delivery',
      'out_for_delivery': 'delivered',
    };

    const nextStatus = workflows[order.status];
    if (nextStatus) {
      updateOrderMutation.mutate({
        id: order.id,
        data: { 
          status: nextStatus,
          status_history: [
            ...(order.status_history || []),
            {
              status: nextStatus,
              timestamp: new Date().toISOString(),
              note: 'Auto-progressed by system'
            }
          ]
        }
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_reference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const matchesQueue = 
      (queueView === 'active' && !['delivered', 'cancelled'].includes(order.status)) ||
      (queueView === 'completed' && ['delivered', 'cancelled'].includes(order.status));
    
    return matchesSearch && matchesStatus && matchesQueue;
  });

  // Group by status for queue view
  const ordersByStatus = {
    pending: filteredOrders.filter(o => o.status === 'pending'),
    confirmed: filteredOrders.filter(o => o.status === 'confirmed'),
    preparing: filteredOrders.filter(o => o.status === 'preparing'),
    ready: filteredOrders.filter(o => o.status === 'ready'),
    out_for_delivery: filteredOrders.filter(o => o.status === 'out_for_delivery'),
    delivered: filteredOrders.filter(o => o.status === 'delivered'),
    cancelled: filteredOrders.filter(o => o.status === 'cancelled'),
  };

  const orderTypeBadge = (order) => {
    const type = order.order_type || 'dine_in';
    const configs = {
      dine_in: { label: 'Dine In', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', Icon: Utensils },
      takeaway: { label: 'Takeaway', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', Icon: Package },
      delivery: { label: 'Delivery', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', Icon: MapPin },
    };
    const cfg = configs[type] || configs.dine_in;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${cfg.color}`}>
        <cfg.Icon className="w-3 h-3" />{cfg.label}
      </span>
    );
  };

  const statusColors = {
    pending: 'bg-gray-900/30 text-gray-400 border-gray-700',
    confirmed: 'bg-green-900/30 text-green-400 border-green-700',
    preparing: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
    ready: 'bg-blue-900/30 text-blue-400 border-blue-700',
    out_for_delivery: 'bg-purple-900/30 text-purple-400 border-purple-700',
    delivered: 'bg-emerald-900/30 text-emerald-400 border-emerald-700',
    cancelled: 'bg-red-900/30 text-red-400 border-red-700',
  };

  const statusOptions = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

  const availableStaff = staff.filter(s => s.status === 'available');

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex gap-2">
          <LuxuryButton
            variant={queueView === 'active' ? 'primary' : 'secondary'}
            onClick={() => setQueueView('active')}
            size="sm"
          >
            Active Queue
          </LuxuryButton>
          <LuxuryButton
            variant={queueView === 'completed' ? 'primary' : 'secondary'}
            onClick={() => setQueueView('completed')}
            size="sm"
          >
            Completed
          </LuxuryButton>
          {permission !== 'granted' && (
            <LuxuryButton
              variant="ghost"
              onClick={requestNotificationPermission}
              size="sm"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable Alerts
            </LuxuryButton>
          )}
        </div>

        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-[#1a1a1a] border-[#c9a962]/20 text-white"
        />
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-48 bg-[#1a1a1a] border-[#c9a962]/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status}>
                {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Queue View */}
      {queueView === 'active' && statusFilter === 'all' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {Object.entries(ordersByStatus).filter(([status]) => !['delivered', 'cancelled'].includes(status)).map(([status, orders]) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-inter text-sm text-[#c9a962] uppercase tracking-wider">
                  {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </h3>
                <span className="font-inter text-xs text-white/50">
                  {orders.length} orders
                </span>
              </div>

              <div className="space-y-2">
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    className="bg-[#1a1a1a] rounded-xl p-4 border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-inter text-sm text-white font-medium">{order.customer_name}</p>
                        {orderTypeBadge(order)}
                      </div>
                      <p className="font-inter text-xs text-[#c9a962] font-mono">{order.order_reference}</p>
                      {order.pickup_time && (
                        <p className="font-inter text-xs text-amber-300 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {order.order_type === 'delivery' ? 'Deliver' : 'Pickup'} at {order.pickup_time}
                        </p>
                      )}
                    </div>
                      <p className="font-inter text-xs text-white/50">
                        {format(new Date(order.created_date), 'h:mm a')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-white/60 mb-3">
                      <span>{order.items?.length || 0} items</span>
                      <span className="text-[#c9a962]">KES {order.total_amount?.toLocaleString()}</span>
                    </div>

                    {order.payment_status === 'pending' && (
                      <div className="mb-3 p-2 rounded bg-orange-500/10 border border-orange-500/30">
                        <p className="font-inter text-xs text-orange-300">⚠ Payment Pending</p>
                      </div>
                    )}

                    {order.assigned_staff_name && (
                      <div className="flex items-center gap-2 mb-3 p-2 rounded bg-[#0a0a0a]">
                        <UserCheck className="w-3 h-3 text-[#c9a962]" />
                        <span className="font-inter text-xs text-white/70">
                          {order.assigned_staff_name}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {order.payment_status === 'pending' ? (
                        <LuxuryButton
                          size="sm"
                          onClick={() => handleMarkAsPaid(order.id)}
                          className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          Mark Paid
                        </LuxuryButton>
                      ) : (
                        <>
                          {!order.assigned_staff_id && status === 'pending' && (
                            <LuxuryButton
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedOrder(order);
                                setAssignDialogOpen(true);
                              }}
                              className="flex-1 text-xs"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              Assign
                            </LuxuryButton>
                          )}
                          
                          <LuxuryButton
                            size="sm"
                            onClick={() => autoProgressOrder(order)}
                            className="flex-1 text-xs"
                            disabled={status === 'out_for_delivery'}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Next
                          </LuxuryButton>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}

                {orders.length === 0 && (
                  <div className="text-center py-8 text-white/30 text-xs">
                    No orders
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Detailed List View
        isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-[#c9a962]/30 mx-auto mb-4" />
            <p className="font-inter text-white/50">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Customer Info */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-playfair text-xl text-white">{order.customer_name}</h3>
                        {orderTypeBadge(order)}
                      </div>
                      <p className="font-inter text-xs text-[#c9a962] font-mono">{order.order_reference}</p>
                      {order.pickup_time && (
                        <p className="font-inter text-sm text-amber-300 mt-1 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'} at {order.pickup_time} · {order.pickup_date}
                        </p>
                      )}
                      {order.delivery_address && (
                        <p className="font-inter text-xs text-purple-300 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {order.delivery_address}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-white/60">
                        <Mail className="w-4 h-4 text-[#c9a962]" />
                        <span className="font-inter">{order.customer_email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <Phone className="w-4 h-4 text-[#c9a962]" />
                        <span className="font-inter">{order.customer_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <Clock className="w-4 h-4 text-[#c9a962]" />
                        <span className="font-inter">
                          {format(new Date(order.created_date), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>

                    {order.assigned_staff_name && (
                      <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#c9a962]/10">
                        <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">
                          Assigned To
                        </p>
                        <p className="font-inter text-sm text-white/70">
                          {order.assigned_staff_name}
                        </p>
                      </div>
                    )}

                    {order.special_instructions && (
                      <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#c9a962]/10">
                        <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">
                          Special Instructions
                        </p>
                        <p className="font-inter text-sm text-white/70">
                          {order.special_instructions}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="w-4 h-4 text-[#c9a962]" />
                      <h4 className="font-inter text-xs text-[#c9a962] uppercase tracking-wider">
                        Order Items
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#0a0a0a]">
                          <div className="flex-1">
                            <p className="font-inter text-sm text-white">{item.name}</p>
                            <p className="font-inter text-xs text-white/50">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-inter text-sm text-[#c9a962]">
                            KES {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-[#c9a962]/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-playfair text-lg text-white">Total</span>
                        <span className="font-playfair text-2xl text-[#c9a962]">
                          KES {order.total_amount?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-inter text-xs text-white/50">Payment Status</span>
                        <span className={`font-inter text-xs font-medium ${
                          order.payment_status === 'paid' ? 'text-green-400' : 'text-orange-300'
                        }`}>
                          {order.payment_status === 'paid' ? '✓ Paid' : '⚠ Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    {order.payment_status === 'pending' && (
                      <LuxuryButton
                        onClick={() => handleMarkAsPaid(order.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Mark as Paid
                      </LuxuryButton>
                    )}

                    <Select
                      value={order.status}
                      onValueChange={(status) => updateOrderMutation.mutate({ id: order.id, data: { status } })}
                      disabled={order.payment_status === 'pending'}
                    >
                      <SelectTrigger className="w-full bg-[#0a0a0a] border-[#c9a962]/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
                        {statusOptions.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {order.payment_status === 'paid' && !order.assigned_staff_id && (
                      <LuxuryButton
                        variant="secondary"
                        onClick={() => {
                          setSelectedOrder(order);
                          setAssignDialogOpen(true);
                        }}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Assign Staff
                      </LuxuryButton>
                    )}

                    {order.payment_status === 'paid' && (
                      <LuxuryButton onClick={() => autoProgressOrder(order)}>
                        <Play className="w-4 h-4 mr-2" />
                        Auto Progress
                      </LuxuryButton>
                    )}

                    <div className={`px-4 py-3 rounded-xl text-center border ${statusColors[order.status]}`}>
                      <p className="font-inter text-xs uppercase tracking-wider">
                        {order.status?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </p>
                    </div>

                    {order.payment_status === 'pending' && (
                      <div className="px-4 py-3 rounded-xl text-center bg-orange-500/10 border border-orange-500/30">
                        <p className="font-inter text-xs text-orange-300">
                          ⚠ Awaiting Payment
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Assign Staff Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#c9a962]/20 text-white">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl">Assign Staff Member</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="font-inter text-sm text-white/70">
              Select a staff member to handle this order
            </p>

            {availableStaff.length === 0 ? (
              <p className="text-center py-4 text-white/50 text-sm">
                No available staff members
              </p>
            ) : (
              <div className="space-y-2">
                {availableStaff.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => assignStaffMutation.mutate({
                      orderId: selectedOrder?.id,
                      staffId: member.id
                    })}
                    className="w-full p-4 rounded-xl bg-[#0a0a0a] border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all text-left"
                  >
                    <p className="font-inter text-white font-medium">{member.name}</p>
                    <p className="font-inter text-xs text-[#c9a962]">
                      {member.role?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}