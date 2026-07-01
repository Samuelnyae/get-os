import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const MODULES = [
  {
    id: 'core',
    label: 'Core Operations',
    emoji: '🏠',
    items: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'orders', label: 'Order Queue' },
      { id: 'reservations', label: 'Reservations' },
      { id: 'event-bookings', label: 'Event Bookings' },
      { id: 'amenity-bookings', label: 'Spa & Amenities' },
      { id: 'hotel', label: 'Hotel Management' },
      { id: 'staff', label: 'Staff Management' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'export', label: 'Data Export' },
    ],
  },
  {
    id: 'restaurant',
    label: 'Restaurant & POS',
    emoji: '🍽',
    items: [
      { id: 'menu', label: 'Menu Management' },
      { id: 'kds', label: 'Kitchen Display (KDS)' },
      { id: 'custom', label: 'Custom Requests' },
      { id: 'tables', label: 'Table Management' },
      { id: 'reconciliation', label: 'Reconciliation' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & Supply Chain',
    emoji: '📦',
    items: [
      { id: 'inventory-tracking', label: 'Inventory Tracking' },
      { id: 'stock', label: 'Stock Alerts' },
      { id: 'supply-chain', label: 'Supply Chain' },
      { id: 'vendor-performance', label: 'Vendor Performance' },
      { id: 'driver', label: 'Driver Mode' },
    ],
  },
  {
    id: 'bi',
    label: 'Business Intelligence',
    emoji: '📊',
    items: [
      { id: 'revenue-forecast', label: 'Revenue Forecast' },
      { id: 'demand-heatmap', label: 'Demand Heatmap' },
      { id: 'menu-profitability', label: 'Menu Profitability' },
      { id: 'clv', label: 'Customer CLV' },
      { id: 'competitor', label: 'Competitor Benchmark' },
      { id: 'sustainability', label: 'Sustainability' },
      { id: 'analytics', label: 'Advanced Analytics' },
    ],
  },
  {
    id: 'ai',
    label: 'AI Automation',
    emoji: '🤖',
    items: [
      { id: 'insights', label: 'AI Insights' },
      { id: 'fulfillment', label: 'AI Fulfillment' },
      { id: 'marketing', label: 'AI Marketing' },
      { id: 'feedbackai', label: 'AI Feedback' },
      { id: 'ai-order-agent', label: 'AI Order Agent' },
      { id: 'tables-ai', label: 'AI Table Mgmt' },
      { id: 'inventory', label: 'AI Inventory' },
      { id: 'reorder-agent', label: 'Reorder Agent' },
      { id: 'shift-manager', label: 'AI Shift Manager' },
    ],
  },
  {
    id: 'workforce',
    label: 'Workforce Management',
    emoji: '👥',
    items: [
      { id: 'hr', label: 'HR & Workforce' },
    ],
  },
  {
    id: 'cx',
    label: 'Customer Experience',
    emoji: '❤️',
    items: [
      { id: 'guest-exp', label: 'Guest Experience' },
      { id: 'feedback', label: 'Feedback' },
      { id: 'feedback-insights', label: 'Feedback Insights' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & Marketing',
    emoji: '📈',
    items: [
      { id: 'marketing-crm', label: 'Marketing & CRM' },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    emoji: '🔗',
    items: [
      { id: 'integrations', label: 'Integrations Hub' },
    ],
  },
];

export default function AdminSidebar({ activeTab, setActiveTab }) {
  // Expand the module that contains the active tab by default
  const initialExpanded = MODULES.find(m => m.items.some(i => i.id === activeTab))?.id || 'core';
  const [expanded, setExpanded] = useState(initialExpanded);

  const toggle = (id) => setExpanded(expanded === id ? null : id);

  const handleSelect = (itemId) => {
    // "AI Table Mgmt" maps to the same 'tables' component
    setActiveTab(itemId === 'tables-ai' ? 'tables' : itemId);
  };

  return (
    <nav className="space-y-1">
      {MODULES.map((mod) => {
        const isOpen = expanded === mod.id;
        const hasActive = mod.items.some(i => (i.id === 'tables-ai' ? 'tables' : i.id) === activeTab);
        return (
          <div key={mod.id}>
            <button
              onClick={() => toggle(mod.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-inter text-sm transition-all ${
                hasActive ? 'bg-[#c9a962]/10 text-[#c9a962]' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{mod.emoji}</span>
                <span className="font-medium">{mod.label}</span>
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-3 py-1 space-y-0.5">
                    {mod.items.map((item) => {
                      const itemId = item.id === 'tables-ai' ? 'tables' : item.id;
                      const active = activeTab === itemId;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg font-inter text-sm transition-all ${
                            active
                              ? 'bg-[#c9a962] text-[#0a0a0a] font-medium'
                              : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}