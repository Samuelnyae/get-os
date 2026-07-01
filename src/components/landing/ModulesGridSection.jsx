import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Calendar, BedDouble, PartyPopper, CreditCard, BarChart3, Package, Truck, Users, Heart, Brain, Megaphone, LineChart, PackageSearch, MessageSquare, Clock, MapPin, Wallet } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader';

const MODULE_GROUPS = [
  {
    category: 'Operations',
    icon: ShoppingCart,
    color: 'text-blue-400',
    modules: [
      { name: 'POS', icon: ShoppingCart },
      { name: 'Orders', icon: Wallet },
      { name: 'Reservations', icon: Calendar },
      { name: 'Hotel Management', icon: BedDouble },
      { name: 'Event Bookings', icon: PartyPopper },
    ],
  },
  {
    category: 'Finance',
    icon: CreditCard,
    color: 'text-green-400',
    modules: [
      { name: 'Payments', icon: CreditCard },
      { name: 'Revenue Forecast', icon: LineChart },
      { name: 'Profitability', icon: BarChart3 },
      { name: 'Reconciliation', icon: Wallet },
    ],
  },
  {
    category: 'Inventory',
    icon: Package,
    color: 'text-orange-400',
    modules: [
      { name: 'Stock Tracking', icon: Package },
      { name: 'Vendor Management', icon: Users },
      { name: 'Supply Chain', icon: Truck },
      { name: 'AI Inventory', icon: PackageSearch },
    ],
  },
  {
    category: 'Customer Experience',
    icon: Heart,
    color: 'text-pink-400',
    modules: [
      { name: 'CRM', icon: Users },
      { name: 'Loyalty', icon: Heart },
      { name: 'Feedback', icon: MessageSquare },
      { name: 'Guest Experience', icon: Heart },
    ],
  },
  {
    category: 'Workforce',
    icon: Clock,
    color: 'text-purple-400',
    modules: [
      { name: 'HR', icon: Users },
      { name: 'Scheduling', icon: Calendar },
      { name: 'Payroll Support', icon: Wallet },
      { name: 'AI Shift Manager', icon: Clock },
    ],
  },
  {
    category: 'AI Suite',
    icon: Brain,
    color: 'text-[#c9a962]',
    modules: [
      { name: 'AI Marketing', icon: Megaphone },
      { name: 'AI Insights', icon: Brain },
      { name: 'AI Forecasting', icon: LineChart },
      { name: 'AI Feedback', icon: MessageSquare },
    ],
  },
];

export default function ModulesGridSection() {
  return (
    <section className="py-24 bg-[#0c0c0c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Everything" highlight="You Need" subtitle="A complete ecosystem of integrated modules — every part of your business, working together." />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
          {MODULE_GROUPS.map((group, gi) => (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.1 }}
              className="rounded-2xl luxury-border bg-[#111] p-6"
            >
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <group.icon className={`w-5 h-5 ${group.color}`} />
                </div>
                <h3 className="font-playfair text-lg text-white">{group.category}</h3>
              </div>
              <div className="space-y-2">
                {group.modules.map((mod) => (
                  <div key={mod.name} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                    <mod.icon className="w-4 h-4 text-white/30" />
                    <span className="font-inter text-sm text-white/60">{mod.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}