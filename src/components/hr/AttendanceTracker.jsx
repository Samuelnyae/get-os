import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, AlertTriangle, LogIn, LogOut, Calendar } from 'lucide-react';

const STATUS_CONFIG = {
  present:   { label: 'Present',   color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  absent:    { label: 'Absent',    color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  late:      { label: 'Late',      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  half_day:  { label: 'Half Day',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  on_leave:  { label: 'On Leave',  color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

const today = new Date().toISOString().split('T')[0];

export default function AttendanceTracker() {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => base44.entities.Staff.list() });
  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: () => base44.entities.StaffAttendance.filter({ date: selectedDate }),
  });

  const upsert = useMutation({
    mutationFn: async ({ staffMember, field, value }) => {
      const existing = attendance.find(a => a.staff_id === staffMember.id);
      const now = new Date().toISOString();
      if (existing) {
        const update = { [field]: value };
        if (field === 'clock_out' && existing.clock_in) {
          const mins = (new Date(value) - new Date(existing.clock_in)) / 60000;
          update.hours_worked = Math.round((mins / 60) * 10) / 10;
        }
        return base44.entities.StaffAttendance.update(existing.id, update);
      } else {
        return base44.entities.StaffAttendance.create({
          staff_id: staffMember.id, staff_name: staffMember.name,
          date: selectedDate, [field]: value,
          status: field === 'status' ? value : 'present',
          clock_in: field === 'clock_in' ? value : null,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance', selectedDate] }),
  });

  const getRecord = (staffId) => attendance.find(a => a.staff_id === staffId);

  const stats = {
    present: attendance.filter(a => a.status === 'present' || a.status === 'late').length,
    absent: staff.length - attendance.length,
    late: attendance.filter(a => a.status === 'late').length,
    onLeave: attendance.filter(a => a.status === 'on_leave').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Attendance Tracker</h3>
          <p className="text-white/40 text-sm">{staff.length} staff members</p>
        </div>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-white text-sm" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Present', value: stats.present, color: 'text-emerald-400' },
          { label: 'Absent', value: stats.absent, color: 'text-red-400' },
          { label: 'Late', value: stats.late, color: 'text-amber-400' },
          { label: 'On Leave', value: stats.onLeave, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-white/40 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Staff Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Staff', 'Role', 'Status', 'Clock In', 'Clock Out', 'Hours'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-white/40 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map(member => {
              const rec = getRecord(member.id);
              return (
                <tr key={member.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{member.name}</div>
                  </td>
                  <td className="px-4 py-3 text-white/50 capitalize text-xs">{member.role?.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <select
                      value={rec?.status || ''}
                      onChange={e => upsert.mutate({ staffMember: member, field: 'status', value: e.target.value })}
                      className="bg-[#111] border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70"
                    >
                      <option value="">— Mark —</option>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {rec?.clock_in ? (
                      <span className="text-emerald-400 text-xs">{new Date(rec.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    ) : (
                      <button onClick={() => upsert.mutate({ staffMember: member, field: 'clock_in', value: new Date().toISOString() })}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-white/10 text-white/40 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                        <LogIn className="w-3 h-3" /> In
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {rec?.clock_out ? (
                      <span className="text-red-400 text-xs">{new Date(rec.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    ) : rec?.clock_in ? (
                      <button onClick={() => upsert.mutate({ staffMember: member, field: 'clock_out', value: new Date().toISOString() })}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                        <LogOut className="w-3 h-3" /> Out
                      </button>
                    ) : <span className="text-white/20 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#c9a962] text-xs">
                    {rec?.hours_worked ? `${rec.hours_worked}h` : '—'}
                  </td>
                </tr>
              );
            })}
            {staff.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-white/30 text-sm">No staff found. Add staff in the Staff Manager.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}