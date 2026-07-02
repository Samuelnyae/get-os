import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, Heart, Utensils, Clock, MapPin, Phone, ArrowRight } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { useLanguage } from '@/lib/LanguageContext';

const ROLE_LABELS = {
  chef: 'Executive Chef',
  kitchen_assistant: 'Kitchen Team',
  manager: 'Manager',
  waiter: 'Service Team',
  bartender: 'Bartender',
  host: 'Host',
  cleaner: 'Housekeeping',
  delivery: 'Delivery',
};

export default function About() {
  const { t } = useLanguage();
  const { name, tagline, description, address, phone, openingHours, location, imageUrl } = useBusinessInfo();

  const { data: staff = [] } = useQuery({
    queryKey: ['about-staff'],
    queryFn: () => base44.entities.Staff.filter({ status: 'available' }, '-created_date', 6),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

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
            subtitle={tagline}
            title={`About ${name}`}
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-cormorant text-xl text-white/60 max-w-3xl mx-auto leading-relaxed"
          >
            {description || t('aboutDesc')}
          </motion.p>
        </div>
      </section>

      {/* Info Cards */}
      {(location || phone || openingHours) && (
        <section className="py-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {location && (
                <div className="text-center p-6 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10">
                  <MapPin className="w-8 h-8 text-[#c9a962] mx-auto mb-4" />
                  <p className="font-playfair text-lg text-white mb-1">{location}</p>
                  <p className="font-inter text-sm text-white/50">{address}</p>
                </div>
              )}
              {phone && (
                <div className="text-center p-6 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10">
                  <Phone className="w-8 h-8 text-[#c9a962] mx-auto mb-4" />
                  <p className="font-playfair text-lg text-white mb-1">{t('phone')}</p>
                  <p className="font-inter text-sm text-white/50">{phone}</p>
                </div>
              )}
              {openingHours && (
                <div className="text-center p-6 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10">
                  <Clock className="w-8 h-8 text-[#c9a962] mx-auto mb-4" />
                  <p className="font-playfair text-lg text-white mb-1">{t('hours')}</p>
                  <p className="font-inter text-sm text-white/50">{openingHours}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Story Section */}
      {description && (
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
                    src={imageUrl || 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800'}
                    alt={name}
                    className="rounded-2xl w-full"
                  />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <h3 className="font-inter text-xs tracking-[0.3em] text-[#c9a962] uppercase">{t('ourHeritage')}</h3>
                <h2 className="font-playfair text-4xl text-white">{t('legacyOfExcellence')}</h2>
                <p className="font-inter text-white/60 leading-relaxed">{description}</p>
              </motion.div>
            </div>
          </div>
        </section>
      )}

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
      {staff.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              subtitle={t('meetOurTeam')}
              title={t('masterChefs')}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {staff.slice(0, 3).map((member, index) => (
                <motion.div
                  key={member.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-8 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#c9a962] to-[#e4d5a7] flex items-center justify-center mx-auto mb-4">
                    <span className="font-playfair text-2xl text-[#0a0a0a] font-bold">
                      {member.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-playfair text-xl text-white">{member.name}</h3>
                  <p className="font-inter text-sm text-[#c9a962]">{ROLE_LABELS[member.role] || member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center">
          <SectionHeader
            subtitle={t('getInTouch')}
            title={`Visit ${name} Today`}
          />
          <Link
            to="/Contact"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-[#c9a962] to-[#e4d5a7] text-[#0a0a0a] font-inter text-sm font-medium hover:opacity-90 transition-all mt-6"
          >
            Contact Us <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}