import React from 'react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, Clock, Ban, TrendingUp, Users } from 'lucide-react';

export default function OrgStats({ orgs }) {
  const total = orgs.length;
  const active = orgs.filter(o => o.status === 'active').length;
  const trial = orgs.filter(o => o.status === 'trial').length;
  const suspended = orgs.filter(o => o.status === 'suspended').length;
  const totalMRR = orgs.reduce((s, o) => s + (o.mrr || 0), 0);

  const cards = [
    { label: 'Total Tenants', value: total, icon: Building2, color: 'text-[#c9a962]' },
    { label: 'Active', value: active, icon: CheckCircle2, color: 'text-green-400' },
    { label: 'On Trial', value: trial, icon: Clock, color: 'text-blue-400' },
    { label: 'Suspended', value: suspended, icon: Ban, color: 'text-red-400' },
    { label: 'Monthly Recurring Revenue', value: `KSh ${totalMRR.toLocaleString()}`, icon: TrendingUp, color: 'text-green-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-xl p-4">
          <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
          <p className="font-playfair text-xl md:text-2xl text-white">{s.value}</p>
          <p className="font-inter text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}