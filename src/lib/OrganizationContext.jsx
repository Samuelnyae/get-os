import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const OrganizationContext = createContext();

const INDUSTRY_TAGLINES = {
  hotel: 'Luxury Hospitality',
  restaurant: 'Fine Dining',
  cafe: 'Artisan Café',
  bar: 'Premium Bar',
  resort: 'Resort & Spa',
  lodge: 'Wilderness Lodge',
  guest_house: 'Guest House',
  hostel: 'Modern Hostel',
  conference_center: 'Conference Center',
  catering: 'Catering Services',
  fast_food: 'Quick Service',
  bakery: 'Artisan Bakery',
  night_club: 'Nightlife',
  food_court: 'Food Court',
  coffee_shop: 'Coffee House',
  event_venue: 'Event Venue',
  other: 'Hospitality',
};

export function getIndustryTagline(industry) {
  return INDUSTRY_TAGLINES[industry] || 'Hospitality';
}

export const OrganizationProvider = ({ children }) => {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [org, setOrg] = useState(null);
  const [orgUser, setOrgUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrg = useCallback(async (currentUser) => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'owner' || currentUser.role === 'platform_admin';
    let orgId = currentUser?.data?.organization_id || currentUser?.organization_id;

    // If orgId is missing but the user is admin/owner, the user record itself may be stale
    // (e.g. right after onboarding). Retry me() with backoff — not just Organization.get.
    if (!orgId && isAdmin) {
      for (let attempt = 0; attempt < 3; attempt++) {
        await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
        try {
          const retryUser = await base44.auth.me();
          setOrgUser(retryUser);
          orgId = retryUser?.data?.organization_id || retryUser?.organization_id;
          if (orgId) break;
        } catch (e) {
          console.error(`me() retry ${attempt + 1} failed:`, e);
        }
      }
    }

    if (orgId) {
      try {
        const orgData = await base44.entities.Organization.get(orgId);
        setOrg(orgData);
      } catch (e) {
        console.error('Organization fetch failed:', e);
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (isAuthenticated && user) {
      setOrgUser(user);
      fetchOrg(user);
    } else {
      setOrg(null);
      setOrgUser(null);
      setIsLoading(false);
    }
  }, [user, isAuthenticated, isLoadingAuth, fetchOrg]);

  const refreshOrg = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      setOrgUser(me);
      setOrg(null);
      setIsLoading(true);
      await fetchOrg(me);
    } catch (e) {
      console.error('refreshOrg failed:', e);
    }
  }, [fetchOrg]);

  return (
    <OrganizationContext.Provider value={{ org, user: orgUser, isLoading, refreshOrg }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};