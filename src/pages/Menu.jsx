import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import MenuCard from '../components/menu/MenuCard';
import AIMenuSuggestions from '../components/menu/AIMenuSuggestions';
import SectionHeader from '../components/common/SectionHeader';
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => base44.entities.MenuItem.list('-created_date'),
  });

  const categories = [
    { id: 'all', label: 'All Dishes' },
    { id: 'starters', label: 'Starters' },
    { id: 'main_dishes', label: 'Main Dishes' },
    { id: 'desserts', label: 'Desserts' },
    { id: 'drinks', label: 'Drinks' },
  ];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('hermanas_cart') || '[]');
    setCartItems(cart);
    
    const handleCartUpdate = () => {
      const updatedCart = JSON.parse(localStorage.getItem('hermanas_cart') || '[]');
      setCartItems(updatedCart);
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const handleAddToCart = (item) => {
    toast.success(`${item.name} added to cart`, {
      description: 'View your cart to checkout',
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <SectionHeader 
          subtitle="Culinary Excellence" 
          title="Our Menu" 
        />

        {/* Search & Filters */}
        <div className="mb-12">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#c9a962]/50" />
            <Input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#1a1a1a] border-[#c9a962]/20 text-white placeholder:text-white/40 rounded-full focus:border-[#c9a962] focus:ring-[#c9a962]/20"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2.5 rounded-full font-inter text-sm transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-[#c9a962] text-[#0a0a0a]'
                    : 'bg-[#1a1a1a] text-white/70 border border-[#c9a962]/20 hover:border-[#c9a962]/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
          </div>
        )}

        {/* AI Suggestions */}
        {!isLoading && !searchQuery && activeCategory === 'all' && (
          <div className="mb-12">
            <AIMenuSuggestions cartItems={cartItems} />
          </div>
        )}

        {/* Menu Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} onAddToCart={handleAddToCart} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {!isLoading && filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Filter className="w-16 h-16 text-[#c9a962]/30 mx-auto mb-4" />
            <h3 className="font-playfair text-2xl text-white mb-2">No dishes found</h3>
            <p className="font-inter text-white/50">Try adjusting your search or filter</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}