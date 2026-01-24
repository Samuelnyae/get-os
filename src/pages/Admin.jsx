import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Utensils, ShoppingBag, 
  Sparkles, MessageSquare, BarChart3, Shield, AlertCircle, User, Package, Calendar, Mail, Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import SectionHeader from '@/components/common/SectionHeader';
import MenuItemsManager from '@/components/admin/MenuItemsManager';
import CustomRequestsManager from '@/components/admin/CustomRequestsManager';
import OrdersManager from '@/components/admin/OrdersManager';
import ReservationsManager from '@/components/admin/ReservationsManager';
import FeedbackViewer from '@/components/admin/FeedbackViewer';
import DashboardStats from '@/components/admin/DashboardStats';
import AIInsights from '@/components/admin/AIInsights';
import AIMarketingCampaigns from '@/components/admin/AIMarketingCampaigns';
import AIOrderFulfillment from '@/components/admin/AIOrderFulfillment';
import StaffManager from '@/components/admin/StaffManager';
import LowStockAlerts from '@/components/admin/LowStockAlerts';
import LuxuryButton from '@/components/common/LuxuryButton';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAdmin();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="font-playfair text-3xl text-white mb-4">Access Denied</h2>
          <p className="font-inter text-white/60 mb-8">
            You don't have permission to access the admin dashboard. This area is restricted to administrators only.
          </p>
          <Link to={createPageUrl('Home')}>
            <LuxuryButton>Return to Home</LuxuryButton>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'insights', label: 'AI Insights', icon: BarChart3 },
    { id: 'fulfillment', label: 'AI Fulfillment', icon: Bot },
    { id: 'marketing', label: 'AI Marketing', icon: Mail },
    { id: 'orders', label: 'Order Queue', icon: ShoppingBag },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'staff', label: 'Staff', icon: User },
    { id: 'stock', label: 'Stock Alerts', icon: Package },
    { id: 'menu', label: 'Menu Items', icon: Utensils },
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
          {activeTab === 'fulfillment' && <AIOrderFulfillment />}
          {activeTab === 'marketing' && <AIMarketingCampaigns />}
          {activeTab === 'orders' && <OrdersManager />}
          {activeTab === 'reservations' && <ReservationsManager />}
          {activeTab === 'staff' && <StaffManager />}
          {activeTab === 'stock' && <LowStockAlerts />}
          {activeTab === 'menu' && <MenuItemsManager />}
          {activeTab === 'custom' && <CustomRequestsManager />}
          {activeTab === 'feedback' && <FeedbackViewer />}
        </motion.div>
      </div>
    </div>
  );
}