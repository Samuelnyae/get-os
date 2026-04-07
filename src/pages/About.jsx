import React from 'react';
import { motion } from 'framer-motion';
import { Star, Award, Heart, Utensils, Clock, Users } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import { useLanguage } from '@/lib/LanguageContext';

export default function About() {
  const { t } = useLanguage();

  const stats = [
    { icon: Star, value: '7', label: t('starRating') },
    { icon: Clock, value: '15+', label: t('yearsExperience') },
    { icon: Users, value: '50K+', label: t('happyGuests') },
    { icon: Award, value: '25+', label: t('culinaryAwards') },
  ];

  const values = [
    { icon: Heart, title: t('passion'), description: t('passionDesc') },
    { icon: Utensils, title: t('quality'), description: t('qualityDesc') },
    { icon: Star, title: t('excellence'), description: t('excellenceDesc') },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <SectionHeader 
            subtitle={t('ourStory')} 
            title={t('aboutUs')} 
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-cormorant text-xl text-white/60 max-w-3xl mx-auto leading-relaxed"
          >
            {t('aboutIntro')}
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10"
              >
                <stat.icon className="w-8 h-8 text-[#c9a962] mx-auto mb-4" />
                <p className="font-playfair text-4xl text-white mb-1">{stat.value}</p>
                <p className="font-inter text-sm text-white/50">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800"
                  alt="Our Kitchen"
                  className="rounded-2xl w-full"
                />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-xl bg-[#c9a962]/20 backdrop-blur-sm border border-[#c9a962]/30 flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-playfair text-3xl text-[#c9a962]">7★</p>
                    <p className="font-inter text-xs text-white/60">Excellence</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="font-inter text-xs tracking-[0.3em] text-[#c9a962] uppercase">{t('ourHeritage')}</h3>
              <h2 className="font-playfair text-4xl text-white">{t('legacyTitle')}</h2>
              <p className="font-inter text-white/60 leading-relaxed">{t('legacyP1')}</p>
              <p className="font-inter text-white/60 leading-relaxed">{t('legacyP2')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto">
          <SectionHeader 
            subtitle={t('whatDrivesUs')} 
            title={t('ourValues')} 
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all duration-500"
              >
                <div className="w-16 h-16 rounded-full bg-[#c9a962]/10 flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-7 h-7 text-[#c9a962]" />
                </div>
                <h3 className="font-playfair text-2xl text-white mb-4">{value.title}</h3>
                <p className="font-inter text-white/50 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto">
          <SectionHeader 
            subtitle={t('meetOurTeam')} 
            title={t('masterChefsTitle')} 
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Chef Maria Hermana', role: t('executiveChef'), image: 'https://images.unsplash.com/photo-1583394293214-28ez1c29def9?w=400' },
              { name: 'Chef Isabella Hermana', role: t('pastryChef'), image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400' },
              { name: 'Chef Carlos Rodriguez', role: t('headChef'), image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=400' },
            ].map((chef, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="relative overflow-hidden rounded-2xl mb-4">
                  <img
                    src={chef.image}
                    alt={chef.name}
                    className="w-full aspect-[3/4] object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60" />
                </div>
                <h3 className="font-playfair text-xl text-white">{chef.name}</h3>
                <p className="font-inter text-sm text-[#c9a962]">{chef.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}