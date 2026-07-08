import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Building2, Users, Ban, CheckCircle2, Settings, X, Save, ExternalLink, Mail, Phone } from 'lucide-react';

const PLAN_FEATURES = ['pos', 'hotel', 'crm', 'inventory', 'ai', 'spa', 'driver', 'reservations', 'staff', 'kds', 'hr', 'multibranch', 'api', 'white_label'];
const PLANS = ['starter', 'professional', 'enterprise'];

export default function OrganizationDetail({ org, onClose }) {
  const qc = useQueryClient();
  const [showFeatures, setShowFeatures] = useState(false);
  const [features, setFeatures] = useState(org.features || {});

  const { data: branches = [] } = useQuery({
    queryKey: ['org_branches', org.id],
    queryFn: () => base44.entities.Hotel.filter({ organization_id: org.id }, '-created_date', 50),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['org_users', org.id],
    queryFn: () => base44.entities.User.filter({ organization_id: org.id }, '-created_date', 50),
  });

  const updateOrg = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Organization.update(id, data),
    onSuccess: () => qc.invalidateQueries(['organizations']),
  });

  const toggleStatus = () => {
    const newStatus = org.status === 'suspended' ? 'active' : 'suspended';
    updateOrg.mutate({ id: org.id, data: { status: newStatus, suspended_at: newStatus === 'suspended' ? new Date().toISOString() : null } });
  };

  const changePlan = (plan) => updateOrg.mutate({ id: org.id, data: { plan } });

  const saveFeatures = () => {
    updateOrg.mutate({ id: org.id, data: { features } }, { onSuccess: () => setShowFeatures(false) });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      className="bg-[#1a1a1a] border border-[#c9a962]/20 rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#c9a962]/20 flex items-center justify-center"><Building2 className="w-6 h-6 text-[#c9a962]" /></div>
          <div>
            <h3 className="font-playfair text-xl text-white">{org.name}</h3>
            <p className="font-inter text-xs text-white/40">{org.industry} · {org.slug}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Plan', value: org.plan },
          { label: 'Status', value: org.status },
          { label: 'Branches', value: branches.length },
          { label: 'Users', value: users.length },
          { label: 'MRR', value: `KSh ${(org.mrr || 0).toLocaleString()}` },
          { label: 'Max Branches', value: org.max_branches },
          { label: 'Owner', value: org.owner_email || '—' },
          { label: 'Country', value: org.country || '—' },
        ].map((s, i) => (
          <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3">
            <p className="font-inter text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
            <p className="font-inter text-sm text-white mt-0.5 capitalize">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Open links */}
      <div className="flex flex-wrap gap-2">
        <a href={`${window.location.origin}/?org=${org.slug}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-inter text-sm font-semibold bg-[#c9a962] text-[#0a0a0a]">
          <ExternalLink className="w-4 h-4" /> Open Portal
        </a>
        {org.owner_email && (
          <a href={`mailto:${org.owner_email}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-inter text-sm bg-white/5 text-white/70 border border-white/10">
            <Mail className="w-4 h-4" /> Email Owner
          </a>
        )}
        {org.contact_phone && (
          <a href={`tel:${org.contact_phone}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-inter text-sm bg-white/5 text-white/70 border border-white/10">
            <Phone className="w-4 h-4" /> Call
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={toggleStatus} disabled={updateOrg.isPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-inter text-sm font-semibold ${org.status === 'suspended' ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
          {org.status === 'suspended' ? <><CheckCircle2 className="w-4 h-4" /> Activate</> : <><Ban className="w-4 h-4" /> Suspend</>}
        </button>
        <button onClick={() => setShowFeatures(!showFeatures)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-inter text-sm bg-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/20">
          <Settings className="w-4 h-4" /> Feature Flags
        </button>
      </div>

      {/* Plan selector */}
      <div className="flex gap-2">
        {PLANS.map(p => (
          <button key={p} onClick={() => changePlan(p)} disabled={updateOrg.isPending}
            className={`px-3 py-1.5 rounded-lg font-inter text-xs capitalize ${org.plan === p ? 'bg-[#c9a962] text-[#0a0a0a] font-semibold' : 'bg-white/5 text-white/60'}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Feature flags */}
      {showFeatures && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="font-inter text-xs text-white/50">Toggle features for this tenant</p>
            <button onClick={saveFeatures} disabled={updateOrg.isPending}
              className="flex items-center gap-1 px-3 py-1 bg-[#c9a962] text-[#0a0a0a] rounded-lg font-inter text-xs font-semibold"><Save className="w-3 h-3" /> Save</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PLAN_FEATURES.map(f => (
              <label key={f} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={features[f] || false} onChange={e => setFeatures(p => ({ ...p, [f]: e.target.checked }))}
                  className="accent-[#c9a962]" />
                <span className="font-inter text-xs text-white/70 capitalize">{f.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Branches */}
      <div>
        <p className="font-inter text-xs text-white/50 uppercase tracking-wider mb-2">Branches</p>
        <div className="space-y-1.5">
          {branches.map(b => (
            <div key={b.id} className="flex items-center justify-between bg-[#0a0a0a] border border-white/5 rounded-lg px-3 py-2">
              <div>
                <p className="font-inter text-sm text-white">{b.name}</p>
                <p className="font-inter text-[10px] text-white/40">{b.location} · {b.branch_type}</p>
              </div>
              <span className={`font-inter text-[10px] px-2 py-0.5 rounded-full ${b.is_active ? 'text-green-400 bg-green-400/10' : 'text-white/30 bg-white/5'}`}>{b.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          ))}
          {branches.length === 0 && <p className="font-inter text-xs text-white/30">No branches yet.</p>}
        </div>
      </div>

      {/* Users */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-3 h-3 text-white/50" />
          <p className="font-inter text-xs text-white/50 uppercase tracking-wider">Users</p>
        </div>
        <div className="space-y-1.5">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between bg-[#0a0a0a] border border-white/5 rounded-lg px-3 py-2">
              <div>
                <p className="font-inter text-sm text-white">{u.full_name || u.email}</p>
                <p className="font-inter text-[10px] text-white/40">{u.email}</p>
              </div>
              <span className="font-inter text-[10px] px-2 py-0.5 rounded-full bg-[#c9a962]/10 text-[#c9a962]">{u.role}</span>
            </div>
          ))}
          {users.length === 0 && <p className="font-inter text-xs text-white/30">No users yet.</p>}
        </div>
      </div>
    </motion.div>
  );
}