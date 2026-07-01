import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Store, Rocket, Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

const INDUSTRIES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'cafe', label: 'Café' },
  { value: 'bar', label: 'Bar' },
  { value: 'resort', label: 'Resort' },
  { value: 'lodge', label: 'Lodge' },
  { value: 'fast_food', label: 'Fast Food' },
  { value: 'coffee_shop', label: 'Coffee Shop' },
  { value: 'catering', label: 'Catering' },
  { value: 'bakery', label: 'Bakery' },
];

const PLANS = [
  { value: 'starter', label: 'Starter', price: 'KES 2,500/mo', desc: '1 branch, core operations', branches: 1 },
  { value: 'professional', label: 'Professional', price: 'KES 7,500/mo', desc: '10 branches, AI + integrations', branches: 10 },
  { value: 'enterprise', label: 'Enterprise', price: 'Custom', desc: 'Unlimited, white-label, SLA', branches: 50 },
];

export default function TenantOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [orgData, setOrgData] = useState({ org_name: '', industry: 'restaurant', plan: 'starter' });
  const [hotelData, setHotelData] = useState({ hotel_name: '', hotel_location: '', hotel_phone: '', hotel_email: '' });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me?.data?.organization_id) {
          navigate('/');
        }
      } catch {
        base44.auth.redirectToLogin('/onboarding');
      } finally {
        setChecking(false);
      }
    };
    checkUser();
  }, []);

  const handleNext = () => {
    setError('');
    if (step === 1 && !orgData.org_name.trim()) {
      setError('Please enter your business name');
      return;
    }
    if (step === 2 && (!hotelData.hotel_name.trim() || !hotelData.hotel_location.trim())) {
      setError('Hotel name and location are required');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('onboardTenant', {
        ...orgData,
        ...hotelData,
        hotel_email: hotelData.hotel_email || user?.email
      });
      if (response.data?.success) {
        // Refresh the cached user session so me() returns the new organization_id
        await base44.auth.updateMe({
          organization_id: response.data.organization.id,
          branch_id: response.data.hotel.id
        });
        setStep(4);
      } else {
        setError(response.data?.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create your organization');
    } finally {
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

  const steps = [
    { num: 1, label: 'Business', icon: Building2 },
    { num: 2, label: 'First Branch', icon: Store },
    { num: 3, label: 'Launch', icon: Rocket },
  ];

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
        {step < 4 && (
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-inter transition-all ${
                  step >= s.num ? 'bg-[#c9a962]/15 text-[#c9a962]' : 'text-white/30'
                }`}>
                  <s.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && <div className={`w-4 h-px ${step > s.num ? 'bg-[#c9a962]' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {/* Step 1: Business Details */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-playfair text-3xl gold-gradient mb-2">Welcome to Get OS</h1>
                <p className="font-inter text-sm text-white/50 mb-8">Let's set up your business. You can add more branches later.</p>

                <div className="space-y-5">
                  <div>
                    <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Business Name</label>
                    <input
                      type="text" value={orgData.org_name} onChange={(e) => setOrgData({ ...orgData, org_name: e.target.value })}
                      placeholder="e.g. Hermanas Group"
                      className="w-full bg-transparent luxury-border rounded-lg px-4 py-3 font-inter text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a962] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Industry</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {INDUSTRIES.map((ind) => (
                        <button key={ind.value} onClick={() => setOrgData({ ...orgData, industry: ind.value })}
                          className={`px-3 py-2.5 rounded-lg text-xs font-inter transition-all ${
                            orgData.industry === ind.value ? 'bg-[#c9a962] text-[#0a0a0a] font-medium' : 'luxury-border text-white/60 hover:text-[#c9a962]'
                          }`}>
                          {ind.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Choose Your Plan</label>
                    <div className="space-y-2">
                      {PLANS.map((p) => (
                        <button key={p.value} onClick={() => setOrgData({ ...orgData, plan: p.value })}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                            orgData.plan === p.value ? 'bg-[#c9a962]/10 luxury-border border-[#c9a962]' : 'luxury-border hover:bg-white/5'
                          }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-inter text-sm text-white font-medium">{p.label}</span>
                              <span className="font-inter text-xs text-white/40 ml-2">{p.desc}</span>
                            </div>
                            <span className="font-inter text-xs text-[#c9a962]">{p.price}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="font-inter text-xs text-white/30 mt-2">14-day free trial — no card required.</p>
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm font-inter mt-4">{error}</p>}

                <button onClick={handleNext} className="w-full mt-8 bg-[#c9a962] text-[#0a0a0a] font-inter font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#e4d5a7] transition-colors">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2: First Branch */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-playfair text-3xl gold-gradient mb-2">Your First Branch</h1>
                <p className="font-inter text-sm text-white/50 mb-8">Set up your primary location — your headquarters.</p>

                <div className="space-y-5">
                  <div>
                    <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Branch Name</label>
                    <input type="text" value={hotelData.hotel_name} onChange={(e) => setHotelData({ ...hotelData, hotel_name: e.target.value })}
                      placeholder="e.g. Hermanas Westlands"
                      className="w-full bg-transparent luxury-border rounded-lg px-4 py-3 font-inter text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a962] transition-colors" />
                  </div>
                  <div>
                    <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Location</label>
                    <input type="text" value={hotelData.hotel_location} onChange={(e) => setHotelData({ ...hotelData, hotel_location: e.target.value })}
                      placeholder="e.g. Westlands, Nairobi"
                      className="w-full bg-transparent luxury-border rounded-lg px-4 py-3 font-inter text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a962] transition-colors" />
                  </div>
                  <div>
                    <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Phone (optional)</label>
                    <input type="tel" value={hotelData.hotel_phone} onChange={(e) => setHotelData({ ...hotelData, hotel_phone: e.target.value })}
                      placeholder="+254 700 000 000"
                      className="w-full bg-transparent luxury-border rounded-lg px-4 py-3 font-inter text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a962] transition-colors" />
                  </div>
                  <div>
                    <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Email (optional)</label>
                    <input type="email" value={hotelData.hotel_email} onChange={(e) => setHotelData({ ...hotelData, hotel_email: e.target.value })}
                      placeholder={user?.email || 'branch@yourbusiness.com'}
                      className="w-full bg-transparent luxury-border rounded-lg px-4 py-3 font-inter text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a962] transition-colors" />
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm font-inter mt-4">{error}</p>}

                <div className="flex gap-3 mt-8">
                  <button onClick={() => setStep(1)} className="px-5 py-3 luxury-border rounded-lg font-inter text-white/60 hover:text-white transition-colors flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={handleNext} className="flex-1 bg-[#c9a962] text-[#0a0a0a] font-inter font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#e4d5a7] transition-colors">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-playfair text-3xl gold-gradient mb-2">Review & Launch</h1>
                <p className="font-inter text-sm text-white/50 mb-8">Confirm your details before we create your workspace.</p>

                <div className="space-y-3 mb-8">
                  <div className="luxury-border rounded-lg p-4">
                    <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">Business</p>
                    <p className="font-playfair text-lg text-white">{orgData.org_name}</p>
                    <p className="font-inter text-sm text-white/40">{INDUSTRIES.find(i => i.value === orgData.industry)?.label} · {PLANS.find(p => p.value === orgData.plan)?.label} plan</p>
                  </div>
                  <div className="luxury-border rounded-lg p-4">
                    <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">First Branch</p>
                    <p className="font-playfair text-lg text-white">{hotelData.hotel_name}</p>
                    <p className="font-inter text-sm text-white/40">{hotelData.hotel_location}</p>
                    {hotelData.hotel_phone && <p className="font-inter text-sm text-white/40">{hotelData.hotel_phone}</p>}
                  </div>
                  <div className="luxury-border rounded-lg p-4">
                    <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">Owner</p>
                    <p className="font-inter text-sm text-white">{user?.email}</p>
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm font-inter mb-4">{error}</p>}

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} disabled={loading} className="px-5 py-3 luxury-border rounded-lg font-inter text-white/60 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#c9a962] text-[#0a0a0a] font-inter font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#e4d5a7] transition-colors disabled:opacity-50">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating workspace...</> : <><Rocket className="w-4 h-4" /> Launch Business</>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                  className="w-20 h-20 rounded-full bg-[#c9a962]/15 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-[#c9a962]" />
                </motion.div>
                <h1 className="font-playfair text-3xl gold-gradient mb-2">You're Live!</h1>
                <p className="font-inter text-sm text-white/50 mb-8">Your workspace is ready. Your 14-day trial starts now.</p>
                <button onClick={() => window.location.href = '/Admin'} className="bg-[#c9a962] text-[#0a0a0a] font-inter font-medium px-8 py-3 rounded-lg inline-flex items-center gap-2 hover:bg-[#e4d5a7] transition-colors">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}