import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Users, Calendar, Package, ShoppingBag, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SectionHeader from '@/components/common/SectionHeader';

const COLORS = ['#c9a962', '#e4d5a7', '#f5f0e8', '#8b7355', '#d4af37', '#ffd700'];

export default function AdvancedAnalytics() {
  const { data: orders = [] } = useQuery({
    queryKey: ['analytics-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['analytics-menu'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['analytics-reservations'],
    queryFn: () => base44.entities.Reservation.list('-created_date', 1000),
  });

  const analytics = useMemo(() => {
    // Sales Trends (Last 30 Days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const salesByDay = last30Days.map(date => {
      const dayOrders = orders.filter(o => 
        o.created_date?.startsWith(date) && 
        ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(o.status)
      );
      const revenue = dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const count = dayOrders.length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.round(revenue),
        orders: count,
        avgOrder: count > 0 ? Math.round(revenue / count) : 0
      };
    });

    // Popular Menu Items
    const itemSales = {};
    orders.forEach(order => {
      if (['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status)) {
        order.items?.forEach(item => {
          if (!itemSales[item.name]) {
            itemSales[item.name] = { quantity: 0, revenue: 0 };
          }
          itemSales[item.name].quantity += item.quantity || 1;
          itemSales[item.name].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    const popularItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Category Distribution
    const categoryStats = {};
    menuItems.forEach(item => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { count: 0, revenue: 0 };
      }
      categoryStats[item.category].count++;
    });

    orders.forEach(order => {
      if (['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status)) {
        order.items?.forEach(item => {
          const menuItem = menuItems.find(m => m.id === item.menu_item_id);
          if (menuItem?.category) {
            categoryStats[menuItem.category].revenue += (item.price || 0) * (item.quantity || 1);
          }
        });
      }
    });

    const categoryData = Object.entries(categoryStats).map(([name, data]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: data.revenue || data.count,
      items: data.count
    }));

    // Customer Demographics
    const customerStats = {
      newCustomers: 0,
      returningCustomers: 0,
      totalOrders: orders.length
    };

    const emailFrequency = {};
    orders.forEach(order => {
      const email = order.customer_email;
      if (email) {
        emailFrequency[email] = (emailFrequency[email] || 0) + 1;
      }
    });

    Object.values(emailFrequency).forEach(count => {
      if (count === 1) customerStats.newCustomers++;
      else customerStats.returningCustomers++;
    });

    const customerSegments = [
      { name: 'New Customers', value: customerStats.newCustomers },
      { name: 'Returning Customers', value: customerStats.returningCustomers }
    ];

    // Reservation Patterns
    const reservationsByDay = {};
    const reservationsByTime = {};
    const reservationsBySize = {};

    reservations.forEach(res => {
      if (res.status !== 'cancelled') {
        // By day of week
        const date = new Date(res.reservation_date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        reservationsByDay[dayName] = (reservationsByDay[dayName] || 0) + 1;

        // By time slot
        const hour = res.reservation_time?.split(':')[0];
        if (hour) {
          reservationsByTime[hour] = (reservationsByTime[hour] || 0) + 1;
        }

        // By party size
        const size = res.party_size || 0;
        const sizeGroup = size <= 2 ? '1-2' : size <= 4 ? '3-4' : size <= 6 ? '5-6' : '7+';
        reservationsBySize[sizeGroup] = (reservationsBySize[sizeGroup] || 0) + 1;
      }
    });

    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const reservationDayData = dayOrder.map(day => ({
      day,
      count: reservationsByDay[day] || 0
    }));

    const reservationTimeData = Object.entries(reservationsByTime)
      .map(([hour, count]) => ({
        time: `${hour}:00`,
        count
      }))
      .sort((a, b) => parseInt(a.time) - parseInt(b.time));

    const reservationSizeData = ['1-2', '3-4', '5-6', '7+'].map(size => ({
      size,
      count: reservationsBySize[size] || 0
    }));

    // Inventory Turnover
    const inventoryData = menuItems
      .filter(item => item.stock_count !== undefined)
      .map(item => {
        const sold = itemSales[item.name]?.quantity || 0;
        const turnover = item.stock_count > 0 ? (sold / (item.stock_count + sold)) * 100 : 0;
        return {
          name: item.name,
          stock: item.stock_count,
          sold,
          turnover: Math.round(turnover)
        };
      })
      .sort((a, b) => b.turnover - a.turnover)
      .slice(0, 10);

    // Summary Stats
    const totalRevenue = orders
      .filter(o => ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const completionRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;

    return {
      salesByDay,
      popularItems,
      categoryData,
      customerSegments,
      reservationDayData,
      reservationTimeData,
      reservationSizeData,
      inventoryData,
      summary: {
        totalRevenue: Math.round(totalRevenue),
        totalOrders: orders.length,
        avgOrderValue: Math.round(avgOrderValue),
        completionRate: Math.round(completionRate),
        totalReservations: reservations.length,
        totalMenuItems: menuItems.length
      }
    };
  }, [orders, menuItems, reservations]);

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Advanced Analytics" 
        subtitle="Business Intelligence"
        align="left"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#1a1a1a] border-[#c9a962]/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-[#c9a962]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">KES {analytics.summary.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-white/50 mt-1">From {analytics.summary.totalOrders} orders</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#c9a962]/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Avg Order Value</CardTitle>
            <ShoppingBag className="w-4 h-4 text-[#c9a962]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">KES {analytics.summary.avgOrderValue.toLocaleString()}</div>
            <p className="text-xs text-white/50 mt-1">Per transaction</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#c9a962]/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Completion Rate</CardTitle>
            <Award className="w-4 h-4 text-[#c9a962]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.summary.completionRate}%</div>
            <p className="text-xs text-white/50 mt-1">Orders delivered</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#c9a962]/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Reservations</CardTitle>
            <Calendar className="w-4 h-4 text-[#c9a962]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.summary.totalReservations}</div>
            <p className="text-xs text-white/50 mt-1">Total bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trends */}
      <Card className="bg-[#1a1a1a] border-[#c9a962]/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#c9a962]" />
            Sales Trends (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.salesByDay}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a962" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#c9a962" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #c9a962' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#c9a962" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Menu Items */}
        <Card className="bg-[#1a1a1a] border-[#c9a962]/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#c9a962]" />
              Top 10 Popular Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.popularItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#999" />
                <YAxis dataKey="name" type="category" width={100} stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #c9a962' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="quantity" fill="#c9a962" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="bg-[#1a1a1a] border-[#c9a962]/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-[#c9a962]" />
              Category Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #c9a962' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <Card className="bg-[#1a1a1a] border-[#c9a962]/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#c9a962]" />
              Customer Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.customerSegments}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, value}) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.customerSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #c9a962' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reservation Patterns by Day */}
        <Card className="bg-[#1a1a1a] border-[#c9a962]/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#c9a962]" />
              Reservations by Day of Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.reservationDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #c9a962' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#e4d5a7" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reservation Time Patterns */}
        <Card className="bg-[#1a1a1a] border-[#c9a962]/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#c9a962]" />
              Peak Reservation Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.reservationTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #c9a962' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="count" stroke="#c9a962" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reservation Party Size */}
        <Card className="bg-[#1a1a1a] border-[#c9a962]/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#c9a962]" />
              Reservation Party Size Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.reservationSizeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="size" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #c9a962' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#d4af37" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Turnover */}
      <Card className="bg-[#1a1a1a] border-[#c9a962]/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-[#c9a962]" />
            Top 10 Inventory Turnover
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.inventoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#999" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #c9a962' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="sold" fill="#c9a962" name="Units Sold" />
              <Bar dataKey="stock" fill="#8b7355" name="Current Stock" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}