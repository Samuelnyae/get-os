import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, XCircle, AlertTriangle, Sparkles, Clock } from 'lucide-react';
import PlanCard from '@/components/billing/PlanCard';

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: 29, tagline: 'For single-location operations',
    featured: false,
    features: ['1 Branch', 'Core POS & Orders', 'Inventory Management', 'QR Code Menu', 'Basic Analytics', 'Email Support'],
  },
  {
    id: 'professional', name: 'Professional', price: 99, tagline: 'For growing multi-branch businesses',
    featured: true,
    features: ['Up to 10 Branches', 'Everything in Starter', 'Supplier Marketplace', 'Marketing Automation', 'Advanced Analytics', 'Integrations Hub', 'Priority Support'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 249, tagline: 'For large-scale hospitality groups',
    featured: false,
    features: ['Unlimited Branches', 'Everything in Professional', 'AI Business Insights', 'API Access', 'Multi-tenant Management', 'Dedicated Account Manager', '24/7 Support'],
  },
];

const STATUS_INFO = {
  trial: { label: 'Trial Period', cls: 'text-orange-400 bg-orange-400/10 border-orange-400/20', icon: Clock },
  active: { label: 'Active', cls: 'text-green-400 bg-green-400/10 border-green-400/20', icon: CheckCircle },
  suspended: { label: 'Suspended', cls: 'text-red-400 bg-red-400/10 border-red-400/20', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', cls: 'text-white/40 bg-white/5 border-white/10', icon: XCircle },
};

export default function Billing() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
      setStatusMsg({ type: 'success', text: 'Subscription activated! Your plan has been updated.' });
    } else if (status === 'cancelled') {
      setStatusMsg({ type: 'error', text: 'Checkout was cancelled. No charge was made.' });
    }
  }, []);

  const { data: org, isLoading } = useQuery({
    queryKey: ['billing_org'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgId = user?.data?.organization_id;
      if (!orgId) return null;
      return await base44.entities.Organization.get(orgId);
    },
  });

  const handleUpgrade = async (planId) => {
    if (isInIframe) {
      setStatusMsg({ type: 'error', text: 'Checkout is only available from the published app. Please open the app in a new tab.' });
      return;
    }
    setLoadingPlan(planId);
    try {
      const res = await base44.functions.invoke('createCheckoutSession', { plan: planId });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to start checkout. Please try again.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.error || 'Checkout failed. Please try again.' });
    } finally {
      setLoadingPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlan = org?.plan || 'starter';
  const orgStatus = org?.status || 'trial';
  const statusInfo = STATUS_INFO[orgStatus];
  const trialEndsAt = org?.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24)) : 0;
  const StatusIcon = statusInfo?.icon;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .gold-gradient { background: linear-gradient(135deg, #c9a962 0%, #e4d5a7 50%, #c9a962 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#c9a962]/10 border border-[#c9a962]/20 mb-4">
            <CreditCard className="w-4 h-4 text-[#c9a962]" />
            <span className="font-inter text-xs tracking-wider text-[#c9a962] uppercase">Billing & Subscription</span>
          </div>
          <h1 className="font-playfair text-4xl md:text-5xl gold-gradient mb-3">Choose Your Plan</h1>
          <p className="font-inter text-white/50 max-w-xl mx-auto text-sm">Scale your hospitality business with the right tools. Upgrade or change your plan anytime.</p>
        </motion.div>

        {/* Status Banner */}
        {org && (
          <div className={`mb-8 p-5 rounded-xl border flex items-center justify-between flex-wrap gap-4 ${statusInfo?.cls}`}>
            <div className="flex items-center gap-3">
              {StatusIcon && <StatusIcon className="w-5 h-5" />}
              <div>
                <p className="font-inter text-sm font-semibold capitalize">{org.name} · {currentPlan} Plan</p>
                <p className="font-inter text-xs opacity-80">
                  {orgStatus === 'trial' && trialEndsAt
                    ? `Trial ends in ${daysLeft > 0 ? daysLeft : 0} day${daysLeft !== 1 ? 's' : ''} — ${trialEndsAt.toLocaleDateString()}`
                    : `Status: ${statusInfo?.label}`}
                </p>
              </div>
            </div>
            {orgStatus === 'trial' && (
              <div className="flex items-center gap-2 font-inter text-xs">
                <Sparkles className="w-4 h-4" />
                Subscribe now to keep your account active after trial
              </div>
            )}
          </div>
        )}

        {/* Status Message */}
        {statusMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mb-6 p-4 rounded-xl border font-inter text-sm ${statusMsg.type === 'success' ? 'bg-green-400/10 border-green-400/20 text-green-400' : 'bg-red-400/10 border-red-400/20 text-red-400'}`}>
            {statusMsg.text}
          </motion.div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} currentPlan={currentPlan} onUpgrade={handleUpgrade} loading={loadingPlan === plan.id} />
          ))}
        </div>

        {/* FAQ / Info */}
        <div className="mt-12 text-center">
          <p className="font-inter text-xs text-white/30">
            All plans include a 14-day free trial · No setup fees · Cancel anytime · Secure payments powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}