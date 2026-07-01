import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { COUNTRIES, CURRENCIES, TIMEZONES } from './onboardingConfig';

export default function BusinessInfoStep({ data, update, onNext, onBack }) {
  const [uploading, setUploading] = useState(false);

  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      update({ logo_url: result.file_url });
    } catch { /* ignore */ }
    setUploading(false);
  };

  const field = (label, key, type = 'text', placeholder = '', opts = {}) => (
    <div>
      <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1.5 block">{label}</label>
      {opts.select ? (
        <select value={data[key]} onChange={(e) => update({ [key]: e.target.value })}
          className="w-full bg-transparent luxury-border rounded-lg px-4 py-3 font-inter text-white focus:outline-none focus:border-[#c9a962]">
          {opts.options.map(o => <option key={o} value={o} className="bg-[#1a1a1a]">{o}</option>)}
        </select>
      ) : (
        <input type={type} value={data[key]} onChange={(e) => update({ [key]: e.target.value })} placeholder={placeholder}
          className="w-full bg-transparent luxury-border rounded-lg px-4 py-3 font-inter text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a962] transition-colors" />
      )}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h1 className="font-playfair text-3xl gold-gradient mb-2">Business Information</h1>
      <p className="font-inter text-sm text-white/50 mb-8">Tell us about your business. You can update these later.</p>

      <div className="space-y-5">
        {field('Business Name *', 'org_name', 'text', 'e.g. Serenity Hotel Group')}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('Business Email', 'business_email', 'email', 'you@business.com')}
          {field('Phone Number', 'contact_phone', 'tel', '+254 700 000 000')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('Country', 'country', 'text', '', { select: true, options: COUNTRIES })}
          {field('City', 'city', 'text', 'Nairobi')}
        </div>
        {field('Address', 'address', 'text', 'Westlands, Nairobi, Kenya')}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('Timezone', 'timezone', 'text', '', { select: true, options: TIMEZONES })}
          {field('Currency', 'currency', 'text', '', { select: true, options: CURRENCIES })}
        </div>

        <div>
          <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1.5 block">Business Logo (optional)</label>
          <div className="flex items-center gap-4">
            {data.logo_url && <img src={data.logo_url} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />}
            <label className="luxury-border rounded-lg px-4 py-3 font-inter text-sm text-white/60 hover:text-[#c9a962] cursor-pointer flex items-center gap-2 transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {data.logo_url ? 'Change Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={onBack} className="px-5 py-3 luxury-border rounded-lg font-inter text-white/60 hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} disabled={!data.org_name?.trim()}
          className="flex-1 bg-[#c9a962] text-[#0a0a0a] font-inter font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#e4d5a7] transition-colors disabled:opacity-40">
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}