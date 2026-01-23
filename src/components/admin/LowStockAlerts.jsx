import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, TrendingDown, Plus, Minus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import LuxuryButton from '../common/LuxuryButton';
import { useNotifications } from '@/components/notifications/NotificationManager';
import { toast } from 'sonner';

export default function LowStockAlerts() {
  const [notifiedItems, setNotifiedItems] = useState(new Set());
  const queryClient = useQueryClient();
  const { sendNotification } = useNotifications();

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['admin-menu-items'],
    queryFn: () => base44.entities.MenuItem.list('-created_date'),
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, stock_count }) => base44.entities.MenuItem.update(id, { stock_count }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-menu-items']);
      toast.success('Stock updated');
    },
  });

  // Monitor low stock and send alerts
  useEffect(() => {
    const lowStockItems = menuItems.filter(
      item => (item.stock_count || 0) <= (item.low_stock_threshold || 10)
    );

    lowStockItems.forEach(item => {
      const key = `${item.id}-${item.stock_count}`;
      if (!notifiedItems.has(key)) {
        sendNotification('⚠️ Low Stock Alert', {
          body: `${item.name} is running low (${item.stock_count} left)`,
          tag: `low-stock-${item.id}`,
          requireInteraction: true,
          toastOptions: {
            duration: 8000,
            action: {
              label: 'Restock',
              onClick: () => {
                updateStockMutation.mutate({ 
                  id: item.id, 
                  stock_count: (item.stock_count || 0) + 50 
                });
              },
            },
          },
        });
        setNotifiedItems(prev => new Set([...prev, key]));
      }
    });
  }, [menuItems, sendNotification]);

  // Real-time subscription for stock changes
  useEffect(() => {
    const unsubscribe = base44.entities.MenuItem.subscribe((event) => {
      if (event.type === 'update') {
        const item = event.data;
        if ((item.stock_count || 0) <= (item.low_stock_threshold || 10)) {
          sendNotification('⚠️ Stock Alert', {
            body: `${item.name} stock is now ${item.stock_count}`,
            tag: `stock-update-${item.id}`,
            toastOptions: { duration: 5000 },
          });
        }
      }
      queryClient.invalidateQueries(['admin-menu-items']);
    });
    return unsubscribe;
  }, [queryClient, sendNotification]);

  const lowStockItems = menuItems.filter(
    item => (item.stock_count || 0) <= (item.low_stock_threshold || 10)
  );

  const criticalItems = lowStockItems.filter(item => (item.stock_count || 0) === 0);
  const warningItems = lowStockItems.filter(
    item => (item.stock_count || 0) > 0 && (item.stock_count || 0) <= (item.low_stock_threshold || 10)
  );

  const adjustStock = (item, delta) => {
    const newStock = Math.max(0, (item.stock_count || 0) + delta);
    updateStockMutation.mutate({ id: item.id, stock_count: newStock });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-inter text-xs text-white/50 uppercase tracking-wider mb-1">
                Total Items
              </p>
              <p className="font-playfair text-3xl text-white">{menuItems.length}</p>
            </div>
            <Package className="w-10 h-10 text-[#c9a962]/30" />
          </div>
        </div>

        <div className="bg-red-900/20 rounded-2xl p-6 border border-red-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-inter text-xs text-red-400 uppercase tracking-wider mb-1">
                Out of Stock
              </p>
              <p className="font-playfair text-3xl text-red-400">{criticalItems.length}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-400/50" />
          </div>
        </div>

        <div className="bg-yellow-900/20 rounded-2xl p-6 border border-yellow-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-inter text-xs text-yellow-400 uppercase tracking-wider mb-1">
                Low Stock
              </p>
              <p className="font-playfair text-3xl text-yellow-400">{warningItems.length}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-yellow-400/50" />
          </div>
        </div>
      </div>

      {/* Critical - Out of Stock */}
      {criticalItems.length > 0 && (
        <div>
          <h3 className="font-playfair text-xl text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Out of Stock
          </h3>
          <div className="space-y-3">
            {criticalItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-900/10 rounded-xl p-4 border border-red-700/30 flex items-center gap-4"
              >
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-playfair text-lg text-white">{item.name}</h4>
                  <p className="font-inter text-xs text-white/50">{item.category?.replace('_', ' ')}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-inter bg-red-900/30 text-red-400 border border-red-700/50">
                      OUT OF STOCK
                    </span>
                    <span className="font-inter text-xs text-white/50">
                      Threshold: {item.low_stock_threshold || 10}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <LuxuryButton
                    size="sm"
                    onClick={() => adjustStock(item, 50)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add 50
                  </LuxuryButton>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Warning - Low Stock */}
      {warningItems.length > 0 && (
        <div>
          <h3 className="font-playfair text-xl text-yellow-400 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Low Stock Warning
          </h3>
          <div className="space-y-3">
            {warningItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-yellow-900/10 rounded-xl p-4 border border-yellow-700/30 flex items-center gap-4"
              >
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-playfair text-lg text-white">{item.name}</h4>
                  <p className="font-inter text-xs text-white/50">{item.category?.replace('_', ' ')}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-inter bg-yellow-900/30 text-yellow-400 border border-yellow-700/50">
                      {item.stock_count} LEFT
                    </span>
                    <span className="font-inter text-xs text-white/50">
                      Threshold: {item.low_stock_threshold || 10}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustStock(item, -10)}
                    className="p-2 rounded-full bg-[#0a0a0a] border border-[#c9a962]/20 hover:bg-[#c9a962]/10"
                    disabled={item.stock_count <= 0}
                  >
                    <Minus className="w-4 h-4 text-white" />
                  </button>
                  <Input
                    type="number"
                    value={item.stock_count || 0}
                    onChange={(e) => updateStockMutation.mutate({ 
                      id: item.id, 
                      stock_count: parseInt(e.target.value) || 0 
                    })}
                    className="w-20 bg-[#0a0a0a] border-[#c9a962]/20 text-white text-center"
                  />
                  <button
                    onClick={() => adjustStock(item, 10)}
                    className="p-2 rounded-full bg-[#0a0a0a] border border-[#c9a962]/20 hover:bg-[#c9a962]/10"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Clear */}
      {lowStockItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-[#c9a962]/30 mx-auto mb-4" />
          <h3 className="font-playfair text-2xl text-white mb-2">All Stocked Up!</h3>
          <p className="font-inter text-white/50">No low stock alerts at the moment</p>
        </div>
      )}
    </div>
  );
}