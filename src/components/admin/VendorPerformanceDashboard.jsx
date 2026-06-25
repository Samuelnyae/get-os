import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Star, Package, Truck, Award, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import { formatKSh } from '@/lib/marketplace';

const CHART_COLORS = ['#c9a962', '#e4d5a7', '#8b6f3a', '#d4af37', '#b8944f', '#a07f3a', '#7a5f2a', '#5a4520'];

const STATUS_COLORS = {
  active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  suspended: 'text-red-400 bg-red-500/10 border-red-500/20',
  archived: 'text-white/40 bg-white/5 border-white/10',
};

export default function VendorPerformanceDashboard() {
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list('-created_date', 200),
  });
  const { data: products = [] } = useQuery({
    queryKey: ['supplier_products_all'],
    queryFn: () => base44.entities.SupplierProduct.list('-created_date', 500),
  });
  const { data: pos = [] } = useQuery({
    queryKey: ['purchase_orders_all'],
    queryFn: () => base44.entities.PurchaseOrder.list('-created_date', 500),
  });
  const { data: mktOrders = [] } = useQuery({
    queryKey: ['procurement_orders_all'],
    queryFn: () => base44.entities.MarketplaceProcurementOrder.list('-created_date', 500),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ['supplier_reviews_all'],
    queryFn: () => base44.entities.SupplierReview.filter({ status: 'published' }, '-created_date', 500),
  });

  // Per-supplier sales from POs + marketplace orders
  const supplierData = useMemo(() => {
    return suppliers.map(s => {
      const sProducts = products.filter(p => p.supplier_id === s.id);
      const sPOs = pos.filter(po => po.supplier_id === s.id);
      const poRevenue = sPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0);

      // Marketplace order revenue for this supplier
      let mktRevenue = 0;
      const productSales = {}; // product_name -> qty
      mktOrders.forEach(o => {
        (o.items || []).forEach(it => {
          if (it.supplier_id === s.id) {
            mktRevenue += it.line_total || 0;
            productSales[it.product_name] = (productSales[it.product_name] || 0) + (it.quantity || 0);
          }
        });
      });
      // Also count PO item quantities
      sPOs.forEach(po => {
        (po.items || []).forEach(it => {
          productSales[it.item_name] = (productSales[it.item_name] || 0) + (it.quantity || 0);
        });
      });

      const sReviews = reviews.filter(r => r.supplier_id === s.id);
      const avgRating = sReviews.length > 0
        ? sReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / sReviews.length
        : (s.rating || 0);

      const totalSales = poRevenue + mktRevenue;
      const topProducts = Object.entries(productSales)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty);

      return {
        ...s,
        productCount: sProducts.length,
        poCount: sPOs.length,
        reviewCount: sReviews.length,
        avgRating: avgRating.toFixed(1),
        totalSales,
        poRevenue,
        mktRevenue,
        topProducts,
        lowStockCount: sProducts.filter(p => (p.stock_available || 0) <= (p.min_order_qty || 0) && p.status !== 'discontinued').length,
      };
    });
  }, [suppliers, products, pos, mktOrders, reviews]);

  // Chart data: total sales per supplier
  const salesChartData = useMemo(() =>
    supplierData
      .filter(s => s.totalSales > 0)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10)
      .map(s => ({ name: s.company_name.length > 15 ? s.company_name.slice(0, 13) + '…' : s.company_name, sales: s.totalSales })),
    [supplierData]
  );

  const totalSalesAll = supplierData.reduce((s, v) => s + v.totalSales, 0);
  const avgRatingAll = supplierData.length ? (supplierData.reduce((s, v) => s + Number(v.avgRating), 0) / supplierData.length).toFixed(1) : '0.0';
  const topVendor = [...supplierData].sort((a, b) => b.totalSales - a.totalSales)[0];

  // Selected supplier detail
  const detail = selectedSupplier ? supplierData.find(s => s.id === selectedSupplier) : null;
  const productPieData = detail ? detail.topProducts.slice(0, 6) : [];
  const otherQty = detail ? detail.topProducts.slice(6).reduce((s, p) => s + p.qty, 0) : 0;
  const pieData = productPieData.map(p => ({ name: p.name, value: p.qty }));
  if (otherQty > 0) pieData.push({ name: 'Other', value: otherQty });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-playfair text-2xl text-white mb-1">Vendor Performance Dashboard</h2>
        <p className="font-inter text-sm text-white/50">Total sales, product popularity & ratings per supplier</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Vendors', value: suppliers.length, icon: Truck, color: 'text-[#c9a962]' },
          { label: 'Total Sales', value: formatKSh(totalSalesAll), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Avg Rating', value: `${avgRatingAll} ★`, icon: Star, color: 'text-[#c9a962]' },
          { label: 'Top Vendor', value: topVendor ? topVendor.company_name.split(' ')[0] : '—', icon: Award, color: 'text-blue-400' },
        ].map((s, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="font-playfair text-xl text-white truncate">{s.value}</p>
            <p className="font-inter text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Total Sales bar chart */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-2xl p-6">
        <h3 className="font-inter text-sm text-white/70 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#c9a962]" /> Total Sales by Vendor (Top 10)</h3>
        {salesChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesChartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fill: '#ffffff60', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#ffffff60', fontSize: 11 }} tickFormatter={v => formatKSh(v).replace('KES ', 'K')} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #c9a96240', borderRadius: 12, color: '#fff' }}
                formatter={v => [formatKSh(v), 'Sales']}
              />
              <Bar dataKey="sales" fill="#c9a962" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-white/30 py-12 font-inter text-sm">No sales recorded yet</p>
        )}
      </div>

      {/* Vendor table with selector */}
      <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-2xl p-6">
        <h3 className="font-inter text-sm text-white/70 mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-[#c9a962]" /> Vendor Overview — click to view product popularity</h3>
        <div className="space-y-2">
          {supplierData.sort((a, b) => b.totalSales - a.totalSales).map((v, idx) => (
            <div key={v.id} onClick={() => setSelectedSupplier(v.id)}
              className={`flex items-center justify-between gap-4 p-3 rounded-xl cursor-pointer transition-all ${selectedSupplier === v.id ? 'bg-[#c9a962]/10 border border-[#c9a962]/30' : 'bg-[#0a0a0a] border border-white/5 hover:border-[#c9a962]/20'}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="font-playfair text-sm text-white/40 w-6">{idx + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-[#c9a962]/10 flex items-center justify-center shrink-0">
                  <span className="font-playfair text-sm text-[#c9a962]">{(v.company_name || '?')[0]}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-inter text-sm text-white truncate">{v.company_name}</p>
                  <p className="font-inter text-xs text-white/40">{v.productCount} products · {v.poCount} POs</p>
                </div>
              </div>
              <div className="flex items-center gap-5 flex-wrap">
                <div className="text-right">
                  <p className="font-playfair text-sm text-white">{formatKSh(v.totalSales)}</p>
                  <p className="font-inter text-[9px] text-white/40 uppercase">Sales</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="w-3 h-3 text-[#c9a962] fill-[#c9a962]" />
                    <p className="font-playfair text-sm text-white">{v.avgRating}</p>
                  </div>
                  <p className="font-inter text-[9px] text-white/40 uppercase">{v.reviewCount} reviews</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[v.status] || STATUS_COLORS.archived}`}>{v.status}</span>
                {v.lowStockCount > 0 && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                <ChevronRight className="w-4 h-4 text-white/30" />
              </div>
            </div>
          ))}
          {supplierData.length === 0 && <p className="text-center text-white/30 py-8 font-inter text-sm">No vendors yet</p>}
        </div>
      </div>

      {/* Product popularity chart for selected supplier */}
      {detail && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-inter text-sm text-white/70 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#c9a962]" /> Product Popularity — {detail.company_name}
            </h3>
            <div className="text-right">
              <p className="font-playfair text-lg text-white">{formatKSh(detail.totalSales)}</p>
              <p className="font-inter text-[10px] text-white/40 uppercase">Total Sales</p>
            </div>
          </div>

          {pieData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50}
                    label={{ fill: '#ffffff80', fontSize: 10 }}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #c9a96240', borderRadius: 12, color: '#fff' }} formatter={v => [`${v} units`, 'Qty']} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#ffffff80' }} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2">
                <p className="font-inter text-xs text-white/40 mb-2">Top products by units sold</p>
                {detail.topProducts.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#0a0a0a] border border-white/5 rounded-lg p-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="font-inter text-xs text-white truncate">{p.name}</span>
                    </div>
                    <span className="font-inter text-xs text-[#c9a962] font-medium">{p.qty} units</span>
                  </div>
                ))}
                {detail.topProducts.length === 0 && <p className="font-inter text-xs text-white/30">No product sales recorded</p>}
              </div>
            </div>
          ) : (
            <p className="text-center text-white/30 py-8 font-inter text-sm">No product sales data for this vendor yet</p>
          )}
        </motion.div>
      )}
    </div>
  );
}