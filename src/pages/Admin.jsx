import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Utensils, ShoppingBag, 
  Sparkles, MessageSquare, BarChart3, Shield
} from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';
import MenuItemsManager from '@/components/admin/MenuItemsManager';
import CustomRequestsManager from '@/components/admin/CustomRequestsManager';
import OrdersManager from '@/components/admin/OrdersManager';
import FeedbackViewer from '@/components/admin/FeedbackViewer';
import DashboardStats from '@/components/admin/DashboardStats';
import AIInsights from '@/components/admin/AIInsights';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'insights', label: 'AI Insights', icon: BarChart3 },
    { id: 'menu', label: 'Menu Items', icon: Utensils },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'custom', label: 'Custom Requests', icon: Sparkles },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#c9a962]" />
              </div>
              <div>
                <h1 className="font-playfair text-3xl text-white">Admin Panel</h1>
                <p className="font-inter text-sm text-white/50">Hermanas Bites Management</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-[#c9a962]/10 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-inter text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-[#c9a962] text-[#0a0a0a]'
                  : 'bg-[#1a1a1a] text-white/70 border border-[#c9a962]/10 hover:border-[#c9a962]/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && <DashboardStats />}
          {activeTab === 'insights' && <AIInsights />}
          {activeTab === 'menu' && <MenuItemsManager />}
          {activeTab === 'orders' && <OrdersManager />}
          {activeTab === 'custom' && <CustomRequestsManager />}
          {activeTab === 'feedback' && <FeedbackViewer />}
        </motion.div>
      </div>
    </div>
  );
}