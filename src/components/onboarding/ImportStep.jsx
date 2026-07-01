import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Upload, FileText, Loader2, Check } from 'lucide-react';
import { IMPORT_TYPES } from './onboardingConfig';
import OnboardingIcon from './OnboardingIcon';
import { base44 } from '@/api/base44Client';

export default function ImportStep({ data, update, onNext, onBack }) {
  const [uploading, setUploading] = useState(null);

  const handleUpload = async (type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const imports = { ...data.imports, [type]: result.file_url };
      update({ imports });
    } catch { /* ignore */ }
    setUploading(null);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h1 className="font-playfair text-3xl gold-gradient mb-2">Import Existing Data</h1>
      <p className="font-inter text-sm text-white/50 mb-8">Do you already have data? Upload CSV files to get started quickly.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {IMPORT_TYPES.map((imp) => {
          const hasFile = data.imports?.[imp.value];
          return (
            <div key={imp.value}
              className={`p-4 rounded-xl transition-all ${hasFile ? 'bg-[#c9a962]/10 border border-[#c9a962]/40' : 'luxury-border border border-[#c9a962]/20'}`}>
              <div className="flex items-center gap-3 mb-3">
                <OnboardingIcon name={imp.icon} className="w-6 h-6 text-[#c9a962] shrink-0" />
                <p className="font-inter text-sm text-white font-medium">{imp.label}</p>
                {hasFile && <span className="ml-auto text-xs text-[#c9a962] flex items-center gap-1"><Check className="w-3 h-3" /> Uploaded</span>}
              </div>
              <label className="flex items-center justify-center gap-2 py-2 rounded-lg luxury-border cursor-pointer hover:bg-white/5 transition-colors">
                {uploading === imp.value ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#c9a962]" />
                ) : hasFile ? (
                  <FileText className="w-4 h-4 text-[#c9a962]" />
                ) : (
                  <Upload className="w-4 h-4 text-white/50" />
                )}
                <span className="font-inter text-xs text-white/60">{hasFile ? 'Replace File' : 'Upload CSV'}</span>
                <input type="file" accept=".csv" onChange={(e) => handleUpload(imp.value, e)} className="hidden" />
              </label>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-5 py-3 luxury-border rounded-lg font-inter text-white/60 hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext}
          className="flex-1 bg-[#c9a962] text-[#0a0a0a] font-inter font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#e4d5a7] transition-colors">
          {Object.keys(data.imports || {}).length > 0 ? 'Continue' : 'Skip for now'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}