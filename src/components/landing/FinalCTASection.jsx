import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';

export default function FinalCTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0c] to-[#0a0a0a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,98,0.1),transparent_60%)]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-playfair text-3xl sm:text-5xl font-bold mb-6">
            Ready to transform your <br />
            <span className="gold-gradient">hospitality business?</span>
          </h2>
          <p className="font-inter text-lg text-white/50 mb-10 max-w-2xl mx-auto">
            Join the growing number of hotels, restaurants, and resorts running on Hospitality OS.
            Start your free trial today — no credit card required.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#c9a962] to-[#e4d5a7] text-[#0a0a0a] font-inter font-semibold rounded-full hover:shadow-[0_0_40px_rgba(201,169,98,0.4)] transition-all duration-300 text-lg"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="inline-flex items-center gap-2 px-8 py-4 luxury-border text-white font-inter font-medium rounded-full hover:bg-[#c9a962]/10 transition-all duration-300 text-lg">
              <Play className="w-5 h-5 text-[#c9a962]" />
              Book Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}