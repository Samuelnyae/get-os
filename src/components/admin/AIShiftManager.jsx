import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Brain, Loader2, CheckCircle, AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import LuxuryButton from '../common/LuxuryButton';

export default function AIShiftManager() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [plan, setPlan] = useState(null);
  const qc = useQueryClient();

  const { data: staff = [] } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => base44.entities.Staff.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['active-orders-shift'],
    queryFn: () => base44.entities.Order.filter({ status: ['pending', 'confirmed', 'preparing'] }, '-created_date', 50),
    refetchInterval: 15000,
  });

  const updateStaff = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Staff.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-list'] }),
  });

  const runAIShiftPlan = async () => {
    setIsAnalyzing(true);
    try {
      const staffSummary = staff.map(s =>
        `- ${s.name} | Role: ${s.role} | Status: ${s.status} | Current orders: ${s.current_orders?.length || 0}`
      ).join('\n');

      const orderSummary = orders.map(o =>
        `- ${o.order_reference} | Type: ${o.order_type} | Status: ${o.status} | Items: ${o.items?.length || 0} | Assigned: ${o.assigned_staff_name || 'none'}`
      ).join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI Shift Manager for Digital Bites restaurant. Analyze the current staff and active orders and create an optimal assignment plan.

CURRENT STAFF:
${staffSummary || 'No staff configured'}

ACTIVE ORDERS (${orders.length} total):
${orderSummary || 'No active orders'}

Rules:
- Chefs handle food preparation (dine_in, takeaway)
- Delivery staff handle delivery orders
- Managers can handle any role if needed
- Distribute workload evenly
- Flag if any staff is overloaded (>3 orders)
- Flag if no staff is available for a specific order type

Provide:
1. Assignment recommendations for unassigned orders
2. Workload balance assessment
3. Alerts for capacity issues
4. Shift optimization tips`,
        response_json_schema: {
          type: "object",
          properties: {
            assignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  order_reference: { type: "string" },
                  recommended_staff_name: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            workload_summary: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  staff_name: { type: "string" },
                  current_load: { type: "number" },
                  status: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            alerts: { type: "array", items: { type: "string" } },
            shift_tips: { type: "string" },
            overall_capacity: { type: "string" }
          }
        }
      });

      setPlan(response);
      toast.success('AI shift analysis complete');
    } catch (e) {
      toast.error('Failed to analyze shift: ' + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const statusColor = (status) => {
    if (status === 'available') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (status === 'busy') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  };

  const toggleStatus = (member) => {
    const next = { available: 'busy', busy: 'offline', offline: 'available' };
    updateStaff.mutate({ id: member.id, data: { status: next[member.status] } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-2xl text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-[#c9a962]" /> AI Shift Manager
          </h3>
          <p className="font-inter text-sm text-white/40 mt-1">Auto-assign orders and optimize staff workload</p>
        </div>
        <LuxuryButton onClick={runAIShiftPlan} disabled={isAnalyzing}>
          {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Zap className="w-4 h-4 mr-2" />Run AI Analysis</>}
        </LuxuryButton>
      </div>

      {/* Live Staff Grid */}
      <div>
        <h4 className="font-inter text-xs uppercase tracking-widest text-[#c9a962] mb-3">Live Staff Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {staff.map(member => (
            <motion.div key={member.id} layout className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-inter text-sm text-white font-medium truncate">{member.name}</p>
                <button onClick={() => toggleStatus(member)}
                  className={`px-2 py-0.5 rounded-full text-xs font-inter border transition-all ${statusColor(member.status)}`}>
                  {member.status}
                </button>
              </div>
              <p className="font-inter text-xs text-white/40 capitalize">{member.role?.replace('_', ' ')}</p>
              {member.current_orders?.length > 0 && (
                <p className="font-inter text-xs text-amber-400 mt-1">📋 {member.current_orders.length} order(s)</p>
              )}
            </motion.div>
          ))}
          {staff.length === 0 && (
            <div className="col-span-full text-center py-8 text-white/30 font-inter text-sm">
              No staff added yet. Go to Staff Manager to add team members.
            </div>
          )}
        </div>
      </div>

      {/* Active Orders Summary */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-4">
        <h4 className="font-inter text-xs uppercase tracking-widest text-[#c9a962] mb-3">Active Orders ({orders.length})</h4>
        {orders.length === 0 ? (
          <p className="font-inter text-sm text-white/30">No active orders</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {orders.slice(0, 12).map(o => (
              <div key={o.id} className="flex items-center justify-between bg-[#0a0a0a] rounded-lg px-3 py-2">
                <span className="font-mono text-xs text-white/80">{o.order_reference}</span>
                <span className={`text-xs font-inter px-2 py-0.5 rounded-full ${
                  o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  o.status === 'preparing' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>{o.status}</span>
                <span className="text-xs text-white/40 font-inter">{o.assigned_staff_name || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Plan Results */}
      {plan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Capacity Banner */}
          <div className="bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#c9a962] mt-0.5 shrink-0" />
            <div>
              <p className="font-inter text-sm text-[#c9a962] font-semibold">Overall Capacity</p>
              <p className="font-inter text-sm text-white/70">{plan.overall_capacity}</p>
              {plan.shift_tips && <p className="font-inter text-xs text-white/50 mt-1">💡 {plan.shift_tips}</p>}
            </div>
          </div>

          {/* Alerts */}
          {plan.alerts?.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <p className="font-inter text-xs text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Alerts</p>
              <ul className="space-y-1">
                {plan.alerts.map((a, i) => <li key={i} className="font-inter text-sm text-red-300">• {a}</li>)}
              </ul>
            </div>
          )}

          {/* Assignments */}
          {plan.assignments?.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-4">
              <p className="font-inter text-xs text-[#c9a962] uppercase tracking-widest mb-3">Recommended Assignments</p>
              <div className="space-y-2">
                {plan.assignments.map((a, i) => (
                  <div key={i} className="bg-[#0a0a0a] rounded-lg p-3 flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-inter text-sm text-white"><span className="font-mono text-[#c9a962]">{a.order_reference}</span> → <span className="font-semibold">{a.recommended_staff_name}</span></p>
                      <p className="font-inter text-xs text-white/40 mt-0.5">{a.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workload */}
          {plan.workload_summary?.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-4">
              <p className="font-inter text-xs text-[#c9a962] uppercase tracking-widest mb-3">Workload Balance</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {plan.workload_summary.map((w, i) => (
                  <div key={i} className="bg-[#0a0a0a] rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-inter text-sm text-white font-medium">{w.staff_name}</p>
                      <span className={`text-xs font-inter px-2 py-0.5 rounded-full ${
                        w.current_load > 3 ? 'bg-red-500/20 text-red-400' : w.current_load > 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
                      }`}>{w.current_load} orders</span>
                    </div>
                    <p className="font-inter text-xs text-white/40">{w.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}