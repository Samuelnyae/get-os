import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Shield, AlertCircle, LayoutDashboard, Utensils, ShoppingBag,
  Calendar, MessageSquare, User, Star, Bell, BarChart3
} from 'lucide-react';
import LuxuryButton from '@/components/common/LuxuryButton';
import HotelLayout from '@/components/hotel/HotelLayout';

const MenuItemsManager = React.lazy(() => import('@/components/admin/MenuItemsManager'));
const OrdersManager = React.lazy(() => import('@/components/admin/OrdersManager'));
const ReservationsManager = React.lazy(() => import('@/components/admin/ReservationsManager'));
const StaffManager = React.lazy(() => import('@/components/admin/StaffManager'));
const DashboardStats = React.lazy(() => import('@/components/admin/DashboardStats'));
const FeedbackViewer = React.lazy(() => import('@/components/admin/FeedbackViewer'));
const FeedbackInsights = React.lazy(() => import('@/components/admin/FeedbackInsights'));
const DNDSettings = React.lazy(() => import('@/components/admin/DNDSettings'));
const AdvancedAnalytics = React.lazy(() => import('@/components/admin/AdvancedAnalytics'));

export default function HotelAdmin() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { data: hotels = [], isLoading: hotelLoading } = useQuery({
    queryKey: ['hotel', slug],
    queryFn: () => base44.entities.Hotel.filter({ slug }),
  });
  const hotel = hotels[0];

  useEffect(() => {
    base44.auth.me()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const isAuthorized = user && (
    user.role === 'admin' ||
    (hotel?.owner_email && user.email === hotel.owner_email)
  );

  if (authLoading || hotelLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="font-playfair text-3xl text-white mb-4">Hotel Not Found</h2>
          <Link to="/Hotels"><LuxuryButton>View All Locations</LuxuryButton></Link>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <HotelLayout hotel={hotel}>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="font-playfair text-3xl text-white mb-4">Access Denied</h2>
            <p className="font-inter text-white/60 mb-8">
              You don't have permission to manage this hotel. Only the hotel owner or main admin can access this dashboard.
            </p>
            <Link to={`/hotel/${slug}`}><LuxuryButton>Back to Hotel</LuxuryButton></Link>
          </div>
        </div>
      </HotelLayout>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'orders', label: 'Order Queue', icon: ShoppingBag },
    { id: 'menu', label: 'Menu Items', icon: Utensils },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'staff', label: 'Staff', icon: User },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'feedback-insights', label: 'Feedback Insights', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <HotelLayout hotel={hotel}>
      <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#c9a962]" />
            </div>
            <div>
              <h1 className="font-playfair text-3xl text-white">{hotel.name} — Dashboard</h1>
              <p className="font-inter text-sm text-white/50">{hotel.location} · {hotel.address}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-[#c9a962]/10 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-inter text-sm transition-all ${
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
              {activeTab === 'dashboard' && <DashboardStats hotelId={hotel.id} />}
              {activeTab === 'analytics' && <AdvancedAnalytics hotelId={hotel.id} />}
              {activeTab === 'orders' && <OrdersManager hotelId={hotel.id} />}
              {activeTab === 'menu' && <MenuItemsManager hotelId={hotel.id} />}
              {activeTab === 'reservations' && <ReservationsManager hotelId={hotel.id} />}
              {activeTab === 'staff' && <StaffManager hotelId={hotel.id} />}
              {activeTab === 'feedback' && <FeedbackViewer hotelId={hotel.id} />}
              {activeTab === 'feedback-insights' && <FeedbackInsights hotelId={hotel.id} />}
              {activeTab === 'notifications' && <DNDSettings />}
            </React.Suspense>
          </motion.div>
        </div>
      </div>
    </HotelLayout>
  );
}