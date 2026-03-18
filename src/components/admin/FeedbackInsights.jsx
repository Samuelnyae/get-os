import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Sparkles, TrendingUp, ChefHat, Globe, Building2, Users, Truck, Loader2 } from 'lucide-react';

const avgRating = (items, key) => {
  const valid = items.filter(f => f[key] > 0);
  if (!valid.length) return 0;
  return (valid.reduce((s, f) => s + f[key], 0) / valid.length).toFixed(1);
};

const RatingBar = ({ label, icon: Icon, value }) => (
  <div className="flex items-center gap-3">
    <Icon className="w-4 h-4 text-[#c9a962] flex-shrink-0" />
    <span className="font-inter text-sm text-white/70 w-36 flex-shrink-0">{label}</span>
    <div className="flex-1 bg-white/10 rounded-full h-2">
      <div
        className="h-2 rounded-full bg-[#c9a962] transition-all duration-500"
        style={{ width: `${(value / 5) * 100}%` }}
      />
    </div>
    <span className="font-inter text-sm text-[#c9a962] w-8 text-right">{value}</span>
  </div>
);

export default function FeedbackInsights() {
  const [aiReport, setAiReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['delivery-feedbacks'],
    queryFn: () => base44.entities.DeliveryFeedback.list('-created_date', 100),
  });

  const generateReport = async () => {
    if (!feedbacks.length) return;
    setGenerating(true);
    try {
      const summary = {
        total: feedbacks.length,
        avg_website: avgRating(feedbacks, 'website_rating'),
        avg_food: avgRating(feedbacks, 'food_rating'),
        avg_hotel: avgRating(feedbacks, 'hotel_rating'),
        avg_reception: avgRating(feedbacks, 'reception_rating'),
        avg_service: avgRating(feedbacks, 'service_rating'),
        comments: feedbacks.slice(0, 20).map(f => ({
          food: f.food_comment,
          service: f.service_comment,
          overall: f.overall_comment
        })).filter(c => c.food || c.service || c.overall),
        existing_insights: feedbacks.slice(0, 10).map(f => f.ai_insights).filter(Boolean)
      };

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the AI improvement advisor for Hermanas Bites luxury restaurant. Analyze the following aggregated customer feedback data and generate a comprehensive improvement report.

FEEDBACK SUMMARY (${summary.total} responses):
Average Ratings:
- Website/App: ${summary.avg_website}/5
- Food Quality: ${summary.avg_food}/5
- Hotel/Ambiance: ${summary.avg_hotel}/5
- Reception/Staff: ${summary.avg_reception}/5
- Delivery/Service: ${summary.avg_service}/5

Recent Customer Comments:
${summary.comments.map(c => `• Food: "${c.food || 'N/A'}" | Service: "${c.service || 'N/A'}" | Overall: "${c.overall || 'N/A'}"`).join('\n')}

Individual AI Insights from recent orders:
${summary.existing_insights.join('\n')}

Provide a comprehensive, actionable improvement report covering: food quality improvements, service enhancements, website/UX fixes, staff training suggestions, and ambiance improvements. Be specific and prioritized.`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            top_priorities: { type: "array", items: { type: "string" } },
            food_improvements: { type: "array", items: { type: "string" } },
            service_improvements: { type: "array", items: { type: "string" } },
            website_improvements: { type: "array", items: { type: "string" } },
            staff_suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });
      setAiReport(res);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const categories = [
    { key: 'website_rating', label: 'Website & App', icon: Globe },
    { key: 'food_rating', label: 'Food Quality', icon: ChefHat },
    { key: 'hotel_rating', label: 'Hotel & Ambiance', icon: Building2 },
    { key: 'reception_rating', label: 'Reception & Staff', icon: Users },
    { key: 'service_rating', label: 'Delivery & Service', icon: Truck },
  ];

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {categories.map(({ key, label, icon: Icon }) => (
          <div key={key} className="bg-[#1a1a1a] rounded-xl p-4 border border-[#c9a962]/10 text-center">
            <Icon className="w-5 h-5 text-[#c9a962] mx-auto mb-2" />
            <p className="font-playfair text-2xl text-white">{avgRating(feedbacks, key)}</p>
            <p className="font-inter text-xs text-white/50 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Rating Bars */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-playfair text-xl text-white">Rating Overview</h3>
          <span className="font-inter text-sm text-white/40">{feedbacks.length} responses</span>
        </div>
        <div className="space-y-4">
          {categories.map(({ key, label, icon }) => (
            <RatingBar key={key} label={label} icon={icon} value={avgRating(feedbacks, key)} />
          ))}
        </div>
      </div>

      {/* AI Report */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-playfair text-xl text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#c9a962]" />
            AI Improvement Report
          </h3>
          <button
            onClick={generateReport}
            disabled={generating || !feedbacks.length}
            className="px-4 py-2 rounded-full bg-[#c9a962] text-[#0a0a0a] font-inter text-sm font-medium hover:bg-[#e4d5a7] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            {generating ? 'Analyzing...' : 'Generate Report'}
          </button>
        </div>

        {!aiReport && !generating && (
          <p className="font-inter text-sm text-white/40 text-center py-8">
            Click "Generate Report" to get AI-powered improvement suggestions based on all customer feedback.
          </p>
        )}

        {aiReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="p-4 rounded-lg bg-[#c9a962]/10 border border-[#c9a962]/20">
              <p className="font-inter text-sm text-white/80 leading-relaxed">{aiReport.executive_summary}</p>
            </div>

            {[
              { key: 'top_priorities', label: 'Top Priorities', color: 'text-red-400' },
              { key: 'food_improvements', label: 'Food Improvements', color: 'text-[#c9a962]' },
              { key: 'service_improvements', label: 'Service Improvements', color: 'text-blue-400' },
              { key: 'website_improvements', label: 'Website/App Improvements', color: 'text-green-400' },
              { key: 'staff_suggestions', label: 'Staff Suggestions', color: 'text-purple-400' },
            ].map(({ key, label, color }) => (
              aiReport[key]?.length > 0 && (
                <div key={key}>
                  <h4 className={`font-inter text-sm font-semibold uppercase tracking-wider mb-2 ${color}`}>{label}</h4>
                  <ul className="space-y-1">
                    {aiReport[key].map((item, i) => (
                      <li key={i} className="font-inter text-sm text-white/70 flex items-start gap-2">
                        <span className="text-[#c9a962] mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </motion.div>
        )}
      </div>

      {/* Recent Feedback List */}
      {feedbacks.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
          <h3 className="font-playfair text-xl text-white mb-4">Recent Feedback</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {feedbacks.slice(0, 20).map((fb) => (
              <div key={fb.id} className="p-4 rounded-lg bg-[#0a0a0a] border border-[#c9a962]/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-inter text-sm text-white/70">{fb.customer_email}</span>
                  <span className="font-inter text-xs text-white/40">{fb.order_reference}</span>
                </div>
                <div className="flex gap-4 text-xs text-white/50 font-inter flex-wrap">
                  <span>Food: {fb.food_rating}★</span>
                  <span>Service: {fb.service_rating}★</span>
                  <span>Website: {fb.website_rating}★</span>
                  <span>Hotel: {fb.hotel_rating}★</span>
                  <span>Reception: {fb.reception_rating}★</span>
                </div>
                {fb.overall_comment && (
                  <p className="font-inter text-xs text-white/60 mt-2 italic">"{fb.overall_comment}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}