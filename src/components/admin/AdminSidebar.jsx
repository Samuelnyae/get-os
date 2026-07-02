import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { getAllowedTabs } from '@/lib/moduleMapping';
import {
  LayoutDashboard, ListOrdered, CalendarCheck, PartyPopper, Sparkles,
  Hotel, Users, Bell, Download, UtensilsCrossed, ChefHat, ClipboardList,
  LayoutGrid, Receipt, Package, AlertTriangle, Truck, Star, Car,
  TrendingUp, Flame, DollarSign, Heart, Target, Leaf, BarChart3,
  Brain, PackageCheck, Megaphone, MessageSquare, Bot, Boxes,
  RefreshCw, Clock, Briefcase, HeartHandshake, MessageCircle,
  Lightbulb, Mail, Link,
  CalendarDays, BedDouble, DoorOpen, Contact, Wrench, Compass,
  Fingerprint, Award, GraduationCap, LineChart, Store, QrCode,
  CalendarClock, ListChecks
} from 'lucide-react';

const MODULE_ITEMS = [
  // Row 1
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'room-bookings', label: 'Room Bookings', icon: CalendarDays },
  { id: 'ai-concierge', label: 'AI Concierge', icon: Bot },
  { id: 'hotel-bookings', label: 'Hotel Bookings', icon: DoorOpen },
  { id: 'room-status', label: 'Room Status', icon: BedDouble },
  { id: 'guest-profiles', label: 'Guest Profiles', icon: Contact },
  // Row 2
  { id: 'service-requests', label: 'Service Requests', icon: Wrench },
  { id: 'concierge-intel', label: 'Concierge Intel', icon: Compass },
  { id: 'revenue-forecast', label: 'Revenue Forecast', icon: TrendingUp },
  { id: 'demand-heatmap', label: 'Demand Heatmap', icon: Flame },
  { id: 'menu-profitability', label: 'Menu Profit', icon: DollarSign },
  // Row 3
  { id: 'clv', label: 'Customer CLV', icon: Heart },
  { id: 'competitor', label: 'Competitors', icon: Target },
  { id: 'sustainability', label: 'Sustainability', icon: Leaf },
  { id: 'attendance', label: 'Attendance', icon: Fingerprint },
  { id: 'leave-shifts', label: 'Leave & Shifts', icon: CalendarDays },
  { id: 'performance', label: 'Performance', icon: Award },
  // Row 4
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'notice-board', label: 'Notice Board', icon: Megaphone },
  { id: 'ai-forecasting', label: 'AI Forecasting', icon: LineChart },
  { id: 'analytics', label: 'Advanced Analytics', icon: BarChart3 },
  { id: 'insights', label: 'AI Insights', icon: Brain },
  { id: 'fulfillment', label: 'AI Fulfillment', icon: PackageCheck },
  // Row 5
  { id: 'inventory', label: 'AI Inventory', icon: Boxes },
  { id: 'feedbackai', label: 'AI Feedback', icon: MessageSquare },
  { id: 'tables-ai', label: 'AI Table Mgmt', icon: LayoutGrid },
  { id: 'marketing', label: 'AI Marketing', icon: Megaphone },
  { id: 'supply-chain', label: 'Supply Chain', icon: Truck },
  { id: 'supplier-marketplace', label: 'Supplier Marketplace', icon: Store },
  // Row 6
  { id: 'driver', label: 'Driver Mode', icon: Car },
  { id: 'orders', label: 'Order Queue', icon: ListOrdered },
  { id: 'reservations', label: 'Reservations', icon: CalendarCheck },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'scheduling', label: 'Scheduling', icon: CalendarClock },
  { id: 'stock', label: 'Stock Alerts', icon: AlertTriangle },
  { id: 'menu', label: 'Menu Items', icon: UtensilsCrossed },
  // Row 7
  { id: 'custom', label: 'Custom Requests', icon: ClipboardList },
  { id: 'feedback', label: 'Feedback', icon: MessageCircle },
  { id: 'feedback-insights', label: 'Feedback Insights', icon: Lightbulb },
  { id: 'qr-code', label: 'QR Code', icon: QrCode },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'setup-checklist', label: 'Setup Checklist', icon: ListChecks },
  // Additional modules
  { id: 'event-bookings', label: 'Event Bookings', icon: PartyPopper },
  { id: 'amenity-bookings', label: 'Spa & Amenities', icon: Sparkles },
  { id: 'hotel', label: 'Hotel Management', icon: Hotel },
  { id: 'kds', label: 'Kitchen Display', icon: ChefHat },
  { id: 'tables', label: 'Table Management', icon: LayoutGrid },
  { id: 'reconciliation', label: 'Reconciliation', icon: Receipt },
  { id: 'inventory-tracking', label: 'Inventory Tracking', icon: Package },
  { id: 'vendor-performance', label: 'Vendor Performance', icon: Star },
  { id: 'ai-order-agent', label: 'AI Order Agent', icon: Bot },
  { id: 'reorder-agent', label: 'Reorder Agent', icon: RefreshCw },
  { id: 'shift-manager', label: 'AI Shift Manager', icon: Clock },
  { id: 'hr', label: 'HR & Workforce', icon: Briefcase },
  { id: 'guest-exp', label: 'Guest Experience', icon: HeartHandshake },
  { id: 'marketing-crm', label: 'Marketing & CRM', icon: Mail },
  { id: 'integrations', label: 'Integrations', icon: Link },
  { id: 'export', label: 'Data Export', icon: Download },
];

export default function AdminSidebar({ activeTab, setActiveTab, enabledModules = [], aiModules = [], showAll = false }) {
  const [search, setSearch] = useState('');

  const allowedTabs = showAll ? null : getAllowedTabs(enabledModules, aiModules);

  const allItems = useMemo(() => MODULE_ITEMS.filter(item => {
    const tabId = item.id === 'tables-ai' ? 'tables' : item.id;
    return !allowedTabs || allowedTabs.has(tabId);
  }), [allowedTabs]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(item => item.label.toLowerCase().includes(q));
  }, [allItems, search]);

  const handleSelect = (itemId) => {
    setActiveTab(itemId === 'tables-ai' ? 'tables' : itemId);
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search features..."
          className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-[#1e1e1e] border border-[#c9a962]/10 text-white/90 text-sm font-inter placeholder:text-white/30 focus:outline-none focus:border-[#c9a962]/30 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grid of buttons */}
      <div className="flex flex-wrap gap-2">
        {filteredItems.map((item) => {
          const itemId = item.id === 'tables-ai' ? 'tables' : item.id;
          const active = activeTab === itemId;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-inter text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-[#d4b47a] text-[#0a0a0a] shadow-lg shadow-[#d4b47a]/10'
                  : 'bg-[#1e1e1e] text-[#e0e0e0] hover:bg-[#2a2a2a] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <p className="text-sm text-white/40 font-inter py-4 text-center">
          No features found for "{search}"
        </p>
      )}
    </div>
  );
}