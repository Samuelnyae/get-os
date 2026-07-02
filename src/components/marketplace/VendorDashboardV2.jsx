import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Store, LogOut, DollarSign, ShoppingBag, Users, Package, ArrowRight } from 'lucide-react';
import { formatKSh } from '@/lib/marketplace';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
  { id: 'forecast', label: 'AI Forecast' },
];

export default function VendorDashboard({ supplier, onViewMarketplace, onLogout, orders = [] }) {
  const [tab, setTab] = useState('overview');

  const { data: products = [] } = useQuery({
    queryKey: ['vendor_products', supplier.id],
    queryFn: () => base44.entities.SupplierProduct.filter({ supplier_id: supplier.id }, '-created_date', 200),
  });

  const myOrders = orders.filter(o => o.items?.some(i => i.supplier_id === supplier.id));
  const confirmedOrders = myOrders.filter(o => o.status === 'confirmed' || o.status === 'delivered');
  const revenue = confirmedOrders.reduce((s, o) => {
    const myItems = (o.items || []).filter(i => i.supplier_id === supplier.id);
    return s + myItems.reduce((ss, i) => ss + (i.line_total || 0), 0);
  }, 0);
  const customers = new Set(myOrders.map(o => o.buyer_email)).size;
  const pendingOrders = myOrders.filter(o => o.status === 'pending').length;

  const metrics = [
    { label: 'Total Revenue', value: formatKSh(revenue), caption: 'All confirmed orders', icon: DollarSign },
    { label: 'Total Orders', value: myOrders.length, caption: `${pendingOrders} pending`, icon: ShoppingBag },
    { label: 'Customers', value: customers, caption: 'Unique buyers', icon: Users },
    { label: 'Products Listed', value: products.length, caption: 'In your catalogue', icon: Package },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#c5a059]/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-[#c5a059]" />
          </div>
          <div>
            <h2 className="font-playfair text-white text-lg">{supplier.company_name}</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full capitalize">{supplier.status}</span>
              <span className="text-white/40 capitalize">{supplier.category}</span>
              <span className="text-white/30">·</span>
              <span className="text-white/40">{supplier.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onViewMarketplace} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:opacity-90">
            View Marketplace
          </button>
          <button onClick={onLogout} className="text-white/40 hover:text-white text-sm">Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium relative ${
              tab === t.id ? 'text-[#c5a059]' : 'text-white/40 hover:text-white/70'
            }`}>
            {t.label.replace('Orders', `Orders (${myOrders.length})`).replace('Customers', `Customers (${customers})`)}
            {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c5a059]" />}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metrics.map(m => (
              <div key={m.label} className="bg-[#171717] rounded-xl border border-white/5 p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-white/40 text-xs">{m.label}</span>
                  <m.icon className="w-4 h-4 text-[#c5a059]" />
                </div>
                <p className="text-white text-2xl font-playfair mb-1">{m.value}</p>
                <p className="text-white/30 text-xs">{m.caption}</p>
              </div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="bg-[#171717] rounded-xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Recent Orders</h3>
              <button onClick={() => setTab('orders')} className="text-[#c5a059] text-xs flex items-center gap-1 hover:opacity-80">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {myOrders.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {myOrders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-white text-sm">{o.buyer_name}</p>
                      <p className="text-white/30 text-xs">{o.items?.length || 0} item(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#c5a059] text-sm">{formatKSh(o.total_amount)}</p>
                      <p className="text-white/30 text-xs capitalize">{o.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'orders' && (
        <div className="bg-[#171717] rounded-xl border border-white/5 p-5">
          {myOrders.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-12">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {myOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm">{o.buyer_name} · {o.buyer_email}</p>
                    <p className="text-white/30 text-xs">{o.items?.length || 0} item(s) · {new Date(o.created_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#c5a059] text-sm">{formatKSh(o.total_amount)}</p>
                    <p className="text-white/30 text-xs capitalize">{o.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'customers' && (
        <div className="bg-[#171717] rounded-xl border border-white/5 p-5">
          {customers === 0 ? (
            <p className="text-white/30 text-sm text-center py-12">No customers yet</p>
          ) : (
            <div className="space-y-3">
              {[...new Set(myOrders.map(o => o.buyer_email))].map(email => {
                const custOrders = myOrders.filter(o => o.buyer_email === email);
                const total = custOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
                return (
                  <div key={email} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-white text-sm">{custOrders[0]?.buyer_name}</p>
                      <p className="text-white/30 text-xs">{email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#c5a059] text-sm">{formatKSh(total)}</p>
                      <p className="text-white/30 text-xs">{custOrders.length} order(s)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'forecast' && (
        <div className="bg-[#171717] rounded-xl border border-white/5 p-12 text-center">
          <Package className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">AI forecasting will be available once you have order history.</p>
        </div>
      )}
    </div>
  );
}