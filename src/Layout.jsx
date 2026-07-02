import React from 'react';
import { Instagram, Facebook, Twitter, Phone } from 'lucide-react';
import MarketingNav from '@/components/landing/MarketingNav';
import BusinessNav from '@/components/nav/BusinessNav';
import { useLanguage } from '@/lib/LanguageContext';
import { useOrganization, getIndustryTagline } from '@/lib/OrganizationContext';

export default function Layout({ children, currentPageName }) {
  const { t } = useLanguage();
  const { org, user: orgUser } = useOrganization();
  const isOnboarded = !!(orgUser?.data?.organization_id || orgUser?.organization_id);

  const isLandingPage = currentPageName === 'Home' && !isOnboarded;
  const showMarketingNav = isLandingPage || !isOnboarded;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;500;600&display=swap');
        
        :root {
          --gold: #c9a962;
          --gold-light: #e4d5a7;
          --cream: #f5f0e8;
          --charcoal: #1a1a1a;
          --dark: #0a0a0a;
        }
        
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        
        .gold-gradient {
          background: linear-gradient(135deg, #c9a962 0%, #e4d5a7 50%, #c9a962 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .luxury-border {
          border: 1px solid rgba(201, 169, 98, 0.3);
        }
        
        .glass-effect {
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(20px);
        }
      `}</style>

      {/* Navigation */}
      {showMarketingNav ? <MarketingNav /> : <BusinessNav currentPageName={currentPageName} />}

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0f0f0f] border-t border-[#c9a962]/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-start">
            {/* Brand */}
            <div className="md:col-span-2">
              <h2 className="font-playfair text-3xl gold-gradient mb-4">{org?.name || 'Get OS'}</h2>
              <p className="font-cormorant text-lg text-white/60 leading-relaxed max-w-md">
                {t('footerTagline')}
              </p>
            </div>

            {/* Social */}
            <div className="self-start">
              <h3 className="font-inter text-sm tracking-wider text-[#c9a962] uppercase mb-6">{t('connect')}</h3>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-full luxury-border flex items-center justify-center hover:bg-[#c9a962]/10 transition-all">
                  <Instagram className="w-4 h-4 text-[#c9a962]" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full luxury-border flex items-center justify-center hover:bg-[#c9a962]/10 transition-all">
                  <Facebook className="w-4 h-4 text-[#c9a962]" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full luxury-border flex items-center justify-center hover:bg-[#c9a962]/10 transition-all">
                  <Twitter className="w-4 h-4 text-[#c9a962]" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full luxury-border flex items-center justify-center hover:bg-[#c9a962]/10 transition-all">
                  <Phone className="w-4 h-4 text-[#c9a962]" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#c9a962]/20 mt-12 pt-8 text-center">
            <p className="font-inter text-xs text-white/40">
              © {new Date().getFullYear()} {org?.name || 'Get OS'}. Hospitality Management Platform. {t('allRightsReserved')}
            </p>
          </div>
        </div>
      </footer>

      {/* Chatbot removed — replaced by Booking Assistant AI Agent in Admin dashboard */}

      {/* Spacer for mobile bottom tab bar */}
      <div className="h-16 lg:hidden" />
      </div>
      );
      }