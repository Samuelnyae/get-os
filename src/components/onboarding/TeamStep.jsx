import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Plus, Trash2, Mail } from 'lucide-react';
import { STAFF_ROLES } from './onboardingConfig';

export default function TeamStep({ data, update, onNext, onBack }) {
  const addInvite = () => {
    update({ team_invites: [...data.team_invites, { email: '', role: 'manager' }] });
  };

  const updateInvite = (idx, field, value) => {
    const invites = [...data.team_invites];
    invites[idx] = { ...invites[idx], [field]: value };
    update({ team_invites: invites });
  };

  const removeInvite = (idx) => {
    update({ team_invites: data.team_invites.filter((_, i) => i !== idx) });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h1 className="font-playfair text-3xl gold-gradient mb-2">Invite Your Team</h1>
      <p className="font-inter text-sm text-white/50 mb-8">Add staff members now or skip to do it later.</p>

      <div className="space-y-3 mb-4">
        {data.team_invites.map((invite, idx) => (
          <div key={idx} className="luxury-border rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex items-center gap-2 flex-1">
              <Mail className="w-4 h-4 text-[#c9a962] shrink-0" />
              <input type="email" value={invite.email} onChange={(e) => updateInvite(idx, 'email', e.target.value)}
                placeholder="email@business.com"
                className="w-full bg-transparent font-inter text-sm text-white placeholder:text-white/20 focus:outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <select value={invite.role} onChange={(e) => updateInvite(idx, 'role', e.target.value)}
                className="bg-[#0a0a0a] luxury-border rounded-lg px-3 py-2 font-inter text-sm text-white focus:outline-none focus:border-[#c9a962]">
                {STAFF_ROLES.map(r => <option key={r.value} value={r.value} className="bg-[#1a1a1a]">{r.icon} {r.label}</option>)}
              </select>
              <button onClick={() => removeInvite(idx)} className="text-white/40 hover:text-red-400 transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addInvite} className="w-full luxury-border rounded-lg py-3 font-inter text-sm text-white/60 hover:text-[#c9a962] flex items-center justify-center gap-2 transition-colors">
        <Plus className="w-4 h-4" /> Add Another Member
      </button>

      <div className="flex gap-3 mt-8">
        <button onClick={onBack} className="px-5 py-3 luxury-border rounded-lg font-inter text-white/60 hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} className="flex-1 bg-[#c9a962] text-[#0a0a0a] font-inter font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#e4d5a7] transition-colors">
          {data.team_invites.length > 0 ? 'Continue' : 'Skip for now'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}