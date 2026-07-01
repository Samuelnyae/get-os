import React from 'react';
import { motion } from 'framer-motion';

const LOGOS = ['Savanna Lodge', 'Mara Resort', 'Java House', 'Radisson Blu', 'Coral Beach', 'Hemingways'];

export default function TrustedBySection() {
  return (
    <section className="py-16 border-y border-white/5 bg-[#0c0c0c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center font-inter text-sm tracking-wider text-white/30 uppercase mb-8">
          Trusted by hotels, restaurants, cafés, and lodges
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {LOGOS.map((logo, i) => (
            <motion.span
              key={logo}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="font-playfair text-xl text-white/25 hover:text-[#c9a962]/50 transition-colors duration-300 cursor-default"
            >
              {logo}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}