import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, FileText, ShoppingCart, Calendar, MessageSquare, Sparkles, Utensils, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import LuxuryButton from '../common/LuxuryButton';

function toCSV(rows, columns) {
  if (!rows.length) return '';
  const header = columns.map(c => `"${c.label}"`).join(',');
  const body = rows.map(row =>
    columns.map(c => {
      const val = c.accessor(row);
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );
  return [header, ...body].join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const EXPORT_CONFIGS = [
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    color: 'text-blue-400',
    description: 'All customer orders with status, totals, and items',
    queryKey: ['export-orders'],
    fetcher: () => base44.entities.Order.list('-created_date', 500),
    columns: [
      { label: 'Order Reference', accessor: r => r.order_reference },
      { label: 'Customer Name', accessor: r => r.customer_name },
      { label: 'Customer Email', accessor: r => r.customer_email },
      { label: 'Customer Phone', accessor: r => r.customer_phone },
      { label: 'Order Type', accessor: r => r.order_type },
      { label: 'Status', accessor: r => r.status },
      { label: 'Payment Status', accessor: r => r.payment_status },
      { label: 'Total (KES)', accessor: r => r.total_amount },
      { label: 'Items', accessor: r => (r.items || []).map(i => `${i.name} x${i.quantity}`).join('; ') },
      { label: 'Table/Room', accessor: r => r.table_room_number },
      { label: 'Delivery Address', accessor: r => r.delivery_address },
      { label: 'Pickup Time', accessor: r => r.pickup_time },
      { label: 'Special Instructions', accessor: r => r.special_instructions },
      { label: 'Assigned Staff', accessor: r => r.assigned_staff_name },
      { label: 'Date', accessor: r => r.created_date ? format(new Date(r.created_date), 'yyyy-MM-dd HH:mm') : '' },
    ],
  },
  {
    id: 'reservations',
    label: 'Reservations',
    icon: Calendar,
    color: 'text-green-400',
    description: 'All table reservations with guest and date details',
    queryKey: ['export-reservations'],
    fetcher: () => base44.entities.Reservation.list('-created_date', 500),
    columns: [
      { label: 'Confirmation Code', accessor: r => r.confirmation_code },
      { label: 'Customer Name', accessor: r => r.customer_name },
      { label: 'Email', accessor: r => r.customer_email },
      { label: 'Phone', accessor: r => r.customer_phone },
      { label: 'Reservation Date', accessor: r => r.reservation_date },
      { label: 'Time', accessor: r => r.reservation_time },
      { label: 'Party Size', accessor: r => r.party_size },
      { label: 'Table', accessor: r => r.table_number },
      { label: 'Status', accessor: r => r.status },
      { label: 'Special Requests', accessor: r => r.special_requests },
      { label: 'Notes', accessor: r => r.notes },
      { label: 'Submitted', accessor: r => r.created_date ? format(new Date(r.created_date), 'yyyy-MM-dd HH:mm') : '' },
    ],
  },
  {
    id: 'menu',
    label: 'Menu Items',
    icon: Utensils,
    color: 'text-[#c9a962]',
    description: 'Full menu catalogue with prices and stock levels',
    queryKey: ['export-menu'],
    fetcher: () => base44.entities.MenuItem.list(),
    columns: [
      { label: 'Name', accessor: r => r.name },
      { label: 'Category', accessor: r => r.category },
      { label: 'Price (KES)', accessor: r => r.price },
      { label: 'Description', accessor: r => r.description },
      { label: 'Stock', accessor: r => r.stock_count },
      { label: 'Low Stock Threshold', accessor: r => r.low_stock_threshold },
      { label: 'Likes', accessor: r => r.likes_count },
      { label: 'Featured', accessor: r => r.is_featured ? 'Yes' : 'No' },
      { label: 'Dietary Tags', accessor: r => (r.dietary_tags || []).join(', ') },
      { label: 'Ingredients', accessor: r => (r.ingredients || []).join(', ') },
    ],
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: MessageSquare,
    color: 'text-pink-400',
    description: 'Customer ratings and comments on menu items',
    queryKey: ['export-feedback'],
    fetcher: () => base44.entities.Comment.list('-created_date', 500),
    columns: [
      { label: 'User Name', accessor: r => r.user_name },
      { label: 'Rating', accessor: r => r.rating },
      { label: 'Comment', accessor: r => r.content },
      { label: 'Menu Item ID', accessor: r => r.menu_item_id },
      { label: 'Date', accessor: r => r.created_date ? format(new Date(r.created_date), 'yyyy-MM-dd HH:mm') : '' },
    ],
  },
  {
    id: 'custom',
    label: 'Custom Requests',
    icon: Sparkles,
    color: 'text-purple-400',
    description: 'Customer custom food requests and their statuses',
    queryKey: ['export-custom'],
    fetcher: () => base44.entities.CustomFoodRequest.list('-created_date', 500),
    columns: [
      { label: 'Customer Name', accessor: r => r.customer_name },
      { label: 'Email', accessor: r => r.customer_email },
      { label: 'Phone', accessor: r => r.customer_phone },
      { label: 'Dish Name', accessor: r => r.preferred_dish_name },
      { label: 'Category', accessor: r => r.food_category },
      { label: 'Spice Level', accessor: r => r.spice_level },
      { label: 'Cooking Style', accessor: r => r.cooking_style },
      { label: 'Portion', accessor: r => r.portion_size },
      { label: 'Budget', accessor: r => r.budget_range },
      { label: 'Status', accessor: r => r.status },
      { label: 'Proposed Price', accessor: r => r.proposed_price },
      { label: 'Special Instructions', accessor: r => r.special_instructions },
      { label: 'Submitted', accessor: r => r.created_date ? format(new Date(r.created_date), 'yyyy-MM-dd HH:mm') : '' },
    ],
  },
];

function ExportCard({ config }) {
  const [isExporting, setIsExporting] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: config.queryKey,
    queryFn: config.fetcher,
    staleTime: 2 * 60 * 1000,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csv = toCSV(data, config.columns);
      const filename = `${config.id}_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      downloadCSV(csv, filename);
    } finally {
      setIsExporting(false);
    }
  };

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10 flex flex-col gap-4"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#c9a962]/10 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-playfair text-lg text-white">{config.label}</h3>
          <p className="font-inter text-xs text-white/50 mt-1">{config.description}</p>
          <p className="font-inter text-xs text-[#c9a962] mt-2">
            {isLoading ? 'Loading...' : `${data.length} records available`}
          </p>
        </div>
      </div>

      <LuxuryButton
        onClick={handleExport}
        disabled={isLoading || isExporting || data.length === 0}
        size="sm"
        className="w-full"
      >
        {isExporting ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
        ) : (
          <><Download className="w-4 h-4 mr-2" /> Export CSV</>
        )}
      </LuxuryButton>
    </motion.div>
  );
}

export default function DataExport() {
  const handleExportAll = async () => {
    for (const config of EXPORT_CONFIGS) {
      const data = await config.fetcher();
      if (data.length > 0) {
        const csv = toCSV(data, config.columns);
        const filename = `${config.id}_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        downloadCSV(csv, filename);
        await new Promise(r => setTimeout(r, 300)); // slight delay between downloads
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-playfair text-2xl text-white mb-1">Data Export</h2>
          <p className="font-inter text-sm text-white/50">
            Download your data as CSV files for backups, migrations, or analysis.
          </p>
        </div>
        <LuxuryButton onClick={handleExportAll}>
          <FileText className="w-4 h-4 mr-2" />
          Export All
        </LuxuryButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {EXPORT_CONFIGS.map(config => (
          <ExportCard key={config.id} config={config} />
        ))}
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#c9a962]/10">
        <p className="font-inter text-xs text-white/40 leading-relaxed">
          <span className="text-[#c9a962]">Note:</span> Exports are limited to the 500 most recent records per dataset. 
          CSV files are safe to import into Excel, Google Sheets, or any database tool. 
          No sensitive payment data is included beyond status labels.
        </p>
      </div>
    </div>
  );
}