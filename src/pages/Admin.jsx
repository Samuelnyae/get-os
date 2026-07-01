import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Shield, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import LuxuryButton from '@/components/common/LuxuryButton';
import AdminSidebar from '@/components/admin/AdminSidebar';

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
const AIOrderAgent = React.lazy(() => import('@/components/admin/AIOrderAgent'));
const AIShiftManager = React.lazy(() => import('@/components/admin/AIShiftManager'));
const PaymentReconciliation = React.lazy(() => import('@/components/admin/PaymentReconciliation'));
const AIInventoryReorderAgent = React.lazy(() => import('@/components/admin/AIInventoryReorderAgent'));
const AIRevenueForecast = React.lazy(() => import('@/components/admin/AIRevenueForecast'));
const DemandHeatmap = React.lazy(() => import('@/components/admin/DemandHeatmap'));
const MenuProfitability = React.lazy(() => import('@/components/admin/MenuProfitability'));
const CustomerLifetimeValue = React.lazy(() => import('@/components/admin/CustomerLifetimeValue'));
const CompetitorBenchmark = React.lazy(() => import('@/components/admin/CompetitorBenchmark'));
const SustainabilityReport = React.lazy(() => import('@/components/admin/SustainabilityReport'));
const SupplyChain = React.lazy(() => import('./SupplyChain'));
const Integrations = React.lazy(() => import('./Integrations'));
const EventBookingsAdmin = React.lazy(() => import('@/components/admin/EventBookingsAdmin'));
const AmenityBookingsAdmin = React.lazy(() => import('@/components/admin/AmenityBookingsAdmin'));
const VendorPerformanceDashboard = React.lazy(() => import('@/components/admin/VendorPerformanceDashboard'));

const LazyFallback = () => (
  <div className="flex justify-center py-12">
    <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
  </div>
);

const lazyPage = (importFn) => React.lazy(importFn);

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleSelect = (id) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#c9a962]" />
            </div>
            <div>
              <h1 className="font-playfair text-3xl text-white">Hospitality OS</h1>
              <p className="font-inter text-sm text-white/50">Management Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#c9a962]/20 text-white/70 font-inter text-sm"
          >
            Modules
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-3 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <AdminSidebar activeTab={activeTab} setActiveTab={handleSelect} />
            </div>
          </aside>

          {/* Sidebar — mobile overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setSidebarOpen(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#1a1a1a] border-r border-[#c9a962]/20 p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-playfair text-lg text-[#c9a962]">Modules</span>
                  <button onClick={() => setSidebarOpen(false)} className="text-white/50">✕</button>
                </div>
                <AdminSidebar activeTab={activeTab} setActiveTab={handleSelect} />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <React.Suspense fallback={<LazyFallback />}>
                {activeTab === 'dashboard' && <DashboardStats />}
                {activeTab === 'revenue-forecast' && <AIRevenueForecast />}
                {activeTab === 'demand-heatmap' && <DemandHeatmap />}
                {activeTab === 'menu-profitability' && <MenuProfitability />}
                {activeTab === 'clv' && <CustomerLifetimeValue />}
                {activeTab === 'competitor' && <CompetitorBenchmark />}
                {activeTab === 'sustainability' && <SustainabilityReport />}
                {activeTab === 'supply-chain' && <SupplyChain />}
                {activeTab === 'vendor-performance' && <VendorPerformanceDashboard />}
                {activeTab === 'integrations' && <Integrations />}
                {activeTab === 'analytics' && <AdvancedAnalytics />}
                {activeTab === 'insights' && <AIInsights />}
                {activeTab === 'fulfillment' && <AIOrderFulfillment />}
                {activeTab === 'inventory' && <AIInventoryManagement />}
                {activeTab === 'feedbackai' && <AIFeedbackAnalysis />}
                {activeTab === 'tables' && <AITableManagement />}
                {activeTab === 'marketing' && <AIMarketingCampaigns />}
                {activeTab === 'driver' && (
                  <React.Suspense fallback={<LazyFallback />}>
                    {React.createElement(lazyPage(() => import('./DriverMode')))}
                  </React.Suspense>
                )}
                {activeTab === 'hotel' && (
                  <React.Suspense fallback={<LazyFallback />}>
                    {React.createElement(lazyPage(() => import('./HotelManagement')))}
                  </React.Suspense>
                )}
                {activeTab === 'hr' && (
                  <React.Suspense fallback={<LazyFallback />}>
                    {React.createElement(lazyPage(() => import('./HR')))}
                  </React.Suspense>
                )}
                {activeTab === 'guest-exp' && (
                  <React.Suspense fallback={<LazyFallback />}>
                    {React.createElement(lazyPage(() => import('./GuestExperience')))}
                  </React.Suspense>
                )}
                {activeTab === 'marketing-crm' && (
                  <React.Suspense fallback={<LazyFallback />}>
                    {React.createElement(lazyPage(() => import('./Marketing')))}
                  </React.Suspense>
                )}
                {activeTab === 'kds' && (
                  <React.Suspense fallback={<LazyFallback />}>
                    {React.createElement(lazyPage(() => import('./KDS')))}
                  </React.Suspense>
                )}
                {activeTab === 'ai-order-agent' && <AIOrderAgent />}
                {activeTab === 'shift-manager' && <AIShiftManager />}
                {activeTab === 'reconciliation' && <PaymentReconciliation />}
                {activeTab === 'reorder-agent' && <AIInventoryReorderAgent />}
                {activeTab === 'orders' && <OrdersManager />}
                {activeTab === 'reservations' && <ReservationsManager />}
                {activeTab === 'event-bookings' && <EventBookingsAdmin />}
                {activeTab === 'amenity-bookings' && <AmenityBookingsAdmin />}
                {activeTab === 'staff' && <StaffManager />}
                {activeTab === 'stock' && <LowStockAlerts />}
                {activeTab === 'inventory-tracking' && (
                  <React.Suspense fallback={<LazyFallback />}>
                    {React.createElement(lazyPage(() => import('./Inventory')))}
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
      </div>
    </div>
  );
}