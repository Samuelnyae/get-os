import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, Clock, TrendingUp, Users, AlertTriangle, CheckCircle, Loader2, Table as TableIcon, Calendar, Zap } from 'lucide-react';
import LuxuryButton from '../common/LuxuryButton';
import { toast } from 'sonner';
import { format, parseISO, addMinutes, differenceInMinutes, isWithinInterval, addDays } from 'date-fns';

export default function AITableManagement() {
  const [predictions, setPredictions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [optimizedSchedule, setOptimizedSchedule] = useState(null);
  const [upcomingAlerts, setUpcomingAlerts] = useState([]);

  const { data: reservations = [] } = useQuery({
    queryKey: ['table-reservations'],
    queryFn: () => base44.entities.Reservation.list('-created_date', 500),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['table-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const { data: tableOrders = [] } = useQuery({
    queryKey: ['table-dining-orders'],
    queryFn: () => base44.entities.TableOrder.list('-created_date', 200),
  });

  // Predict table turnover times
  const predictTurnoverTimes = async () => {
    setIsAnalyzing(true);
    try {
      // Analyze historical dining duration data
      const completedReservations = reservations.filter(r => r.status === 'completed');
      const seatedReservations = reservations.filter(r => r.status === 'seated');
      
      // Calculate average dining times by party size
      const diningTimesByPartySize = {};
      completedReservations.forEach(res => {
        if (!diningTimesByPartySize[res.party_size]) {
          diningTimesByPartySize[res.party_size] = [];
        }
        // Estimate 90 minutes for completed reservations (simplified)
        diningTimesByPartySize[res.party_size].push(90);
      });

      // Analyze order complexity from historical data
      const orderComplexity = orders.map(order => ({
        itemCount: order.items?.length || 0,
        totalAmount: order.total_amount || 0,
        status: order.status
      }));

      const prompt = `You are an AI restaurant operations expert. Analyze this data to predict table turnover times and optimize seating.

HISTORICAL DATA:
- Completed Reservations: ${completedReservations.length}
- Currently Seated: ${seatedReservations.length}
- Dining Times by Party Size: ${JSON.stringify(diningTimesByPartySize)}
- Average Order Complexity: ${orderComplexity.length > 0 ? (orderComplexity.reduce((sum, o) => sum + o.itemCount, 0) / orderComplexity.length).toFixed(1) : 0} items per order

CURRENT SEATED TABLES:
${seatedReservations.map(r => 
  `- Table ${r.table_number || 'TBD'}: Party of ${r.party_size}, Seated at ${r.reservation_time}, Special: ${r.special_requests ? 'Yes' : 'No'}`
).join('\n')}

UPCOMING RESERVATIONS (Next 4 hours):
${reservations.filter(r => r.status === 'confirmed').slice(0, 15).map(r =>
  `- ${r.reservation_time}: Party of ${r.party_size}`
).join('\n')}

TASK:
1. Predict turnover time for each currently seated table (in minutes)
2. Identify tables that may experience delays
3. Calculate optimal table allocation for upcoming reservations
4. Suggest time slots with best availability for walk-ins

Consider:
- Larger parties typically take longer (2-3 people: 60-75min, 4-6: 75-90min, 7+: 90-120min)
- Complex orders add 10-15 minutes
- Special requests may add 10 minutes
- Popular times (18:00-20:00) may have delays`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            seated_table_predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  table_number: { type: "string" },
                  party_size: { type: "number" },
                  estimated_turnover_minutes: { type: "number" },
                  confidence: { type: "string" },
                  potential_delay: { type: "boolean" },
                  delay_reason: { type: "string" }
                }
              }
            },
            capacity_forecast: {
              type: "object",
              properties: {
                current_available_tables: { type: "number" },
                expected_available_in_30min: { type: "number" },
                expected_available_in_60min: { type: "number" },
                peak_hour_forecast: { type: "string" }
              }
            },
            optimal_walkin_slots: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  max_party_size: { type: "number" },
                  availability_score: { type: "number" }
                }
              }
            },
            recommendations: { type: "string" }
          }
        }
      });

      setPredictions(response);

      // Generate alerts for potential delays
      const alerts = response.seated_table_predictions
        .filter(pred => pred.potential_delay)
        .map(pred => ({
          type: 'delay',
          message: `Table ${pred.table_number} may experience delay: ${pred.delay_reason}`,
          severity: 'warning'
        }));

      setUpcomingAlerts(alerts);
      
      if (alerts.length > 0) {
        toast.warning(`${alerts.length} potential delay(s) detected`, {
          description: 'Check the alerts section for details'
        });
      }

      toast.success('Turnover analysis complete');
    } catch (error) {
      toast.error('Analysis failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Optimize table allocation
  const optimizeTableAllocation = async () => {
    setIsAnalyzing(true);
    try {
      const confirmedReservations = reservations.filter(r => r.status === 'confirmed' && !r.table_number);
      const pendingReservations = reservations.filter(r => r.status === 'pending');
      const waitlistReservations = reservations.filter(r => r.status === 'waitlist');

      const prompt = `You are an AI seating optimization expert for a luxury restaurant. Optimize table assignments to maximize efficiency.

RESTAURANT CAPACITY:
- Total Tables: 20 (Tables A1-A5, B1-B5, C1-C5, D1-D5)
- Table Sizes: A/B sections (2-4 guests), C section (4-6 guests), D section (6-10 guests)

CONFIRMED RESERVATIONS NEEDING TABLES:
${confirmedReservations.slice(0, 20).map(r => 
  `- ${r.confirmation_code}: ${r.reservation_date} ${r.reservation_time}, Party: ${r.party_size}, Special: ${r.special_requests || 'None'}`
).join('\n')}

PENDING RESERVATIONS:
${pendingReservations.slice(0, 10).map(r =>
  `- ${r.confirmation_code}: ${r.reservation_date} ${r.reservation_time}, Party: ${r.party_size}`
).join('\n')}

WAITLIST:
${waitlistReservations.slice(0, 5).map(r =>
  `- ${r.confirmation_code}: ${r.reservation_date} ${r.reservation_time}, Party: ${r.party_size}`
).join('\n')}

OPTIMIZATION GOALS:
1. Assign tables to confirmed reservations efficiently
2. Minimize gaps between seatings
3. Group similar party sizes in same sections
4. Clear waitlist where possible
5. Maintain 15-minute buffer between same-table reservations

Provide optimized table assignments.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            table_assignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  confirmation_code: { type: "string" },
                  assigned_table: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            waitlist_clearable: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  confirmation_code: { type: "string" },
                  suggested_table: { type: "string" },
                  suggested_time: { type: "string" }
                }
              }
            },
            efficiency_score: { type: "number" },
            optimization_summary: { type: "string" }
          }
        }
      });

      setOptimizedSchedule(response);
      toast.success('Table allocation optimized');
    } catch (error) {
      toast.error('Optimization failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (reservations.length > 0) {
      predictTurnoverTimes();
    }
    const interval = setInterval(() => {
      if (reservations.length > 0) {
        predictTurnoverTimes();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [reservations.length]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-[#c9a962]" />
            <div>
              <h3 className="font-playfair text-2xl text-white">AI Table Management</h3>
              <p className="font-inter text-sm text-white/60">
                Intelligent predictions and optimization for maximum efficiency
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <LuxuryButton onClick={predictTurnoverTimes} disabled={isAnalyzing} size="sm">
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
            ) : (
              <><Clock className="w-4 h-4 mr-2" />Predict Turnover</>
            )}
          </LuxuryButton>
          <LuxuryButton variant="secondary" onClick={optimizeTableAllocation} disabled={isAnalyzing} size="sm">
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Optimizing...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />Optimize Allocation</>
            )}
          </LuxuryButton>
        </div>
      </div>

      {/* Alerts */}
      {upcomingAlerts.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-inter font-medium text-orange-300 mb-2">Staff Alerts</h4>
              <div className="space-y-2">
                {upcomingAlerts.map((alert, i) => (
                  <div key={i} className="text-sm text-orange-200/80">
                    • {alert.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Turnover Predictions */}
      {predictions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seated Tables */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
            <h4 className="font-playfair text-xl text-white mb-4 flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-[#c9a962]" />
              Current Tables - Turnover Predictions
            </h4>
            <div className="space-y-3">
              {predictions.seated_table_predictions?.map((pred, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3 rounded-lg border ${
                    pred.potential_delay 
                      ? 'bg-orange-500/10 border-orange-500/30' 
                      : 'bg-[#0a0a0a] border-[#c9a962]/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-inter font-medium text-white">
                        Table {pred.table_number}
                      </div>
                      <div className="text-xs text-white/50">
                        Party of {pred.party_size}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-inter text-lg text-[#c9a962]">
                        ~{pred.estimated_turnover_minutes}min
                      </div>
                      <div className="text-xs text-white/50">{pred.confidence}</div>
                    </div>
                  </div>
                  {pred.potential_delay && (
                    <div className="text-xs text-orange-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {pred.delay_reason}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Capacity Forecast */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
            <h4 className="font-playfair text-xl text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#c9a962]" />
              Capacity Forecast
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#c9a962]/10">
                  <div className="text-xs text-white/50 mb-1">Now</div>
                  <div className="font-playfair text-2xl text-white">
                    {predictions.capacity_forecast?.current_available_tables || 0}
                  </div>
                  <div className="text-xs text-[#c9a962]">Available</div>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#c9a962]/10">
                  <div className="text-xs text-white/50 mb-1">30 min</div>
                  <div className="font-playfair text-2xl text-white">
                    {predictions.capacity_forecast?.expected_available_in_30min || 0}
                  </div>
                  <div className="text-xs text-green-400">Expected</div>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#c9a962]/10">
                  <div className="text-xs text-white/50 mb-1">60 min</div>
                  <div className="font-playfair text-2xl text-white">
                    {predictions.capacity_forecast?.expected_available_in_60min || 0}
                  </div>
                  <div className="text-xs text-blue-400">Expected</div>
                </div>
              </div>

              <div className="bg-[#c9a962]/10 rounded-lg p-3 border border-[#c9a962]/20">
                <div className="text-xs text-[#c9a962] uppercase tracking-wider mb-2">Peak Hour Forecast</div>
                <div className="text-sm text-white">{predictions.capacity_forecast?.peak_hour_forecast}</div>
              </div>

              <div>
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Recommendations</div>
                <div className="text-sm text-white/70 leading-relaxed">
                  {predictions.recommendations}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optimal Walk-in Slots */}
      {predictions?.optimal_walkin_slots && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
          <h4 className="font-playfair text-xl text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#c9a962]" />
            Best Walk-in Time Slots
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {predictions.optimal_walkin_slots.map((slot, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#0a0a0a] rounded-lg p-3 border border-[#c9a962]/10"
              >
                <div className="font-inter font-medium text-white mb-1">{slot.time}</div>
                <div className="text-xs text-white/50 mb-2">Up to {slot.max_party_size} guests</div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-[#c9a962]/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#c9a962]" 
                      style={{ width: `${slot.availability_score}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#c9a962]">{slot.availability_score}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Optimized Schedule */}
      {optimizedSchedule && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
          <h4 className="font-playfair text-xl text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Optimized Table Assignments
          </h4>

          <div className="bg-[#c9a962]/10 rounded-lg p-4 mb-4 border border-[#c9a962]/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#c9a962]">Efficiency Score</span>
              <span className="font-playfair text-2xl text-white">{optimizedSchedule.efficiency_score}%</span>
            </div>
            <p className="text-xs text-white/70">{optimizedSchedule.optimization_summary}</p>
          </div>

          <div className="space-y-2">
            {optimizedSchedule.table_assignments?.map((assignment, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#c9a962]/10">
                <div>
                  <div className="font-inter font-medium text-white">{assignment.confirmation_code}</div>
                  <div className="text-xs text-white/50">{assignment.reasoning}</div>
                </div>
                <div className="px-3 py-1 bg-[#c9a962]/20 text-[#c9a962] rounded-full font-inter text-sm">
                  {assignment.assigned_table}
                </div>
              </div>
            ))}
          </div>

          {optimizedSchedule.waitlist_clearable?.length > 0 && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="font-inter font-medium text-green-300 mb-2">
                Waitlist Opportunities ({optimizedSchedule.waitlist_clearable.length})
              </div>
              <div className="space-y-2">
                {optimizedSchedule.waitlist_clearable.map((item, i) => (
                  <div key={i} className="text-sm text-green-200/80">
                    • {item.confirmation_code} → {item.suggested_table} at {item.suggested_time}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}