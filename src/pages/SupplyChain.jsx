import React, { useState } from 'react';
import { Truck, Users, FileText, PackageCheck, Receipt, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SupplierDirectory = React.lazy(() => import('@/components/supply-chain/SupplierDirectory'));
const PurchaseOrders = React.lazy(() => import('@/components/supply-chain/PurchaseOrders'));
const GoodsReceived = React.lazy(() => import('@/components/supply-chain/GoodsReceived'));
const InvoiceMatching = React.lazy(() => import('@/components/supply-chain/InvoiceMatching'));
const WasteTracker = React.lazy(() => import('@/components/supply-chain/WasteTracker'));

const TABS = [
  { id: 'suppliers', label: 'Supplier Directory', icon: Users },
  { id: 'pos', label: 'Purchase Orders', icon: FileText },
  { id: 'grn', label: 'Goods Received', icon: PackageCheck },
  { id: 'invoices', label: 'Invoice Matching', icon: Receipt },
  { id: 'waste', label: 'Waste Tracking', icon: Trash2 },
];

export default function SupplyChain() {
  const [activeTab, setActiveTab] = useState('suppliers');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
          <Truck className="w-5 h-5 text-[#c9a962]" />
        </div>
        <div>
          <h2 className="font-playfair text-2xl text-white">Supply Chain Management</h2>
          <p className="font-inter text-sm text-white/50">Suppliers, procurement, GRNs, invoices & waste</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap border-b border-[#c9a962]/10 pb-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-inter text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-[#c9a962] text-[#0a0a0a] font-semibold'
                : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10 hover:border-[#c9a962]/30'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <React.Suspense fallback={
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
          </div>
        }>
          {activeTab === 'suppliers' && <SupplierDirectory />}
          {activeTab === 'pos' && <PurchaseOrders />}
          {activeTab === 'grn' && <GoodsReceived />}
          {activeTab === 'invoices' && <InvoiceMatching />}
          {activeTab === 'waste' && <WasteTracker />}
        </React.Suspense>
      </motion.div>
    </div>
  );
}