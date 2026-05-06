import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
LayoutDashboard, Utensils, ShoppingBag, Truck,
Sparkles, MessageSquare, BarChart3, Shield, AlertCircle, User, Package, Calendar, Mail, Bot, TrendingUp, Brain, Bell, Star, Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import SectionHeader from '@/components/common/SectionHeader';
import LuxuryButton from '@/components/common/LuxuryButton';

// Lazy load heavy admin components
const MenuItemsManager = React.lazy(() => import('@/components/admin/MenuItemsManager'));
const CustomRequestsManager = React.lazy(() => import('@/components/admin/CustomRequestsManager'));
const OrdersManager = React.lazy(() => import('@/components/admin/OrdersManager'));
const ReservationsManager = React.lazy(() => import('@/components/admin/ReservationsManager'));
const FeedbackViewer = React.lazy(() => import('@/components/admin/FeedbackViewer'));
const DashboardStats = React.lazy(() => import('@/components/admin/DashboardStats'));
const AIInsights = React.lazy(() => import('@/components/admin/AIInsights'));
const AIMarketingCampaigns = React.lazy(() => import('@/components/admin/AIMarketingCampaigns'));
const AIOrderFulfillment = React.lazy(() => import('@/components/admin/AIOrderFulfillment'));
const AIInventoryManagement = React.lazy(() => import('@/components/admin/AIInventoryManagement'));
const AIFeedbackAnalysis = React.lazy(() => import('@/components/admin/AIFeedbackAnalysis'));
const AITableManagement = React.lazy(() => import('@/components/admin/AITableManagement'));
const StaffManager = React.lazy(() => import('@/components/admin/StaffManager'));
const LowStockAlerts = React.lazy(() => import('@/components/admin/LowStockAlerts'));
const DNDSettings = React.lazy(() => import('@/components/admin/DNDSettings'));
const AdvancedAnalytics = React.lazy(() => import('@/components/admin/AdvancedAnalytics'));
const FeedbackInsights = React.lazy(() => import('@/components/admin/FeedbackInsights'));
const DataExport = React.lazy(() => import('@/components/admin/DataExport'));


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
    { id: 'analytics', label: 'Advanced Analytics', icon: TrendingUp },
    { id: 'insights', label: 'AI Insights', icon: BarChart3 },
    { id: 'fulfillment', label: 'AI Fulfillment', icon: Bot },
    { id: 'inventory', label: 'AI Inventory', icon: TrendingUp },
    { id: 'feedbackai', label: 'AI Feedback', icon: Brain },
    { id: 'tables', label: 'AI Table Mgmt', icon: Calendar },
    { id: 'marketing', label: 'AI Marketing', icon: Mail },
    { id: 'driver', label: '🚚 Driver Mode', icon: Truck },
    { id: 'orders', label: 'Order Queue', icon: ShoppingBag },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'staff', label: 'Staff', icon: User },
    { id: 'stock', label: 'Stock Alerts', icon: Package },
    { id: 'inventory-tracking', label: 'Inventory Tracking', icon: Package },
    { id: 'menu', label: 'Menu Items', icon: Utensils },
    { id: 'custom', label: 'Custom Requests', icon: Sparkles },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'feedback-insights', label: 'Feedback Insights', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'export', label: 'Data Export', icon: Package },
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
          <React.Suspense fallback={
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
            </div>
          }>

            {activeTab === 'dashboard' && <DashboardStats />}
            {activeTab === 'analytics' && <AdvancedAnalytics />}
            {activeTab === 'insights' && <AIInsights />}
            {activeTab === 'fulfillment' && <AIOrderFulfillment />}
            {activeTab === 'inventory' && <AIInventoryManagement />}
            {activeTab === 'feedbackai' && <AIFeedbackAnalysis />}
            {activeTab === 'tables' && <AITableManagement />}
            {activeTab === 'marketing' && <AIMarketingCampaigns />}
            {activeTab === 'driver' && (
              <React.Suspense fallback={<div className="flex justify-center py-12"><div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" /></div>}>
                {React.createElement(React.lazy(() => import('./DriverMode')))}
              </React.Suspense>
            )}
            {activeTab === 'orders' && <OrdersManager />}
            {activeTab === 'reservations' && <ReservationsManager />}
            {activeTab === 'staff' && <StaffManager />}
            {activeTab === 'stock' && <LowStockAlerts />}
            {activeTab === 'inventory-tracking' && (
              <React.Suspense fallback={<div className="flex justify-center py-12"><div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" /></div>}>
                {React.createElement(React.lazy(() => import('./Inventory')))}
              </React.Suspense>
            )}
            {activeTab === 'menu' && <MenuItemsManager />}
            {activeTab === 'custom' && <CustomRequestsManager />}
            {activeTab === 'feedback' && <FeedbackViewer />}
            {activeTab === 'feedback-insights' && <FeedbackInsights />}
            {activeTab === 'notifications' && <DNDSettings />}
            {activeTab === 'export' && <DataExport />}
          </React.Suspense>
        </motion.div>
      </div>
    </div>
  );
}