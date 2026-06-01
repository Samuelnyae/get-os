import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, CheckCircle, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const TASK_COLORS = {
  pending:     'bg-amber-500/20 text-amber-400 border-amber-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  done:        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  skipped:     'bg-red-500/20 text-red-400 border-red-500/30',
};

const PRIORITY_BADGE = {
  low:    'bg-white/10 text-white/40',
  normal: 'bg-blue-500/10 text-blue-400',
  urgent: 'bg-red-500/20 text-red-400',
};

export default function HousekeepingBoard() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({
    room_number: '', task_type: 'cleaning', priority: 'normal',
    assigned_to: '', notes: '', scheduled_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['hk-tasks'],
    queryFn: () => base44.entities.HousekeepingTask.list('-created_date', 100),
  });
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => base44.entities.Room.list() });

  const createTask = useMutation({
    mutationFn: (data) => {
      const room = rooms.find(r => r.room_number === data.room_number);
      return base44.entities.HousekeepingTask.create({ ...data, room_id: room?.id || '' });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hk-tasks'] }); setShowForm(false); },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, status }) => base44.entities.HousekeepingTask.update(id, {
      status,
      ...(status === 'done' ? { completed_at: new Date().toISOString() } : {}),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hk-tasks'] }),
  });

  const filtered = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

  const counts = { pending: 0, in_progress: 0, done: 0, skipped: 0 };
  tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[['all','All',tasks.length,'text-white/60'],['pending','Pending',counts.pending,'text-amber-400'],
          ['in_progress','Active',counts.in_progress,'text-blue-400'],['done','Done',counts.done,'text-emerald-400']].map(([s,l,c,color]) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`bg-[#1a1a1a] rounded-xl border p-3 text-left transition-all ${filterStatus===s?'border-[#c9a962]/40':'border-white/10'}`}>
            <div className={`text-2xl font-bold ${color}`}>{c}</div>
            <div className="text-xs text-white/40 mt-1">{l}</div>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium">Tasks ({filtered.length})</h3>
        <Button onClick={() => setShowForm(true)} size="sm" className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> Add Task
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.map(task => (
          <div key={task.id} className={`rounded-xl border p-4 flex items-center gap-4 ${TASK_COLORS[task.status] || TASK_COLORS.pending}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-medium">Room #{task.room_number}</span>
                <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-black/20">{task.task_type.replace(/_/g,' ')}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
              </div>
              {task.assigned_to && <div className="text-xs opacity-70 mt-1">👤 {task.assigned_to}</div>}
              {task.notes && <div className="text-xs opacity-60 mt-1">{task.notes}</div>}
              <div className="text-xs opacity-50 mt-1">{task.scheduled_date}</div>
            </div>
            <div className="flex flex-col gap-1">
              {task.status === 'pending' && (
                <button onClick={() => updateTask.mutate({ id: task.id, status: 'in_progress' })}
                  className="text-xs px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30">
                  Start
                </button>
              )}
              {task.status === 'in_progress' && (
                <button onClick={() => updateTask.mutate({ id: task.id, status: 'done' })}
                  className="text-xs px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30">
                  Done ✓
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No tasks</p>
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold">New Housekeeping Task</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-1 block">Room Number</label>
                <select value={form.room_number} onChange={e => setForm(f=>({...f,room_number:e.target.value}))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Select room</option>
                  {rooms.map(r => <option key={r.id} value={r.room_number}>#{r.room_number} ({r.status})</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Task Type</label>
                <select value={form.task_type} onChange={e => setForm(f=>({...f,task_type:e.target.value}))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  {['cleaning','turndown','deep_clean','maintenance','minibar_restock','linen_change','inspection'].map(t => (
                    <option key={t} value={t}>{t.replace(/_/g,' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Priority</label>
                <select value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value}))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="low">Low</option><option value="normal">Normal</option><option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Assigned To</label>
                <Input value={form.assigned_to} onChange={e => setForm(f=>({...f,assigned_to:e.target.value}))}
                  className="bg-[#111] border-white/10 text-white" placeholder="Staff name" />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Scheduled Date</label>
                <Input type="date" value={form.scheduled_date} onChange={e => setForm(f=>({...f,scheduled_date:e.target.value}))}
                  className="bg-[#111] border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}
                  rows={2} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              </div>
              <Button onClick={() => createTask.mutate(form)} disabled={!form.room_number}
                className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">Create Task</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}