import React, { useState } from 'react';
import { Search, Building2, ChevronRight, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_BADGE = {
  trial: { label: 'Trial', cls: 'text-blue-400 bg-blue-400/10' },
  active: { label: 'Active', cls: 'text-green-400 bg-green-400/10' },
  suspended: { label: 'Suspended', cls: 'text-red-400 bg-red-400/10' },
  cancelled: { label: 'Cancelled', cls: 'text-white/30 bg-white/5' },
};
const PLAN_BADGE = {
  starter: 'text-orange-400 bg-orange-400/10',
  professional: 'text-purple-400 bg-purple-400/10',
  enterprise: 'text-[#c9a962] bg-[#c9a962]/10',
};

export default function OrganizationList({ orgs, onSelect, selectedId }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = orgs.filter(o => {
    const matchSearch = o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.slug?.toLowerCase().includes(search.toLowerCase()) ||
      o.owner_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#c9a962]/10 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants..."
            className="bg-transparent text-white font-inter text-sm outline-none flex-1 placeholder:text-white/30" />
        </div>
        <div className="flex gap-2">
          {['all', 'trial', 'active', 'suspended', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg font-inter text-xs capitalize transition-all ${statusFilter === s ? 'bg-[#c9a962] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map(o => (
          <motion.button key={o.id} layout onClick={() => onSelect(o)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${selectedId === o.id ? 'bg-[#c9a962]/10 border-[#c9a962]/40' : 'bg-[#1a1a1a] border-[#c9a962]/10 hover:border-[#c9a962]/30'}`}>
            <div className="w-10 h-10 rounded-lg bg-[#c9a962]/20 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[#c9a962]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-inter text-white font-semibold text-sm">{o.name}</p>
              <p className="font-inter text-xs text-white/40 truncate">{o.owner_email || o.slug} · {o.industry}</p>
            </div>
            <span className={`font-inter text-[10px] px-2 py-0.5 rounded-full ${PLAN_BADGE[o.plan]}`}>{o.plan}</span>
            <span className={`font-inter text-[10px] px-2 py-0.5 rounded-full ${STATUS_BADGE[o.status]?.cls}`}>{STATUS_BADGE[o.status]?.label}</span>
            <a href={`${window.location.origin}/?org=${o.slug}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#c9a962]/10 text-[#c9a962] hover:bg-[#c9a962]/20 transition-all">
              <ExternalLink className="w-3 h-3" /> Open
            </a>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </motion.button>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Building2 className="w-10 h-10 text-white/10 mx-auto mb-2" />
            <p className="font-inter text-white/30 text-sm">No tenants found.</p>
          </div>
        )}
      </div>
    </div>
  );
}