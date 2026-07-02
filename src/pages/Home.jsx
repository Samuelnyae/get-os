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
import { useOrganization } from '@/lib/OrganizationContext';
import BusinessHome from './BusinessHome';

export default function Home() {
  const { org } = useOrganization();

  if (org) {
    return <BusinessHome />;
  }

  return (
    <div className="bg-[#0a0a0a] relative" id="home">
      {/* Background video — fixed across entire landing page */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="https://media.base44.com/videos/public/6a3bb63c5d638ed13971e566/e89a4a134_generated_video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/80 to-[#0a0a0a]/90" />
      </div>

      <div className="relative z-10">
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
    </div>
  );
}