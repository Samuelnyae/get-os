import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { AlertCircle, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import LuxuryButton from '@/components/common/LuxuryButton';
import AdminSidebar from '@/components/admin/AdminSidebar';
import SetupChecklist from '@/components/onboarding/SetupChecklist';

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

// HR sub-components
const AttendanceTracker = React.lazy(() => import('@/components/hr/AttendanceTracker'));
const ShiftCalendar = React.lazy(() => import('@/components/hr/ShiftCalendar'));
const PerformanceReviews = React.lazy(() => import('@/components/hr/PerformanceReviews'));
const TrainingTracker = React.lazy(() => import('@/components/hr/TrainingTracker'));
const NoticeBoard = React.lazy(() => import('@/components/hr/NoticeBoard'));

// Hotel sub-components
const RoomStatusBoard = React.lazy(() => import('@/components/hotel-mgmt/RoomStatusBoard'));
const BookingCalendar = React.lazy(() => import('@/components/hotel-mgmt/BookingCalendar'));
const CheckInOut = React.lazy(() => import('@/components/hotel-mgmt/CheckInOut'));
const HousekeepingBoard = React.lazy(() => import('@/components/hotel-mgmt/HousekeepingBoard'));
const GuestCRM = React.lazy(() => import('@/components/hotel-mgmt/GuestCRM'));
const RoomServiceOrders = React.lazy(() => import('@/components/hotel-mgmt/RoomServiceOrders'));

// Standalone pages
const SupplierMarketplacePage = React.lazy(() => import('./SupplierMarketplace'));
const QRCodeAdminPage = React.lazy(() => import('./QRCode'));

// AI Agent
const BookingAssistantChat = React.lazy(() => import('@/components/agent/BookingAssistantChat'));
const BookingAssistantFAB = React.lazy(() => import('@/components/agent/BookingAssistantFAB'));

const LazyFallback = () => (
  <div className="flex justify-center py-12">
    <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
  </div>
);

const lazyPage = (importFn) => React.lazy(importFn);

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        // Fetch the user's organization if they belong to one
        const orgId = currentUser?.data?.organization_id || currentUser?.organization_id;
        if (orgId) {
          try {
            const orgData = await base44.entities.Organization.get(orgId);
            setOrg(orgData);
          } catch (e) {
            // Retry once after 1.5s — auth session may still be syncing post-onboarding
            console.error('Org fetch failed, retrying...', e);
            setTimeout(async () => {
              try {
                const retryOrg = await base44.entities.Organization.get(orgId);
                setOrg(retryOrg);
              } catch (e2) {
                console.error('Org fetch retry also failed:', e2);
              }
            }, 1500);
          }
        }
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

  if (!user || (user.role !== 'admin' && user.role !== 'owner' && user.role !== 'platform_admin')) {
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
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 min-w-0">
          {org?.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#c9a962]" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-playfair text-xl sm:text-2xl lg:text-3xl text-white truncate">{org?.name || 'Get OS'}</h1>
            <p className="font-inter text-xs sm:text-sm text-white/50 capitalize">
              {org ? `${org.industry?.replace(/_/g, ' ')} · ${org.plan} Plan` : 'Management Dashboard'}
            </p>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="mb-6">
          <AdminSidebar
            activeTab={activeTab}
            setActiveTab={handleSelect}
            enabledModules={org?.enabled_modules || []}
            aiModules={org?.ai_modules || []}
            showAll={user?.role === 'platform_admin'}
          />
        </div>

        {/* Content */}
        <div className="min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <React.Suspense fallback={<LazyFallback />}>
                {activeTab === 'dashboard' && (
                  <>
                    <SetupChecklist />
                    <DashboardStats />
                  </>
                )}
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
                {activeTab === 'ai-concierge' && <BookingAssistantChat />}
                {activeTab === 'ai-forecasting' && <AIRevenueForecast />}
                {activeTab === 'room-bookings' && <BookingCalendar />}
                {activeTab === 'room-status' && <RoomStatusBoard />}
                {activeTab === 'guest-profiles' && <GuestCRM />}
                {activeTab === 'hotel-bookings' && <CheckInOut />}
                {activeTab === 'service-requests' && <RoomServiceOrders />}
                {activeTab === 'concierge-intel' && <HousekeepingBoard />}
                {activeTab === 'attendance' && <AttendanceTracker />}
                {(activeTab === 'leave-shifts' || activeTab === 'scheduling') && <ShiftCalendar />}
                {activeTab === 'performance' && <PerformanceReviews />}
                {activeTab === 'training' && <TrainingTracker />}
                {activeTab === 'notice-board' && <NoticeBoard />}
                {activeTab === 'supplier-marketplace' && <SupplierMarketplacePage />}
                {activeTab === 'qr-code' && <QRCodeAdminPage />}
                {activeTab === 'setup-checklist' && <SetupChecklist />}
              </React.Suspense>
            </motion.div>
          </div>
      </div>
      <React.Suspense fallback={null}>
        <BookingAssistantFAB />
      </React.Suspense>
    </div>
  );
}