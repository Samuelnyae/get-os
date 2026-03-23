import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import HotelLayout from '@/components/hotel/HotelLayout';
import LuxuryButton from '@/components/common/LuxuryButton';
import CustomFoodContent from '@/components/hotel/HotelCustomFoodContent';

export default function HotelCustomize() {
  const { slug } = useParams();
  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['hotel', slug],
    queryFn: () => base44.entities.Hotel.filter({ slug }),
  });
  const hotel = hotels[0];

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" /></div>;
  if (!hotel) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Link to="/Hotels"><LuxuryButton>View All Locations</LuxuryButton></Link></div>;

  return (
    <HotelLayout hotel={hotel}>
      <CustomFoodContent hotel={hotel} />
    </HotelLayout>
  );
}