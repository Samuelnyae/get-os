import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Wine, Coffee, GlassWater } from 'lucide-react';
import MenuCard from '../components/menu/MenuCard';
import SectionHeader from '../components/common/SectionHeader';
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';

export default function Drinks() {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();

  const { data: drinks = [], isLoading } = useQuery({
    queryKey: ['drinks'],
    queryFn: () => base44.entities.MenuItem.filter({ category: 'drinks' }, '-created_date'),
  });

  const filteredDrinks = drinks.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (item) => {
    toast.success(`${item.name} added to cart`, {
      description: 'View your cart to checkout',
      duration: 2000,
    });
  };

  const drinkTypes = [
    { icon: Wine, label: t('fineWines'), description: t('fineWinesDesc') },
    { icon: Coffee, label: t('artisanCoffee'), description: t('artisanCoffeeDesc') },
    { icon: GlassWater, label: t('signatureCocktails'), description: t('signatureCocktailsDesc') },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <SectionHeader 
          subtitle={t('beveragesSpirits')} 
          title={t('drinksMenu')} 
        />

        {/* Drink Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {drinkTypes.map((type, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10 text-center"
            >
              <type.icon className="w-10 h-10 text-[#c9a962] mx-auto mb-4" />
              <h3 className="font-playfair text-lg text-white mb-2">{type.label}</h3>
              <p className="font-inter text-sm text-white/50">{type.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#c9a962]/50" />
          <Input
            type="text"
            placeholder={t('searchDrinks')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[#1a1a1a] border-[#c9a962]/20 text-white placeholder:text-white/40 rounded-full focus:border-[#c9a962] focus:ring-[#c9a962]/20"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
          </div>
        )}

        {/* Drinks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDrinks.map((item) => (
            <MenuCard key={item.id} item={item} onAddToCart={handleAddToCart} />
          ))}
        </div>

        {/* Empty State */}
        {!isLoading && filteredDrinks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Wine className="w-16 h-16 text-[#c9a962]/30 mx-auto mb-4" />
            <h3 className="font-playfair text-2xl text-white mb-2">{t('noDrinksFound')}</h3>
            <p className="font-inter text-white/50">{t('checkBackSoon')}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}