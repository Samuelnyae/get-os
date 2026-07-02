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
  Lightbulb, Mail, Link
} from 'lucide-react';

const MODULE_ITEMS = [
  // Core
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Order Queue', icon: ListOrdered },
  { id: 'reservations', label: 'Reservations', icon: CalendarCheck },
  { id: 'event-bookings', label: 'Event Bookings', icon: PartyPopper },
  { id: 'amenity-bookings', label: 'Spa & Amenities', icon: Sparkles },
  { id: 'hotel', label: 'Hotel Management', icon: Hotel },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'export', label: 'Data Export', icon: Download },
  // Restaurant & POS
  { id: 'menu', label: 'Menu Items', icon: UtensilsCrossed },
  { id: 'kds', label: 'Kitchen Display', icon: ChefHat },
  { id: 'custom', label: 'Custom Requests', icon: ClipboardList },
  { id: 'tables', label: 'Table Management', icon: LayoutGrid },
  { id: 'reconciliation', label: 'Reconciliation', icon: Receipt },
  // Inventory & Supply Chain
  { id: 'inventory-tracking', label: 'Inventory Tracking', icon: Package },
  { id: 'stock', label: 'Stock Alerts', icon: AlertTriangle },
  { id: 'supply-chain', label: 'Supply Chain', icon: Truck },
  { id: 'vendor-performance', label: 'Vendor Performance', icon: Star },
  { id: 'driver', label: 'Driver Mode', icon: Car },
  // Business Intelligence
  { id: 'revenue-forecast', label: 'Revenue Forecast', icon: TrendingUp },
  { id: 'demand-heatmap', label: 'Demand Heatmap', icon: Flame },
  { id: 'menu-profitability', label: 'Menu Profitability', icon: DollarSign },
  { id: 'clv', label: 'Customer CLV', icon: Heart },
  { id: 'competitor', label: 'Competitors', icon: Target },
  { id: 'sustainability', label: 'Sustainability', icon: Leaf },
  { id: 'analytics', label: 'Advanced Analytics', icon: BarChart3 },
  // AI Automation
  { id: 'insights', label: 'AI Insights', icon: Brain },
  { id: 'fulfillment', label: 'AI Fulfillment', icon: PackageCheck },
  { id: 'marketing', label: 'AI Marketing', icon: Megaphone },
  { id: 'feedbackai', label: 'AI Feedback', icon: MessageSquare },
  { id: 'ai-order-agent', label: 'AI Order Agent', icon: Bot },
  { id: 'tables-ai', label: 'AI Table Mgmt', icon: LayoutGrid },
  { id: 'inventory', label: 'AI Inventory', icon: Boxes },
  { id: 'reorder-agent', label: 'Reorder Agent', icon: RefreshCw },
  { id: 'shift-manager', label: 'AI Shift Manager', icon: Clock },
  // Workforce
  { id: 'hr', label: 'HR & Workforce', icon: Briefcase },
  // Customer Experience
  { id: 'guest-exp', label: 'Guest Experience', icon: HeartHandshake },
  { id: 'feedback', label: 'Feedback', icon: MessageCircle },
  { id: 'feedback-insights', label: 'Feedback Insights', icon: Lightbulb },
  // Sales & Marketing
  { id: 'marketing-crm', label: 'Marketing & CRM', icon: Mail },
  // Integrations
  { id: 'integrations', label: 'Integrations', icon: Link },
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