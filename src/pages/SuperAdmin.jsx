import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Shield, Building2, Loader2 } from 'lucide-react';
import OrgStats from '@/components/superadmin/OrgStats';
import OrganizationList from '@/components/superadmin/OrganizationList';
import OrganizationDetail from '@/components/superadmin/OrganizationDetail';

export default function SuperAdmin() {
  const [selectedOrg, setSelectedOrg] = useState(null);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: orgs = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list('-created_date', 200),
  });

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#c9a962] animate-spin" />
      </div>
    );
  }

  const isPlatformAdmin = user?.role === 'platform_admin';

  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400/50 mx-auto mb-4" />
          <h2 className="font-playfair text-2xl text-white mb-2">Access Restricted</h2>
          <p className="font-inter text-sm text-white/50">This area is for platform administrators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .gold-gradient { background: linear-gradient(135deg, #c9a962 0%, #e4d5a7 50%, #c9a962 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#c9a962]/10 border border-[#c9a962]/20 mb-4">
            <Shield className="w-4 h-4 text-[#c9a962]" />
            <span className="font-inter text-xs tracking-wider text-[#c9a962] uppercase">Super Admin Portal</span>
          </div>
          <h1 className="font-playfair text-3xl md:text-4xl gold-gradient mb-2">Hospitality OS — Platform Control</h1>
          <p className="font-inter text-white/50 text-sm max-w-2xl">Manage all tenants, subscriptions, feature flags, and platform analytics from a single command center.</p>
        </motion.div>

        {/* Stats */}
        <div className="mb-8">
          <OrgStats orgs={orgs} />
        </div>

        {/* Main grid: list + detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-[#c9a962]" />
              <h2 className="font-inter text-white font-semibold">Tenants</h2>
              <span className="font-inter text-xs text-white/40">({orgs.length})</span>
            </div>
            {loadingOrgs ? (
              <div className="py-12 text-center"><Loader2 className="w-6 h-6 text-white/30 animate-spin mx-auto" /></div>
            ) : (
              <OrganizationList orgs={orgs} onSelect={setSelectedOrg} selectedId={selectedOrg?.id} />
            )}
          </div>
          <div>
            {selectedOrg ? (
              <OrganizationDetail org={selectedOrg} onClose={() => setSelectedOrg(null)} />
            ) : (
              <div className="bg-[#1a1a1a] border border-[#c9a962]/10 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
                <Building2 className="w-10 h-10 text-white/10 mb-3" />
                <p className="font-inter text-white/30 text-sm">Select a tenant to view details, manage plans, and toggle features.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}