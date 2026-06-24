import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Sparkles, MessageSquare, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle, Loader2, BarChart3, Smile, 
  Frown, Meh, Target, Lightbulb
} from 'lucide-react';
import LuxuryButton from '../common/LuxuryButton';
import { toast } from 'sonner';

const FEEDBACK_CACHE_KEY = 'db_ai_feedback_cache';
const FEEDBACK_CACHE_TTL = 1000 * 60 * 60; // 1 hour

const loadFeedbackCache = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(FEEDBACK_CACHE_KEY) || 'null');
    if (stored && Date.now() - stored.timestamp < FEEDBACK_CACHE_TTL) return stored.data;
  } catch {}
  return null;
};

export default function AIFeedbackAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(() => loadFeedbackCache());

  const { data: comments = [] } = useQuery({
    queryKey: ['feedback-comments'],
    queryFn: () => base44.entities.Comment.list('-created_date', 500),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['feedback-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['feedback-menu'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: customRequests = [] } = useQuery({
    queryKey: ['feedback-custom'],
    queryFn: () => base44.entities.CustomFoodRequest.list('-created_date', 100),
  });

  const analyzeFeedback = async () => {
    setIsAnalyzing(true);
    try {
      // Calculate basic metrics
      const avgRating = comments.length > 0 
        ? comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length 
        : 0;

      const ratingDistribution = comments.reduce((acc, c) => {
        const rating = c.rating || 0;
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {});

      // Group comments by menu item
      const itemFeedback = {};
      comments.forEach(comment => {
        const item = menuItems.find(m => m.id === comment.menu_item_id);
        if (item) {
          if (!itemFeedback[item.name]) {
            itemFeedback[item.name] = [];
          }
          itemFeedback[item.name].push(comment);
        }
      });

      const prompt = `You are a customer experience analyst for "Get OS" luxury restaurant. Analyze customer feedback and provide comprehensive insights.

FEEDBACK DATA:
Total Comments: ${comments.length}
Average Rating: ${avgRating.toFixed(2)}/5

Rating Distribution:
${Object.entries(ratingDistribution).map(([rating, count]) => `${rating} stars: ${count} reviews`).join('\n')}

Recent Customer Comments (sample):
${comments.slice(0, 30).map(c => {
  const item = menuItems.find(m => m.id === c.menu_item_id);
  return `- ${item?.name || 'Unknown'} (${c.rating}/5): "${c.content}"`;
}).join('\n')}

Menu Items Performance:
${Object.entries(itemFeedback).slice(0, 15).map(([name, comments]) => {
  const avgItemRating = comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length;
  return `- ${name}: ${avgItemRating.toFixed(1)}/5 (${comments.length} reviews)`;
}).join('\n')}

Order Status Data:
${orders.slice(0, 50).map(o => `- Status: ${o.status}, Items: ${o.items?.length || 0}`).join('\n')}

ANALYSIS REQUIREMENTS:

1. SENTIMENT ANALYSIS:
   - Overall customer satisfaction level (percentage)
   - Sentiment breakdown (positive/neutral/negative)
   - Trend analysis (improving/declining/stable)

2. RECURRING THEMES:
   Identify patterns across:
   - Food Quality (taste, presentation, freshness)
   - Service Speed (order processing, delivery time)
   - Ambiance (atmosphere, cleanliness, comfort)
   - Value for Money
   - Staff Friendliness
   - Menu Variety

3. SPECIFIC IMPROVEMENT AREAS:
   - Top 3 strengths (what customers love)
   - Top 3 weaknesses (what needs improvement)
   - Critical issues requiring immediate attention

4. MENU ITEM INSIGHTS:
   - Best performing items (high ratings, positive feedback)
   - Items needing improvement (low ratings, complaints)
   - Suggestions for menu optimization

5. ACTIONABLE RECOMMENDATIONS:
   - Short-term fixes (1-2 weeks)
   - Medium-term improvements (1-2 months)
   - Long-term strategic changes

Provide data-driven, specific, actionable insights.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            sentiment_analysis: {
              type: "object",
              properties: {
                overall_satisfaction: { type: "number" },
                positive_percentage: { type: "number" },
                neutral_percentage: { type: "number" },
                negative_percentage: { type: "number" },
                trend: { type: "string" },
                summary: { type: "string" }
              }
            },
            recurring_themes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  sentiment: { type: "string" },
                  frequency: { type: "string" },
                  key_points: { type: "array", items: { type: "string" } }
                }
              }
            },
            strengths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  strength: { type: "string" },
                  impact: { type: "string" },
                  customer_quotes: { type: "array", items: { type: "string" } }
                }
              }
            },
            weaknesses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  weakness: { type: "string" },
                  severity: { type: "string" },
                  affected_areas: { type: "array", items: { type: "string" } }
                }
              }
            },
            critical_issues: {
              type: "array",
              items: { type: "string" }
            },
            menu_insights: {
              type: "object",
              properties: {
                top_performers: { type: "array", items: { type: "string" } },
                needs_improvement: { type: "array", items: { type: "string" } },
                optimization_suggestions: { type: "array", items: { type: "string" } }
              }
            },
            recommendations: {
              type: "object",
              properties: {
                short_term: { type: "array", items: { type: "string" } },
                medium_term: { type: "array", items: { type: "string" } },
                long_term: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      const result = {
        ...response,
        metrics: {
          totalComments: comments.length,
          avgRating: avgRating.toFixed(2),
          ratingDistribution
        },
        generatedAt: new Date().toISOString()
      };
      setAnalysis(result);
      localStorage.setItem(FEEDBACK_CACHE_KEY, JSON.stringify({ data: result, timestamp: Date.now() }));

      toast.success('Feedback analysis complete');
    } catch (error) {
      toast.error('Failed to analyze feedback: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentIcon = (percentage) => {
    if (percentage >= 70) return <Smile className="w-5 h-5 text-green-400" />;
    if (percentage >= 40) return <Meh className="w-5 h-5 text-yellow-400" />;
    return <Frown className="w-5 h-5 text-red-400" />;
  };

  const getSeverityColor = (severity) => {
    if (severity === 'high' || severity === 'critical') return 'text-red-400';
    if (severity === 'medium') return 'text-yellow-400';
    return 'text-white/60';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-[#c9a962]" />
            <div>
              <h3 className="font-playfair text-xl text-white">AI Feedback Analysis</h3>
              <p className="font-inter text-xs text-white/50">
                Comprehensive sentiment and theme analysis from customer reviews
              </p>
            </div>
          </div>
          <LuxuryButton onClick={analyzeFeedback} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Feedback
              </>
            )}
          </LuxuryButton>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <p className="font-inter text-xs text-white/50 uppercase mb-1">Total Reviews</p>
            <p className="font-playfair text-2xl text-white">{comments.length}</p>
          </div>
          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <p className="font-inter text-xs text-white/50 uppercase mb-1">Avg Rating</p>
            <p className="font-playfair text-2xl text-[#c9a962]">
              {comments.length > 0 
                ? (comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length).toFixed(1)
                : '0.0'
              } / 5
            </p>
          </div>
          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <p className="font-inter text-xs text-white/50 uppercase mb-1">Data Sources</p>
            <p className="font-playfair text-2xl text-white">
              {[comments.length > 0, orders.length > 0, customRequests.length > 0].filter(Boolean).length}/3
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis ? (
        <div className="space-y-6">
          {/* Sentiment Analysis */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-[#c9a962]" />
              <h4 className="font-playfair text-lg text-white">Sentiment Analysis</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-inter text-xs text-white/50 uppercase">Satisfaction</span>
                  {getSentimentIcon(analysis.sentiment_analysis.overall_satisfaction)}
                </div>
                <p className="font-playfair text-3xl text-[#c9a962]">
                  {analysis.sentiment_analysis.overall_satisfaction}%
                </p>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <span className="font-inter text-xs text-white/50 uppercase block mb-2">Positive</span>
                <p className="font-playfair text-3xl text-green-400">
                  {analysis.sentiment_analysis.positive_percentage}%
                </p>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <span className="font-inter text-xs text-white/50 uppercase block mb-2">Neutral</span>
                <p className="font-playfair text-3xl text-yellow-400">
                  {analysis.sentiment_analysis.neutral_percentage}%
                </p>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <span className="font-inter text-xs text-white/50 uppercase block mb-2">Negative</span>
                <p className="font-playfair text-3xl text-red-400">
                  {analysis.sentiment_analysis.negative_percentage}%
                </p>
              </div>
            </div>

            <div className="bg-[#0a0a0a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {analysis.sentiment_analysis.trend === 'improving' ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : analysis.sentiment_analysis.trend === 'declining' ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : (
                  <Meh className="w-4 h-4 text-white/50" />
                )}
                <span className="font-inter text-xs text-[#c9a962] uppercase">Trend: {analysis.sentiment_analysis.trend}</span>
              </div>
              <p className="font-inter text-sm text-white/70">{analysis.sentiment_analysis.summary}</p>
            </div>
          </div>

          {/* Recurring Themes */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-[#c9a962]" />
              <h4 className="font-playfair text-lg text-white">Recurring Themes</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.recurring_themes?.map((theme, i) => (
                <div key={i} className="bg-[#0a0a0a] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-inter text-sm text-white font-medium">{theme.category}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-inter mt-1 ${
                        theme.sentiment === 'positive' ? 'bg-green-500/20 text-green-300' :
                        theme.sentiment === 'negative' ? 'bg-red-500/20 text-red-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {theme.sentiment}
                      </span>
                    </div>
                    <span className="font-inter text-xs text-white/50">{theme.frequency}</span>
                  </div>
                  <ul className="space-y-1">
                    {theme.key_points?.map((point, j) => (
                      <li key={j} className="font-inter text-xs text-white/60 flex items-start gap-2">
                        <span className="text-[#c9a962] mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="font-playfair text-lg text-white">Top Strengths</h4>
              </div>
              <div className="space-y-4">
                {analysis.strengths?.map((strength, i) => (
                  <div key={i} className="bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-inter text-sm text-white font-medium">{strength.strength}</p>
                      <span className="font-inter text-xs text-green-400">{strength.impact}</span>
                    </div>
                    {strength.customer_quotes?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {strength.customer_quotes.slice(0, 2).map((quote, j) => (
                          <p key={j} className="font-inter text-xs text-white/50 italic">
                            "{quote}"
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h4 className="font-playfair text-lg text-white">Areas for Improvement</h4>
              </div>
              <div className="space-y-4">
                {analysis.weaknesses?.map((weakness, i) => (
                  <div key={i} className="bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-inter text-sm text-white font-medium">{weakness.weakness}</p>
                      <span className={`font-inter text-xs ${getSeverityColor(weakness.severity)}`}>
                        {weakness.severity}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {weakness.affected_areas?.map((area, j) => (
                        <span key={j} className="px-2 py-1 bg-red-500/10 rounded text-xs text-red-300">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Critical Issues */}
          {analysis.critical_issues?.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h4 className="font-playfair text-lg text-white">Critical Issues - Immediate Action Required</h4>
              </div>
              <div className="space-y-2">
                {analysis.critical_issues.map((issue, i) => (
                  <div key={i} className="bg-[#0a0a0a] rounded-lg p-3 flex items-start gap-3">
                    <span className="font-inter text-red-400 font-bold">{i + 1}.</span>
                    <p className="font-inter text-sm text-white/80">{issue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Menu Insights */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-[#c9a962]" />
              <h4 className="font-playfair text-lg text-white">Menu Performance Insights</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-green-400 uppercase mb-3">Top Performers</p>
                <ul className="space-y-2">
                  {analysis.menu_insights?.top_performers?.map((item, i) => (
                    <li key={i} className="font-inter text-sm text-white/70 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-yellow-400 uppercase mb-3">Needs Improvement</p>
                <ul className="space-y-2">
                  {analysis.menu_insights?.needs_improvement?.map((item, i) => (
                    <li key={i} className="font-inter text-sm text-white/70 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-[#c9a962] uppercase mb-3">Optimization Tips</p>
                <ul className="space-y-2">
                  {analysis.menu_insights?.optimization_suggestions?.map((suggestion, i) => (
                    <li key={i} className="font-inter text-sm text-white/70 flex items-start gap-2">
                      <span className="text-[#c9a962] mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-[#c9a962]" />
              <h4 className="font-playfair text-lg text-white">Actionable Recommendations</h4>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-3">
                  Short-term (1-2 weeks)
                </p>
                <ul className="space-y-2">
                  {analysis.recommendations?.short_term?.map((rec, i) => (
                    <li key={i} className="font-inter text-sm text-white/70 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#c9a962] mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-blue-400 uppercase tracking-wider mb-3">
                  Medium-term (1-2 months)
                </p>
                <ul className="space-y-2">
                  {analysis.recommendations?.medium_term?.map((rec, i) => (
                    <li key={i} className="font-inter text-sm text-white/70 flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="font-inter text-xs text-purple-400 uppercase tracking-wider mb-3">
                  Long-term (Strategic)
                </p>
                <ul className="space-y-2">
                  {analysis.recommendations?.long_term?.map((rec, i) => (
                    <li key={i} className="font-inter text-sm text-white/70 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Report Info */}
          <div className="text-center">
            <p className="font-inter text-xs text-white/40">
              Report generated on {new Date(analysis.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="font-playfair text-xl text-white mb-2">No Analysis Yet</h3>
          <p className="font-inter text-sm text-white/50 max-w-md mx-auto">
            Click "Analyze Feedback" to generate comprehensive insights from customer reviews, 
            comments, and order data.
          </p>
        </div>
      )}
    </div>
  );
}