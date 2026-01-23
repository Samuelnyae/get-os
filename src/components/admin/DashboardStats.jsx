import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  DollarSign, ShoppingCart, Utensils, 
  Users, TrendingUp, Star, Sparkles, MessageSquare 
} from 'lucide-react';

export default function DashboardStats() {
  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['admin-menu'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: customRequests = [] } = useQuery({
    queryKey: ['admin-custom'],
    queryFn: () => base44.entities.CustomFoodRequest.list('-created_date', 50),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['admin-comments'],
    queryFn: () => base44.entities.Comment.list('-created_date', 100),
  });

  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const recentOrders = orders.filter(o => {
    const orderDate = new Date(o.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return orderDate >= weekAgo;
  }).length;

  const pendingCustomRequests = customRequests.filter(r => r.status === 'pending').length;

  const stats = [
    { 
      icon: DollarSign, 
      label: 'Total Revenue', 
      value: `$${totalRevenue.toFixed(2)}`,
      change: '+12.5%',
      color: 'text-green-400'
    },
    { 
      icon: ShoppingCart, 
      label: 'Orders (7 days)', 
      value: recentOrders,
      change: '+8.2%',
      color: 'text-blue-400'
    },
    { 
      icon: Utensils, 
      label: 'Menu Items', 
      value: menuItems.length,
      change: '',
      color: 'text-[#c9a962]'
    },
    { 
      icon: Sparkles, 
      label: 'Pending Requests', 
      value: pendingCustomRequests,
      change: '',
      color: 'text-purple-400'
    },
    { 
      icon: MessageSquare, 
      label: 'Total Comments', 
      value: comments.length,
      change: '',
      color: 'text-pink-400'
    },
    { 
      icon: Star, 
      label: 'Avg. Rating', 
      value: comments.length > 0 ? 
        (comments.reduce((sum, c) => sum + (c.rating || 5), 0) / comments.length).toFixed(1) : 
        'N/A',
      change: '',
      color: 'text-yellow-400'
    },
  ];

  const recentOrdersList = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-[#c9a962]/10 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              {stat.change && (
                <span className="flex items-center gap-1 text-xs font-inter text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </span>
              )}
            </div>
            <p className="font-inter text-xs text-white/50 uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className="font-playfair text-3xl text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
        <h3 className="font-playfair text-xl text-white mb-6 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#c9a962]" />
          Recent Orders
        </h3>
        <div className="space-y-3">
          {recentOrdersList.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0a] border border-[#c9a962]/10"
            >
              <div className="flex-1">
                <p className="font-inter text-sm text-white font-medium">{order.customer_name}</p>
                <p className="font-inter text-xs text-white/50">{order.order_reference}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-inter ${
                  order.status === 'confirmed' ? 'bg-green-900/30 text-green-400' :
                  order.status === 'preparing' ? 'bg-yellow-900/30 text-yellow-400' :
                  order.status === 'ready' ? 'bg-blue-900/30 text-blue-400' :
                  order.status === 'delivered' ? 'bg-purple-900/30 text-purple-400' :
                  'bg-gray-900/30 text-gray-400'
                }`}>
                  {order.status}
                </span>
                <p className="font-playfair text-lg text-[#c9a962]">
                  ${order.total_amount?.toFixed(2)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Popular Items */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
        <h3 className="font-playfair text-xl text-white mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-[#c9a962]" />
          Most Liked Items
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems
            .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
            .slice(0, 6)
            .map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0a] border border-[#c9a962]/10"
              >
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-sm text-white truncate">{item.name}</p>
                  <p className="font-inter text-xs text-[#c9a962]">{item.likes_count || 0} likes</p>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}