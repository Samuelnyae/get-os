import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2 } from 'lucide-react';

const INDUSTRY_ICONS = {
  hotel: '🏨',
  restaurant: '🍽️',
  cafe: '☕',
  bar: '🍸',
  resort: '🏖️',
  lodge: '🏞️',
  guest_house: '🏠',
  hostel: '🛏️',
  conference_center: '🏢',
  catering: '🍴',
  fast_food: '🍔',
  bakery: '🥖',
  night_club: '🎵',
  food_court: '🍱',
  coffee_shop: '☕',
  event_venue: '🎉',
  other: '🏨',
};

export default function TrustedBySection() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await base44.functions.invoke('getPublicOrganizations', {});
        setOrgs(res.data?.organizations || []);
      } catch {
        setOrgs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const displayOrgs = orgs.length > 0 ? orgs : [];
  const marqueeOrgs = [...displayOrgs, ...displayOrgs];

  if (loading) {
    return (
      <section className="py-16 border-y border-white/5 bg-[#0c0c0c]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center font-inter text-sm tracking-wider text-white/30 uppercase mb-8">
            Trusted by hospitality businesses
          </p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (displayOrgs.length === 0) {
    return null;
  }

  return (
    <section className="py-16 border-y border-white/5 bg-[#0c0c0c]/80 backdrop-blur-sm overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center font-inter text-sm tracking-wider text-white/30 uppercase mb-8">
          Trusted by {displayOrgs.length}+ hotels, restaurants, cafés, and lodges
        </p>
      </div>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0c0c0c] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0c0c0c] to-transparent z-10 pointer-events-none" />

        {/* Marquee */}
        <div className="flex gap-12 animate-marquee hover:[animation-play-state:paused] w-max">
          {marqueeOrgs.map((org, i) => (
            <div
              key={`${org.name}-${i}`}
              className="flex items-center gap-3 px-6 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-[#c9a962]/20 hover:bg-[#c9a962]/5 transition-all duration-300 shrink-0"
            >
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-2xl">{INDUSTRY_ICONS[org.industry] || '🏨'}</span>
              )}
              <span className="font-playfair text-lg text-white/40 hover:text-[#c9a962]/60 transition-colors whitespace-nowrap">
                {org.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}