import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrganization, getIndustryTagline } from '@/lib/OrganizationContext';

export function useBusinessInfo() {
  const { org, isLoading: orgLoading } = useOrganization();

  const { data: hotel, isLoading: hotelLoading } = useQuery({
    queryKey: ['business-hotel', org?.id],
    queryFn: async () => {
      const hotels = await base44.entities.Hotel.filter({ organization_id: org.id, branch_type: 'main' });
      return hotels[0] || null;
    },
    enabled: !!org?.id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const name = hotel?.name || org?.name || 'Our Business';
  const tagline = org ? getIndustryTagline(org.industry) : 'Hospitality';
  const description = hotel?.description || org?.notes || '';
  const address = [hotel?.address || org?.address, hotel?.location || org?.city, org?.country].filter(Boolean).join(', ');
  const phone = hotel?.phone || org?.contact_phone || '';
  const email = hotel?.email || org?.billing_email || org?.owner_email || '';
  const imageUrl = hotel?.image_url || '';
  const logoUrl = hotel?.logo_url || org?.logo_url || '';
  const openingHours = hotel?.opening_hours || '';
  const socialLinks = {
    instagram: hotel?.social_instagram,
    facebook: hotel?.social_facebook,
    twitter: hotel?.social_twitter,
    tiktok: hotel?.social_tiktok,
    youtube: hotel?.social_youtube,
  };
  const whatsapp = hotel?.whatsapp_number || phone;
  const location = hotel?.location || org?.city || '';
  const latitude = hotel?.latitude;
  const longitude = hotel?.longitude;
  const enabledModules = org?.enabled_modules || [];
  const industry = org?.industry || 'restaurant';

  return {
    org,
    hotel,
    name,
    tagline,
    description,
    address,
    phone,
    email,
    imageUrl,
    logoUrl,
    openingHours,
    socialLinks,
    whatsapp,
    location,
    latitude,
    longitude,
    enabledModules,
    industry,
    isLoading: orgLoading || hotelLoading,
  };
}