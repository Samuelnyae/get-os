import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Plus, X, TrendingUp } from 'lucide-react';

const KPI_FIELDS = [
  { key: 'punctuality_score', label: 'Punctuality' },
  { key: 'teamwork_score', label: 'Teamwork' },
  { key: 'productivity_score', label: 'Productivity' },
  { key: 'customer_service_score', label: 'Customer Service' },
];

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={`w-5 h-5 transition-colors ${n <= value ? 'fill-[#c9a962] text-[#c9a962]' : 'text-white/20'}`} />
        </button>
      ))}
    </div>
  );
}

const EMPTY_FORM = { staff_id: '', review_period: '', reviewer: '', punctuality_score: 0, teamwork_score: 0, productivity_score: 0, customer_service_score: 0, strengths: '', improvements: '', goals: '' };

export default function PerformanceReviews() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedStaff, setSelectedStaff] = useState('all');

  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => base44.entities.Staff.list() });
  const { data: reviews = [] } = useQuery({ queryKey: ['reviews'], queryFn: () => base44.entities.PerformanceReview.list('-created_date') });

  const save = useMutation({
    mutationFn: () => {
      const s = staff.find(m => m.id === form.staff_id);
      const scores = KPI_FIELDS.map(f => form[f.key] || 0);
      const overall = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
      const data = { ...form, staff_name: s?.name || '', overall_score: overall, status: 'submitted' };
      return editingId ? base44.entities.PerformanceReview.update(editingId, data) : base44.entities.PerformanceReview.create(data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews'] }); setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); },
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.PerformanceReview.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });

  const openEdit = (r) => { setForm(r); setEditingId(r.id); setShowForm(true); };

  const filtered = selectedStaff === 'all' ? reviews : reviews.filter(r => r.staff_id === selectedStaff);

  const scoreColor = (s) => s >= 4 ? 'text-emerald-400' : s >= 3 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-lg">Performance Reviews</h3>
          <p className="text-white/40 text-sm">{reviews.length} reviews submitted</p>
        </div>
        <div className="flex gap-3">
          <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}
            className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-white/70 text-sm">
            <option value="all">All Staff</option>
            {staff.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <Button onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
            <Plus className="w-4 h-4 mr-1" /> New Review
          </Button>
        </div>
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        {filtered.map(r => (
          <div key={r.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-white font-semibold">{r.staff_name}</div>
                <div className="text-white/40 text-sm">{r.review_period} · Reviewed by {r.reviewer || 'Manager'}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className={`text-2xl font-bold ${scoreColor(r.overall_score)}`}>{r.overall_score || 0}<span className="text-sm text-white/30">/5</span></div>
                  <div className="text-white/30 text-xs">Overall</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg bg-[#c9a962]/10 text-[#c9a962] hover:bg-[#c9a962]/20 text-xs">Edit</button>
                  <button onClick={() => del.mutate(r.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs">Del</button>
                </div>
              </div>
            </div>
            {/* KPI Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {KPI_FIELDS.map(f => (
                <div key={f.key}>
                  <div className="text-white/40 text-xs mb-1">{f.label}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#c9a962] rounded-full transition-all" style={{ width: `${((r[f.key] || 0) / 5) * 100}%` }} />
                    </div>
                    <span className={`text-xs font-medium ${scoreColor(r[f.key])}`}>{r[f.key] || 0}</span>
                  </div>
                </div>
              ))}
            </div>
            {(r.strengths || r.improvements || r.goals) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/5">
                {[['Strengths', r.strengths, 'text-emerald-400'], ['Areas to Improve', r.improvements, 'text-amber-400'], ['Goals', r.goals, 'text-blue-400']].map(([l, v, c]) => v ? (
                  <div key={l}><div className={`text-xs font-medium mb-1 ${c}`}>{l}</div><div className="text-white/50 text-xs">{v}</div></div>
                ) : null)}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30"><TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No reviews yet</p></div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">{editingId ? 'Edit Review' : 'New Performance Review'}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Staff Member</label>
                  <select value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">Select...</option>
                    {staff.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Review Period</label>
                  <Input value={form.review_period} onChange={e => setForm(f => ({ ...f, review_period: e.target.value }))}
                    placeholder="e.g. Q2 2026" className="bg-[#111] border-white/10 text-white" />
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Reviewer Name</label>
                <Input value={form.reviewer} onChange={e => setForm(f => ({ ...f, reviewer: e.target.value }))}
                  placeholder="Manager name" className="bg-[#111] border-white/10 text-white" />
              </div>
              {KPI_FIELDS.map(field => (
                <div key={field.key}>
                  <label className="text-white/60 text-xs mb-2 block">{field.label}</label>
                  <StarRating value={form[field.key] || 0} onChange={v => setForm(f => ({ ...f, [field.key]: v }))} />
                </div>
              ))}
              {[['strengths', 'Strengths'], ['improvements', 'Areas to Improve'], ['goals', 'Goals for Next Period']].map(([k, l]) => (
                <div key={k}>
                  <label className="text-white/60 text-xs mb-1 block">{l}</label>
                  <textarea value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    rows={2} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
                </div>
              ))}
              <Button onClick={() => save.mutate()} disabled={!form.staff_id || !form.review_period || save.isPending}
                className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">
                {save.isPending ? 'Saving...' : 'Save Review'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}