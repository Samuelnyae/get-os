import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

const SHIFT_CONFIG = {
  morning:   { label: 'Morning',   color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',   time: '06:00–14:00' },
  afternoon: { label: 'Afternoon', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',      time: '14:00–22:00' },
  evening:   { label: 'Evening',   color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',time: '18:00–02:00' },
  night:     { label: 'Night',     color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',   time: '22:00–06:00' },
  off:       { label: 'Day Off',   color: 'bg-white/5 text-white/30 border-white/10',             time: '' },
};

export default function ShiftCalendar() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ staff_id: '', staff_name: '', shift_date: '', shift_type: 'morning', notes: '' });

  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => base44.entities.Staff.list() });
  const { data: shifts = [] } = useQuery({ queryKey: ['shifts'], queryFn: () => base44.entities.Shift.list() });
  const { data: leaves = [] } = useQuery({ queryKey: ['leaves'], queryFn: () => base44.entities.LeaveRequest.filter({ status: 'approved' }) });

  const saveShift = useMutation({
    mutationFn: () => {
      const s = staff.find(m => m.id === form.staff_id);
      return base44.entities.Shift.create({ ...form, staff_name: s?.name || '' });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); setShowForm(false); setForm({ staff_id: '', staff_name: '', shift_date: '', shift_type: 'morning', notes: '' }); },
  });

  const deleteShift = useMutation({
    mutationFn: (id) => base44.entities.Shift.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const getShiftsForDay = (date) => shifts.filter(s => s.shift_date === format(date, 'yyyy-MM-dd'));
  const getLeavesForDay = (date) => leaves.filter(l => l.start_date <= format(date, 'yyyy-MM-dd') && l.end_date >= format(date, 'yyyy-MM-dd'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMonth(subMonths(month, 1))} className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
          <h3 className="text-white font-semibold text-lg">{format(month, 'MMMM yyyy')}</h3>
          <button onClick={() => setMonth(addMonths(month, 1))} className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> Add Shift
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(SHIFT_CONFIG).map(([k, v]) => (
          <span key={k} className={`text-xs px-2 py-1 rounded-full border ${v.color}`}>{v.label}{v.time ? ` (${v.time})` : ''}</span>
        ))}
        <span className="text-xs px-2 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">On Leave</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-center text-white/30 text-xs py-2 font-medium">{d}</div>
        ))}
        {/* Empty cells for first week */}
        {Array(days[0].getDay()).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const dayShifts = getShiftsForDay(day);
          const dayLeaves = getLeavesForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className={`min-h-[80px] rounded-xl border p-1.5 ${isToday ? 'border-[#c9a962]/40 bg-[#c9a962]/5' : 'border-white/5 bg-[#1a1a1a]'}`}>
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-[#c9a962]' : 'text-white/50'}`}>{format(day, 'd')}</div>
              <div className="space-y-0.5">
                {dayShifts.slice(0, 3).map(shift => {
                  const cfg = SHIFT_CONFIG[shift.shift_type] || SHIFT_CONFIG.morning;
                  return (
                    <div key={shift.id} className={`text-[9px] px-1 py-0.5 rounded border truncate flex items-center justify-between gap-1 ${cfg.color}`}>
                      <span className="truncate">{shift.staff_name?.split(' ')[0]} · {cfg.label}</span>
                      <button onClick={() => deleteShift.mutate(shift.id)} className="opacity-0 hover:opacity-100 group-hover:opacity-100 shrink-0">
                        <X className="w-2 h-2" />
                      </button>
                    </div>
                  );
                })}
                {dayLeaves.map(leave => (
                  <div key={leave.id} className="text-[9px] px-1 py-0.5 rounded border truncate bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {leave.staff_name?.split(' ')[0]} · Leave
                  </div>
                ))}
                {dayShifts.length > 3 && <div className="text-[9px] text-white/30">+{dayShifts.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Shift Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Add Shift</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-1 block">Staff Member</label>
                <select value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Select staff...</option>
                  {staff.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Date</label>
                <Input type="date" value={form.shift_date} onChange={e => setForm(f => ({ ...f, shift_date: e.target.value }))}
                  className="bg-[#111] border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Shift Type</label>
                <select value={form.shift_type} onChange={e => setForm(f => ({ ...f, shift_type: e.target.value }))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  {Object.entries(SHIFT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}{v.time ? ` — ${v.time}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Notes</label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="bg-[#111] border-white/10 text-white" placeholder="Optional..." />
              </div>
              <Button onClick={() => saveShift.mutate()} disabled={!form.staff_id || !form.shift_date || saveShift.isPending}
                className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">
                {saveShift.isPending ? 'Saving...' : 'Save Shift'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Requests Section */}
      <LeaveRequests staff={staff} />
    </div>
  );
}

function LeaveRequests({ staff }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ staff_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });

  const { data: leaves = [] } = useQuery({ queryKey: ['leaves'], queryFn: () => base44.entities.LeaveRequest.list('-created_date', 20) });

  const submit = useMutation({
    mutationFn: () => {
      const s = staff.find(m => m.id === form.staff_id);
      const days = Math.max(1, Math.ceil((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1);
      return base44.entities.LeaveRequest.create({ ...form, staff_name: s?.name || '', days });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leaves'] }); setShowForm(false); },
  });

  const review = useMutation({
    mutationFn: ({ id, status }) => base44.entities.LeaveRequest.update(id, { status, reviewed_at: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
  });

  const LEAVE_COLORS = { pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20', approved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', rejected: 'text-red-400 bg-red-500/10 border-red-500/20' };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-medium">Leave Requests</h4>
        <Button onClick={() => setShowForm(true)} size="sm" variant="outline" className="border-white/10 text-white/60">
          <Plus className="w-3 h-3 mr-1" /> Request Leave
        </Button>
      </div>
      <div className="space-y-2">
        {leaves.map(l => (
          <div key={l.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-white text-sm font-medium">{l.staff_name}</div>
              <div className="text-white/40 text-xs">{l.leave_type?.replace('_',' ')} · {l.start_date} → {l.end_date} ({l.days}d)</div>
              {l.reason && <div className="text-white/30 text-xs mt-0.5">"{l.reason}"</div>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-1 rounded-full border capitalize ${LEAVE_COLORS[l.status]}`}>{l.status}</span>
              {l.status === 'pending' && (
                <>
                  <button onClick={() => review.mutate({ id: l.id, status: 'approved' })}
                    className="text-xs px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30">Approve</button>
                  <button onClick={() => review.mutate({ id: l.id, status: 'rejected' })}
                    className="text-xs px-2 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30">Reject</button>
                </>
              )}
            </div>
          </div>
        ))}
        {leaves.length === 0 && <div className="text-center py-6 text-white/30 text-sm">No leave requests</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Request Leave</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-1 block">Staff Member</label>
                <select value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Select...</option>
                  {staff.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Leave Type</label>
                <select value={form.leave_type} onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  {['annual','sick','emergency','maternity','unpaid'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Start Date</label>
                  <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="bg-[#111] border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">End Date</label>
                  <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="bg-[#111] border-white/10 text-white" />
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Reason</label>
                <Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="bg-[#111] border-white/10 text-white" />
              </div>
              <Button onClick={() => submit.mutate()} disabled={!form.staff_id || !form.start_date || !form.end_date || submit.isPending}
                className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">Submit Request</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}