import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Star, ChefHat, Utensils, Sparkles } from 'lucide-react';
import MenuCard from '../components/menu/MenuCard';
import SectionHeader from '../components/common/SectionHeader';
import LuxuryButton from '../components/common/LuxuryButton';

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: featuredItems = [] } = useQuery({
    queryKey: ['featured-menu'],
    queryFn: () => base44.entities.MenuItem.filter({ is_featured: true }, '-created_date', 6),
  });

  const features = [
    { icon: Star, title: 'Seven Star Quality', description: 'Unmatched excellence in every dish we serve' },
    { icon: ChefHat, title: 'Master Chefs', description: 'World-renowned culinary artists at your service' },
    { icon: Utensils, title: 'Fine Dining', description: 'An unforgettable gastronomic experience' },
  ];

  return (
    <div className="bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0a_70%)]" />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 border border-[#c9a962]/20 rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-10 w-48 h-48 border border-[#c9a962]/10 rounded-full" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <p className="font-inter text-xs tracking-[0.4em] text-[#c9a962] uppercase mb-6">
              Welcome to Hermanas Bites
            </p>
            <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight">
              Seven-Star<br />
              <span className="gold-gradient">Dining Experience</span>
            </h1>
            <p className="font-cormorant text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Where culinary artistry meets timeless elegance. 
              Embark on a journey of extraordinary flavors crafted with passion.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to={createPageUrl('Menu')}>
                <LuxuryButton size="lg" className="min-w-[200px]">
                  Explore Menu <ArrowRight className="inline ml-2 w-4 h-4" />
                </LuxuryButton>
              </Link>
              <Link to={createPageUrl('CustomFood')}>
                <LuxuryButton variant="secondary" size="lg" className="min-w-[200px]">
                  <Sparkles className="inline mr-2 w-4 h-4" />
                  Customize Your Dish
                </LuxuryButton>
              </Link>
            </div>

            {/* Live Time */}
            <div className="inline-flex items-center space-x-4 px-6 py-3 rounded-full bg-[#1a1a1a]/50 backdrop-blur-sm border border-[#c9a962]/20">
              <span className="font-inter text-xs text-[#c9a962] uppercase tracking-wider">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              <span className="w-px h-4 bg-[#c9a962]/30" />
              <span className="font-inter text-sm text-white tabular-nums">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-[#c9a962]/30 flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-[#c9a962] mt-2"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center p-8 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all duration-500"
              >
                <div className="w-16 h-16 rounded-full bg-[#c9a962]/10 flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-7 h-7 text-[#c9a962]" />
                </div>
                <h3 className="font-playfair text-xl text-white mb-3">{feature.title}</h3>
                <p className="font-inter text-sm text-white/50">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Dishes */}
      {featuredItems.length > 0 && (
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <SectionHeader 
              subtitle="Chef's Selection" 
              title="Featured Dishes" 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredItems.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to={createPageUrl('Menu')}>
                <LuxuryButton variant="secondary">
                  View Full Menu <ArrowRight className="inline ml-2 w-4 h-4" />
                </LuxuryButton>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Customize CTA */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200)',
              }}
            />
            <div className="absolute inset-0 bg-[#0a0a0a]/80" />
            <div className="relative z-10 p-12 md:p-20 text-center">
              <p className="font-inter text-xs tracking-[0.3em] text-[#c9a962] uppercase mb-4">
                Personalized Experience
              </p>
              <h2 className="font-playfair text-4xl md:text-5xl text-white mb-6">
                Customize Your Dish
              </h2>
              <p className="font-cormorant text-xl text-white/60 max-w-xl mx-auto mb-8">
                Your taste, our craft. Let our master chefs create a unique culinary masterpiece tailored just for you.
              </p>
              <Link to={createPageUrl('CustomFood')}>
                <LuxuryButton size="lg">
                  <Sparkles className="inline mr-2 w-4 h-4" />
                  Create Your Dish
                </LuxuryButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-6xl text-[#c9a962]/30 mb-6">"</div>
            <blockquote className="font-cormorant text-3xl md:text-4xl text-white/80 italic leading-relaxed mb-8">
              Every dish is a symphony of flavors, composed with love and served with grace.
            </blockquote>
            <p className="font-inter text-sm text-[#c9a962] tracking-wider">
              — HERMANAS BITES
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}