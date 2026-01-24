import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Bot, AlertTriangle, CheckCircle, Clock, Users, 
  TrendingUp, Activity, Loader2, Zap, BarChart3
} from 'lucide-react';
import LuxuryButton from '../common/LuxuryButton';
import { toast } from 'sonner';
import { useNotifications } from '@/components/notifications/NotificationManager';

export default function AIOrderFulfillment() {
  const [isAutoAssignEnabled, setIsAutoAssignEnabled] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dailySummary, setDailySummary] = useState(null);
  const [flaggedOrders, setFlaggedOrders] = useState([]);

  const queryClient = useQueryClient();
  const { sendNotification } = useNotifications();

  const { data: orders = [] } = useQuery({
    queryKey: ['fulfillment-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['fulfillment-staff'],
    queryFn: () => base44.entities.Staff.list(),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['fulfillment-menu'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fulfillment-orders']);
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Staff.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fulfillment-staff']);
    },
  });

  // AI Auto-Assignment System
  const autoAssignOrder = async (order) => {
    if (!isAutoAssignEnabled) return;

    try {
      const availableStaff = staff.filter(s => 
        (s.role === 'chef' || s.role === 'kitchen_assistant') && 
        s.status === 'available'
      );

      if (availableStaff.length === 0) {
        setFlaggedOrders(prev => [...prev, {
          order_id: order.id,
          issue: 'No staff available',
          timestamp: new Date().toISOString()
        }]);
        return;
      }

      // Calculate order complexity using AI
      const prompt = `Analyze this food order and determine its complexity level and estimated preparation time.

Order items: ${order.items?.map(item => `${item.name} (qty: ${item.quantity})`).join(', ')}

Provide:
1. Complexity score (1-10, where 10 is most complex)
2. Estimated prep time in minutes
3. Required skill level (beginner/intermediate/expert)
4. Any potential issues or special requirements

Consider factors like cooking techniques, ingredient prep, plating complexity, and timing coordination.`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            complexity_score: { type: "number" },
            prep_time_minutes: { type: "number" },
            skill_level: { type: "string" },
            issues: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Check for issues
      if (analysis.issues?.length > 0) {
        setFlaggedOrders(prev => [...prev, {
          order_id: order.id,
          order_reference: order.order_reference,
          issues: analysis.issues,
          complexity: analysis.complexity_score,
          timestamp: new Date().toISOString()
        }]);
      }

      // Assign to staff with lowest current load
      const staffWithLoad = availableStaff.map(s => ({
        ...s,
        current_load: s.current_orders?.length || 0
      })).sort((a, b) => a.current_load - b.current_load);

      const assignedStaff = staffWithLoad[0];

      // Calculate estimated completion time
      const estimatedCompletion = new Date(Date.now() + analysis.prep_time_minutes * 60000);

      // Update order
      await updateOrderMutation.mutateAsync({
        id: order.id,
        data: {
          ...order,
          assigned_staff_id: assignedStaff.id,
          assigned_staff_name: assignedStaff.name,
          estimated_completion: estimatedCompletion.toISOString(),
          status: 'confirmed',
          status_history: [
            ...(order.status_history || []),
            {
              status: 'confirmed',
              timestamp: new Date().toISOString(),
              note: `Auto-assigned to ${assignedStaff.name} by AI (Complexity: ${analysis.complexity_score}/10)`
            }
          ]
        }
      });

      // Update staff
      await updateStaffMutation.mutateAsync({
        id: assignedStaff.id,
        data: {
          ...assignedStaff,
          current_orders: [...(assignedStaff.current_orders || []), order.id],
          status: 'busy'
        }
      });

      // Send notification to customer
      sendNotification('Order Confirmed', {
        body: `Your order #${order.order_reference} is being prepared by ${assignedStaff.name}. Estimated completion: ${analysis.prep_time_minutes} minutes.`,
        tag: `order-${order.id}`,
      });

      toast.success(`Order #${order.order_reference} assigned to ${assignedStaff.name}`);
    } catch (error) {
      toast.error('Failed to auto-assign order: ' + error.message);
      setFlaggedOrders(prev => [...prev, {
        order_id: order.id,
        issue: 'Auto-assignment failed: ' + error.message,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  // Monitor new pending orders
  useEffect(() => {
    const pendingOrders = orders.filter(o => 
      o.status === 'pending' && !o.assigned_staff_id
    );

    if (isAutoAssignEnabled && pendingOrders.length > 0) {
      pendingOrders.forEach(order => {
        autoAssignOrder(order);
      });
    }
  }, [orders.length, isAutoAssignEnabled]);

  // Real-time status updates
  useEffect(() => {
    const unsubscribe = base44.entities.Order.subscribe((event) => {
      if (event.type === 'update' && event.data.customer_email) {
        const statusMessages = {
          confirmed: 'Your order has been confirmed and is being prepared',
          preparing: 'Your order is now being prepared by our chef',
          ready: 'Your order is ready!',
          out_for_delivery: 'Your order is out for delivery',
          delivered: 'Your order has been delivered. Enjoy!'
        };

        const message = statusMessages[event.data.status];
        if (message) {
          sendNotification(`Order #${event.data.order_reference}`, {
            body: message,
            tag: `order-status-${event.data.id}`,
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Generate daily summary
  const generateDailySummary = async () => {
    setIsAnalyzing(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(o => 
        new Date(o.created_date) >= today
      );

      // Calculate hourly distribution
      const hourlyOrders = {};
      todayOrders.forEach(order => {
        const hour = new Date(order.created_date).getHours();
        hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
      });

      const peakHour = Object.entries(hourlyOrders)
        .sort((a, b) => b[1] - a[1])[0];

      const totalRevenue = todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const avgOrderValue = todayOrders.length > 0 ? totalRevenue / todayOrders.length : 0;

      // AI Analysis
      const prompt = `Analyze this restaurant's daily order data and provide insights.

Total Orders: ${todayOrders.length}
Total Revenue: $${totalRevenue.toFixed(2)}
Average Order Value: $${avgOrderValue.toFixed(2)}
Peak Hour: ${peakHour ? `${peakHour[0]}:00 (${peakHour[1]} orders)` : 'N/A'}
Hourly Distribution: ${JSON.stringify(hourlyOrders)}

Order Status Breakdown:
${Object.entries(todayOrders.reduce((acc, o) => {
  acc[o.status] = (acc[o.status] || 0) + 1;
  return acc;
}, {})).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

Provide:
1. Performance summary (brief, 2-3 sentences)
2. Key insights about peak times and order patterns
3. Recommendations for tomorrow's operations
4. Staff allocation suggestions for peak hours`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            insights: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            staff_suggestions: { type: "string" }
          }
        }
      });

      setDailySummary({
        date: today.toLocaleDateString(),
        totalOrders: todayOrders.length,
        totalRevenue,
        avgOrderValue,
        peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
        hourlyDistribution: hourlyOrders,
        analysis
      });

      toast.success('Daily summary generated');
    } catch (error) {
      toast.error('Failed to generate summary: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending' && !o.assigned_staff_id);
  const activeOrders = orders.filter(o => 
    ['confirmed', 'preparing'].includes(o.status)
  );

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-[#c9a962]" />
            <div>
              <h3 className="font-playfair text-xl text-white">AI Order Fulfillment</h3>
              <p className="font-inter text-xs text-white/50">Intelligent order assignment and monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-inter text-sm text-white/70">Auto-Assign</span>
            <button
              onClick={() => setIsAutoAssignEnabled(!isAutoAssignEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                isAutoAssignEnabled ? 'bg-[#c9a962]' : 'bg-[#0a0a0a]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isAutoAssignEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="font-inter text-xs text-white/50 uppercase">Pending</span>
            </div>
            <p className="font-playfair text-2xl text-white">{pendingOrders.length}</p>
          </div>

          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="font-inter text-xs text-white/50 uppercase">Active</span>
            </div>
            <p className="font-playfair text-2xl text-white">{activeOrders.length}</p>
          </div>

          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="font-inter text-xs text-white/50 uppercase">Flagged</span>
            </div>
            <p className="font-playfair text-2xl text-white">{flaggedOrders.length}</p>
          </div>

          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className="font-inter text-xs text-white/50 uppercase">Staff Available</span>
            </div>
            <p className="font-playfair text-2xl text-white">
              {staff.filter(s => s.status === 'available').length}
            </p>
          </div>
        </div>
      </div>

      {/* Flagged Orders */}
      {flaggedOrders.length > 0 && (
        <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-playfair text-lg text-white">Orders Requiring Attention</h3>
          </div>
          <div className="space-y-3">
            {flaggedOrders.map((flag, idx) => (
              <div key={idx} className="bg-[#0a0a0a] rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-inter text-sm text-white">
                      Order #{flag.order_reference || flag.order_id}
                    </p>
                    {flag.complexity && (
                      <p className="font-inter text-xs text-red-400">
                        Complexity: {flag.complexity}/10
                      </p>
                    )}
                  </div>
                  <span className="font-inter text-xs text-white/50">
                    {new Date(flag.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="space-y-1">
                  {flag.issues?.map((issue, i) => (
                    <p key={i} className="font-inter text-sm text-red-300">• {issue}</p>
                  ))}
                  {flag.issue && (
                    <p className="font-inter text-sm text-red-300">• {flag.issue}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Summary */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-[#c9a962]" />
            <h3 className="font-playfair text-xl text-white">Daily Performance Summary</h3>
          </div>
          <LuxuryButton onClick={generateDailySummary} disabled={isAnalyzing} size="sm">
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Summary
              </>
            )}
          </LuxuryButton>
        </div>

        {dailySummary ? (
          <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-white/50 uppercase mb-1">Total Orders</p>
                <p className="font-playfair text-2xl text-[#c9a962]">{dailySummary.totalOrders}</p>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-white/50 uppercase mb-1">Revenue</p>
                <p className="font-playfair text-2xl text-[#c9a962]">
                  ${dailySummary.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-white/50 uppercase mb-1">Avg Order Value</p>
                <p className="font-playfair text-2xl text-[#c9a962]">
                  ${dailySummary.avgOrderValue.toFixed(2)}
                </p>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-white/50 uppercase mb-1">Peak Hour</p>
                <p className="font-playfair text-2xl text-[#c9a962]">{dailySummary.peakHour}</p>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="space-y-4">
              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Summary</p>
                <p className="font-inter text-sm text-white/80 leading-relaxed">
                  {dailySummary.analysis.summary}
                </p>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-3">Key Insights</p>
                <div className="space-y-2">
                  {dailySummary.analysis.insights?.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-[#c9a962] mt-0.5 flex-shrink-0" />
                      <p className="font-inter text-sm text-white/70">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-3">Recommendations</p>
                <div className="space-y-2">
                  {dailySummary.analysis.recommendations?.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="font-inter text-sm text-white/70">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Staff Allocation</p>
                <p className="font-inter text-sm text-white/80 leading-relaxed">
                  {dailySummary.analysis.staff_suggestions}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="font-inter text-sm text-white/50">
              Generate a summary to see daily performance insights
            </p>
          </div>
        )}
      </div>
    </div>
  );
}