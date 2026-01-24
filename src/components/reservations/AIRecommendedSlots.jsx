import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function AIRecommendedSlots({ selectedDate, partySize, onSelectTime }) {
  const [recommendations, setRecommendations] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations-for-slots'],
    queryFn: () => base44.entities.Reservation.list('-created_date', 300),
  });

  useEffect(() => {
    if (selectedDate && partySize && reservations.length > 0) {
      analyzeAvailability();
    }
  }, [selectedDate, partySize, reservations.length]);

  const analyzeAvailability = async () => {
    setIsAnalyzing(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayOfWeek = format(selectedDate, 'EEEE');
      
      // Count reservations per time slot for this date
      const slotOccupancy = {};
      reservations
        .filter(r => r.reservation_date === dateStr && r.status !== 'cancelled')
        .forEach(r => {
          slotOccupancy[r.reservation_time] = (slotOccupancy[r.reservation_time] || 0) + 1;
        });

      // Historical data for this day of week
      const historicalDataForDay = reservations
        .filter(r => format(new Date(r.reservation_date), 'EEEE') === dayOfWeek)
        .map(r => r.reservation_time);

      const prompt = `You are an AI reservation optimization expert. Analyze availability and recommend the best time slots.

DATE: ${format(selectedDate, 'EEEE, MMMM d, yyyy')}
PARTY SIZE: ${partySize} guests

CURRENT AVAILABILITY (Max 5 tables per slot):
${Object.entries(slotOccupancy).map(([time, count]) => `${time}: ${count}/5 booked`).join(', ')}

HISTORICAL PATTERNS FOR ${dayOfWeek}:
Popular times: ${Array.from(new Set(historicalDataForDay)).slice(0, 5).join(', ') || 'No data'}

TASK:
Recommend the top 6 time slots between 11:00-22:00 that are:
1. Available (less than 5 bookings)
2. Optimal for party size of ${partySize}
3. Less crowded for better service
4. Avoiding peak rush hours if possible

Consider:
- Larger parties (6+) prefer 18:00-19:30
- Smaller parties (2-3) flexible anytime
- Lunch slots (12:00-14:00) typically quieter
- Dinner peak (19:00-20:30) can be busy

Provide recommendations with availability score (0-100) and reasoning.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_slots: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  availability_score: { type: "number" },
                  crowd_level: { type: "string" },
                  reasoning: { type: "string" },
                  ideal_for_party_size: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      setRecommendations(response.recommended_slots);
    } catch (error) {
      console.error('Failed to analyze:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!selectedDate) return null;

  if (isAnalyzing) {
    return (
      <div className="bg-[#c9a962]/10 rounded-xl p-4 border border-[#c9a962]/20">
        <div className="flex items-center gap-2 text-[#c9a962]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-inter text-sm">Analyzing optimal time slots...</span>
        </div>
      </div>
    );
  }

  if (!recommendations) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#c9a962]/10 to-[#e4d5a7]/5 rounded-xl p-4 border border-[#c9a962]/20"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#c9a962]" />
        <h4 className="font-inter text-sm font-medium text-[#c9a962]">AI Recommended Time Slots</h4>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {recommendations.map((slot, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectTime(slot.time)}
            className="text-left p-3 bg-[#1a1a1a] rounded-lg border border-[#c9a962]/20 hover:border-[#c9a962]/50 hover:bg-[#c9a962]/5 transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-inter font-medium text-white">{slot.time}</span>
              {slot.ideal_for_party_size && (
                <TrendingUp className="w-3 h-3 text-green-400" />
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1 bg-[#c9a962]/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#c9a962]" 
                  style={{ width: `${slot.availability_score}%` }}
                />
              </div>
              <span className="text-xs text-[#c9a962]">{slot.availability_score}%</span>
            </div>
            <div className="text-xs text-white/50">{slot.crowd_level}</div>
            <div className="text-xs text-white/40 mt-1 line-clamp-2">{slot.reasoning}</div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}