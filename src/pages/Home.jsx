import React from 'react';
import HeroSection from '@/components/landing/HeroSection';
import TrustedBySection from '@/components/landing/TrustedBySection';
import WhyChooseSection from '@/components/landing/WhyChooseSection';
import ModulesGridSection from '@/components/landing/ModulesGridSection';
import DashboardShowcaseSection from '@/components/landing/DashboardShowcaseSection';
import HospitalityAISection from '@/components/landing/HospitalityAISection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import IndustriesSection from '@/components/landing/IndustriesSection';
import AnalyticsSection from '@/components/landing/AnalyticsSection';
import IntegrationsSection from '@/components/landing/IntegrationsSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import FAQSection from '@/components/landing/FAQSection';
import FinalCTASection from '@/components/landing/FinalCTASection';

export default function Home() {
  return (
    <div className="bg-[#0a0a0a]" id="home">
      <HeroSection />
      <TrustedBySection />
      <div id="features">
        <WhyChooseSection />
        <ModulesGridSection />
      </div>
      <div id="solutions">
        <DashboardShowcaseSection />
        <HospitalityAISection />
        <HowItWorksSection />
      </div>
      <div id="industries">
        <IndustriesSection />
      </div>
      <AnalyticsSection />
      <IntegrationsSection />
      <TestimonialsSection />
      <div id="pricing">
        <PricingSection />
      </div>
      <FAQSection />
      <FinalCTASection />
    </div>
  );
}