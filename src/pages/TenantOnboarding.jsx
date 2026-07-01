import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { BUSINESS_TYPES, ONBOARDING_STEPS } from '@/components/onboarding/onboardingConfig';

import WelcomeStep from '@/components/onboarding/WelcomeStep';
import BusinessTypeStep from '@/components/onboarding/BusinessTypeStep';
import BusinessInfoStep from '@/components/onboarding/BusinessInfoStep';
import BranchesStep from '@/components/onboarding/BranchesStep';
import PlanStep from '@/components/onboarding/PlanStep';
import TeamStep from '@/components/onboarding/TeamStep';
import ModulesStep from '@/components/onboarding/ModulesStep';
import ImportStep from '@/components/onboarding/ImportStep';
import AISetupStep from '@/components/onboarding/AISetupStep';
import FinishStep from '@/components/onboarding/FinishStep';

export default function TenantOnboarding() {
  const navigate = useNavigate();
const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [data, setData] = useState({
    org_name: '',
    industry: 'restaurant',
    business_email: '',
    contact_phone: '',
    country: 'Kenya',
    city: '',
    address: '',
    timezone: 'Africa/Nairobi',
    currency: 'KES',
    logo_url: '',
    hasMultipleBranches: false,
    branches: [{ name: '', city: '', address: '' }],
    plan: 'starter',
    team_invites: [],
    enabled_modules: [],
    ai_modules: [],
    imports: {},
  });

  const update = (patch) => setData(d => ({ ...d, ...patch }));

  useEffect(() => {
    const checkUser = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me?.role === 'platform_admin') { navigate('/SuperAdmin'); return; }
        if (me?.data?.organization_id || me?.organization_id) { navigate('/Admin'); return; }
      } catch {
        base44.auth.redirectToLogin('/onboarding');
      } finally {
        setChecking(false);
      }
    };
    checkUser();
  }, []);

  // Auto-select modules whenever the business type changes
  useEffect(() => {
    const businessType = BUSINESS_TYPES.find(t => t.value === data.industry);
    if (businessType) {
      update({ enabled_modules: businessType.modules });
    }
  }, [data.industry]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('onboardTenant', {
        org_name: data.org_name,
        industry: data.industry,
        plan: data.plan === 'trial' ? 'starter' : data.plan,
        business_email: data.business_email || user?.email,
        contact_phone: data.contact_phone,
        country: data.country,
        city: data.city,
        address: data.address,
        timezone: data.timezone,
        currency: data.currency,
        logo_url: data.logo_url,
        branches: data.branches.filter(b => b.name.trim()),
        enabled_modules: data.enabled_modules,
        ai_modules: data.ai_modules,
        team_invites: data.team_invites.filter(i => i.email.trim()),
      });
      if (response.data?.success) {
        const orgId = response.data.organization.id;
        const branchId = response.data.branches[0].id;

        // Persist organization_id on the auth user profile so me() returns it after reload
        let verified = false;
        try {
          await base44.auth.updateMe({ organization_id: orgId, branch_id: branchId });
          // Verify the data actually persisted before redirecting
          const freshMe = await base44.auth.me();
          verified = !!(freshMe?.data?.organization_id || freshMe?.organization_id);
        } catch (updateErr) {
          console.error('updateMe failed:', updateErr);
        }

        if (!verified) {
          // Retry once — the backend already updated the User entity, but the auth token may need a refresh
          try {
            await base44.auth.updateMe({ organization_id: orgId, branch_id: branchId });
            const retryMe = await base44.auth.me();
            verified = !!(retryMe?.data?.organization_id || retryMe?.organization_id);
          } catch (retryErr) {
            console.error('updateMe retry failed:', retryErr);
          }
        }

        setLoading(false);

        if (verified) {
          // Hard redirect so the app fully reinitializes with fresh user data
          setTimeout(() => { window.location.href = '/Admin'; }, 2500);
        } else {
          setError('Your workspace was created, but we could not verify your session. Please refresh the page or log in again.');
        }
      } else {
        setError(response.data?.error || 'Something went wrong');
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create your workspace');
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#c9a962] animate-spin" />
      </div>
    );
  }

  const next = () => { setError(''); setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const renderStep = () => {
    switch (step) {
      case 1: return <WelcomeStep onNext={() => setStep(2)} />;
      case 2: return <BusinessTypeStep data={data} update={update} onNext={next} onBack={back} />;
      case 3: return <BusinessInfoStep data={data} update={update} onNext={next} onBack={back} />;
      case 4: return <BranchesStep data={data} update={update} onNext={next} onBack={back} />;
      case 5: return <PlanStep data={data} update={update} onNext={next} onBack={back} />;
      case 6: return <TeamStep data={data} update={update} onNext={next} onBack={back} />;
      case 7: return <ModulesStep data={data} update={update} onNext={next} onBack={back} />;
      case 8: return <ImportStep data={data} update={update} onNext={next} onBack={back} />;
      case 9: return <AISetupStep data={data} update={update} onNext={() => { setStep(10); handleSubmit(); }} onBack={back} />;
      case 10: return <FinishStep loading={loading} error={error} onComplete={() => { setError(''); setStep(9); }} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <style>{`
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .gold-gradient {
          background: linear-gradient(135deg, #c9a962 0%, #e4d5a7 50%, #c9a962 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .luxury-border { border: 1px solid rgba(201,169,98,0.3); }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-[#c9a962]/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a962] to-[#e4d5a7] flex items-center justify-center">
            <span className="font-playfair text-lg text-[#0a0a0a] font-bold">GO</span>
          </div>
          <span className="font-playfair text-lg gold-gradient">Get OS</span>
        </div>

        {/* Progress dots — hidden on welcome and finish */}
        {step > 1 && step < 10 && (
          <div className="hidden md:flex items-center gap-1.5">
            {ONBOARDING_STEPS.filter(s => s.num > 1 && s.num < 10).map((s) => (
              <div key={s.num} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full transition-all ${step >= s.num ? 'bg-[#c9a962]' : 'bg-white/15'}`} />
                {s.num === step && (
                  <span className="font-inter text-xs text-[#c9a962] ml-1">{s.label}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Mobile step indicator */}
      {step > 1 && step < 10 && (
        <div className="md:hidden px-6 py-3 border-b border-[#c9a962]/10">
          <div className="flex items-center justify-between mb-1">
            <span className="font-inter text-xs text-[#c9a962]">{ONBOARDING_STEPS[step - 1].label}</span>
            <span className="font-inter text-xs text-white/40">Step {step - 1} of 8</span>
          </div>
          <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className="h-full bg-[#c9a962] rounded-full transition-all" style={{ width: `${((step - 1) / 8) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <div key={step}>{renderStep()}</div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}