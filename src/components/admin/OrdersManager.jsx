import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShoppingCart, User, Mail, Phone, MapPin, Clock, DollarSign, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import LuxuryButton from '../common/LuxuryButton';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function OrdersManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders-list'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders-list']);
      queryClient.invalidateQueries(['admin-orders']);
      toast.success('Order status updated');
    },
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_reference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    pending: 'bg-gray-900/30 text-gray-400 border-gray-700',
    confirmed: 'bg-green-900/30 text-green-400 border-green-700',
    preparing: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
    ready: 'bg-blue-900/30 text-blue-400 border-blue-700',
    delivered: 'bg-purple-900/30 text-purple-400 border-purple-700',
    cancelled: 'bg-red-900/30 text-red-400 border-red-700',
  };

  const statusOptions = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-[#1a1a1a] border-[#c9a962]/20 text-white"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-[#1a1a1a] border-[#c9a962]/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {isLoading ? (
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
                {/* Left: Customer Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-playfair text-xl text-white mb-1">
                      {order.customer_name}
                    </h3>
                    <p className="font-inter text-xs text-[#c9a962] font-mono">
                      {order.order_reference}
                    </p>
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
                    {order.address && (
                      <div className="flex items-center gap-2 text-white/60">
                        <MapPin className="w-4 h-4 text-[#c9a962]" />
                        <span className="font-inter">{order.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/60">
                      <Clock className="w-4 h-4 text-[#c9a962]" />
                      <span className="font-inter">
                        {order.created_date && format(new Date(order.created_date), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>

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

                {/* Middle: Order Items */}
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
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-[#c9a962]/10">
                    <div className="flex items-center justify-between">
                      <span className="font-playfair text-lg text-white">Total</span>
                      <span className="font-playfair text-2xl text-[#c9a962]">
                        ${order.total_amount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-inter text-xs text-white/50">Payment Method</span>
                      <span className="font-inter text-xs text-white/70">
                        {order.payment_method?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-inter text-xs text-white/50">Payment Status</span>
                      <span className={`font-inter text-xs px-2 py-0.5 rounded-full ${
                        order.payment_status === 'paid' ? 'bg-green-900/30 text-green-400' :
                        order.payment_status === 'failed' ? 'bg-red-900/30 text-red-400' :
                        'bg-gray-900/30 text-gray-400'
                      }`}>
                        {order.payment_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Status Control */}
                <div className="flex flex-col justify-between">
                  <div>
                    <h4 className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-3">
                      Order Status
                    </h4>
                    <Select
                      value={order.status}
                      onValueChange={(status) => updateStatusMutation.mutate({ id: order.id, status })}
                    >
                      <SelectTrigger className="w-full bg-[#0a0a0a] border-[#c9a962]/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
                        {statusOptions.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={`mt-4 px-4 py-3 rounded-xl text-center border ${statusColors[order.status] || statusColors.pending}`}>
                    <p className="font-inter text-xs uppercase tracking-wider">
                      Current Status
                    </p>
                    <p className="font-playfair text-lg mt-1">
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}