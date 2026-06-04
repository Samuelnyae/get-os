import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Calendar, CloudRain, Star, Lightbulb, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function AIRevenueForecast() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState('7');

  const { data: orders = [] } = useQuery({
    queryKey: ['orders-forecast'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations-forecast'],
    queryFn: () => base44.entities.Reservation.list('-created_date', 100),
  });

  const generateForecast = async () => {
    setLoading(true);
    const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const avgOrderValue = orders.length ? (totalRevenue / orders.length).toFixed(0) : 0;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a hospitality revenue forecasting AI. Based on the following data, generate a detailed revenue forecast.

Historical data:
- Total orders: ${orders.length}
- Total revenue: KSh ${totalRevenue.toLocaleString()}
- Average order value: KSh ${avgOrderValue}
- Total reservations: ${reservations.length}
- Forecast period: ${forecastPeriod} days
- Current date: ${new Date().toDateString()}

Generate a realistic revenue forecast. Return JSON with:
- today_expected: number (KSh)
- confidence: number (percentage 0-100)
- daily_forecast: array of ${forecastPeriod} objects with {day: "Mon Jun 5", revenue: number, confidence: number}
- busy_periods: array of strings describing predicted busy periods
- insights: array of 3 insight strings
- recommendations: array of 3 recommendation strings
- weekly_total: number
- monthly_total: number (only if period is 30)`,
      response_json_schema: {
        type: 'object',
        properties: {
          today_expected: { type: 'number' },
          confidence: { type: 'number' },
          daily_forecast: { type: 'array', items: { type: 'object', properties: { day: { type: 'string' }, revenue: { type: 'number' }, confidence: { type: 'number' } } } },
          busy_periods: { type: 'array', items: { type: 'string' } },
          insights: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          weekly_total: { type: 'number' },
          monthly_total: { type: 'number' },
        }
      }
    });
    setForecast(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-playfair text-2xl text-white">AI Revenue Forecasting</h2>
          <p className="font-inter text-sm text-white/50 mt-1">Predict future sales using historical data, trends & seasonal patterns</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={forecastPeriod}
            onChange={e => setForecastPeriod(e.target.value)}
            className="bg-[#1a1a1a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm"
          >
            <option value="7">Next 7 Days</option>
            <option value="14">Next 14 Days</option>
            <option value="30">Next 30 Days</option>
          </select>
          <button
            onClick={generateForecast}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-sm font-semibold hover:bg-[#c9a962]/90 disabled:opacity-50 transition-all"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            {loading ? 'Forecasting...' : 'Generate Forecast'}
          </button>
        </div>
      </div>

      {/* Data summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, icon: Star, color: 'text-blue-400' },
          { label: 'Total Revenue', value: `KSh ${orders.reduce((s,o)=>s+(o.total_amount||0),0).toLocaleString()}`, icon: TrendingUp, color: 'text-[#c9a962]' },
          { label: 'Reservations', value: reservations.length, icon: Calendar, color: 'text-green-400' },
          { label: 'Avg Order Value', value: `KSh ${orders.length ? Math.round(orders.reduce((s,o)=>s+(o.total_amount||0),0)/orders.length).toLocaleString() : 0}`, icon: Users, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-white font-inter text-lg font-semibold">{stat.value}</p>
            <p className="text-white/50 font-inter text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {!forecast && !loading && (
        <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-12 text-center">
          <TrendingUp className="w-12 h-12 text-[#c9a962]/40 mx-auto mb-4" />
          <p className="text-white/50 font-inter">Click "Generate Forecast" to get AI-powered revenue predictions</p>
        </div>
      )}

      {loading && (
        <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-12 text-center">
          <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 font-inter">Analyzing historical data and generating forecast...</p>
        </div>
      )}

      {forecast && !loading && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#c9a962]/20 to-[#c9a962]/5 border border-[#c9a962]/30 rounded-xl p-5">
              <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">Expected Today</p>
              <p className="font-playfair text-3xl text-white">KSh {forecast.today_expected?.toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
              <p className="font-inter text-xs text-white/50 uppercase tracking-wider mb-1">AI Confidence</p>
              <div className="flex items-end gap-2">
                <p className="font-playfair text-3xl text-white">{forecast.confidence}%</p>
                <div className="flex-1 bg-white/10 rounded-full h-2 mb-2">
                  <div className="bg-[#c9a962] h-2 rounded-full" style={{ width: `${forecast.confidence}%` }} />
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
              <p className="font-inter text-xs text-white/50 uppercase tracking-wider mb-1">{forecastPeriod}-Day Total</p>
              <p className="font-playfair text-3xl text-white">KSh {(forecastPeriod === '30' ? forecast.monthly_total : forecast.weekly_total)?.toLocaleString()}</p>
            </div>
          </div>

          {/* Revenue Chart */}
          {forecast.daily_forecast?.length > 0 && (
            <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-6">
              <h3 className="font-inter text-white font-semibold mb-4">Revenue Forecast Chart</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={forecast.daily_forecast}>
                  <defs>
                    <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c9a962" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c9a962" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="day" tick={{ fill: '#ffffff60', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#ffffff60', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [`KSh ${v.toLocaleString()}`, 'Revenue']} contentStyle={{ background: '#1a1a1a', border: '1px solid #c9a96230', color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#c9a962" fill="url(#fg)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Busy Periods */}
            <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-orange-400" />
                <h3 className="font-inter text-white text-sm font-semibold">Predicted Busy Periods</h3>
              </div>
              <div className="space-y-2">
                {forecast.busy_periods?.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 shrink-0" />
                    <p className="text-white/70 font-inter text-xs">{p}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-[#c9a962]" />
                <h3 className="font-inter text-white text-sm font-semibold">AI Insights</h3>
              </div>
              <div className="space-y-2">
                {forecast.insights?.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#c9a962] rounded-full mt-2 shrink-0" />
                    <p className="text-white/70 font-inter text-xs">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-green-400" />
                <h3 className="font-inter text-white text-sm font-semibold">Recommendations</h3>
              </div>
              <div className="space-y-2">
                {forecast.recommendations?.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 shrink-0" />
                    <p className="text-white/70 font-inter text-xs">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}