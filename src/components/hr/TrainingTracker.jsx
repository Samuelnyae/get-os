import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Plus, X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const CAT_COLORS = {
  food_safety:      'bg-red-500/20 text-red-400 border-red-500/30',
  customer_service: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  operations:       'bg-amber-500/20 text-amber-400 border-amber-500/30',
  health_safety:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  leadership:       'bg-purple-500/20 text-purple-400 border-purple-500/30',
  other:            'bg-white/10 text-white/50 border-white/20',
};

const STATUS_ICONS = {
  completed:   <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  in_progress: <Clock className="w-3.5 h-3.5 text-amber-400" />,
  not_started: <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20" />,
};

const EMPTY_FORM = { title: '', description: '', category: 'other', duration_hours: 1, due_date: '', is_mandatory: false, resources_url: '' };

export default function TrainingTracker() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => base44.entities.Staff.list() });
  const { data: modules = [] } = useQuery({ queryKey: ['training'], queryFn: () => base44.entities.TrainingModule.list('-created_date') });

  const save = useMutation({
    mutationFn: () => {
      const assigned = staff.map(m => ({ staff_id: m.id, staff_name: m.name, status: 'not_started' }));
      return base44.entities.TrainingModule.create({ ...form, assigned_to: assigned });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['training'] }); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ module, staffId, newStatus }) => {
      const assigned = (module.assigned_to || []).map(a =>
        a.staff_id === staffId ? { ...a, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined } : a
      );
      return base44.entities.TrainingModule.update(module.id, { assigned_to: assigned });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.TrainingModule.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  });

  const getProgress = (m) => {
    const assigned = m.assigned_to || [];
    if (!assigned.length) return 0;
    const done = assigned.filter(a => a.status === 'completed').length;
    return Math.round((done / assigned.length) * 100);
  };

  const isOverdue = (m) => m.due_date && new Date(m.due_date) < new Date() && getProgress(m) < 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Training Modules</h3>
          <p className="text-white/40 text-sm">{modules.length} modules · {staff.length} staff</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> New Module
        </Button>
      </div>

      <div className="space-y-4">
        {modules.map(m => {
          const progress = getProgress(m);
          const overdue = isOverdue(m);
          const isOpen = expandedId === m.id;
          return (
            <div key={m.id} className={`bg-[#1a1a1a] border rounded-2xl overflow-hidden transition-all ${overdue ? 'border-red-500/30' : 'border-white/10'}`}>
              <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : m.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${CAT_COLORS[m.category] || CAT_COLORS.other}`}>
                        {m.category?.replace('_', ' ')}
                      </span>
                      {m.is_mandatory && <span className="text-xs px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">Mandatory</span>}
                      {overdue && <span className="text-xs px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/20 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Overdue</span>}
                    </div>
                    <div className="text-white font-medium">{m.title}</div>
                    {m.description && <div className="text-white/40 text-sm mt-0.5">{m.description}</div>}
                    <div className="text-white/30 text-xs mt-1">{m.duration_hours}h · {m.due_date ? `Due ${m.due_date}` : 'No deadline'}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xl font-bold ${progress === 100 ? 'text-emerald-400' : progress > 0 ? 'text-amber-400' : 'text-white/40'}`}>{progress}%</div>
                    <div className="text-white/30 text-xs">complete</div>
                    <button onClick={e => { e.stopPropagation(); del.mutate(m.id); }} className="text-xs text-red-400/50 hover:text-red-400 mt-1">delete</button>
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-[#c9a962]'}`} style={{ width: `${progress}%` }} />
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-white/5 p-5">
                  <div className="text-white/40 text-xs mb-3">Staff Progress</div>
                  <div className="space-y-2">
                    {(m.assigned_to || []).map(a => (
                      <div key={a.staff_id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {STATUS_ICONS[a.status]}
                          <span className="text-white/70 text-sm">{a.staff_name}</span>
                        </div>
                        <select value={a.status}
                          onChange={e => updateStatus.mutate({ module: m, staffId: a.staff_id, newStatus: e.target.value })}
                          className="bg-[#111] border border-white/10 rounded-lg px-2 py-1 text-xs text-white/60">
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    ))}
                    {(m.assigned_to || []).length === 0 && <div className="text-white/30 text-sm">No staff assigned</div>}
                  </div>
                  {m.resources_url && (
                    <a href={m.resources_url} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[#c9a962] text-xs hover:underline">
                      <BookOpen className="w-3 h-3" /> View Resources
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {modules.length === 0 && (
          <div className="text-center py-12 text-white/30"><BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No training modules yet</p></div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">New Training Module</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-1 block">Title *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-[#111] border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                    {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Duration (hours)</label>
                  <Input type="number" value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: Number(e.target.value) }))} className="bg-[#111] border-white/10 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Due Date</label>
                  <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="bg-[#111] border-white/10 text-white" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="mandatory" checked={form.is_mandatory} onChange={e => setForm(f => ({ ...f, is_mandatory: e.target.checked }))} className="rounded" />
                  <label htmlFor="mandatory" className="text-white/60 text-sm">Mandatory</label>
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Resources URL</label>
                <Input value={form.resources_url} onChange={e => setForm(f => ({ ...f, resources_url: e.target.value }))} placeholder="https://..." className="bg-[#111] border-white/10 text-white" />
              </div>
              <Button onClick={() => save.mutate()} disabled={!form.title || save.isPending} className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">
                {save.isPending ? 'Creating...' : 'Create Module'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}