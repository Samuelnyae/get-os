import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Plus, Trash2, Building } from 'lucide-react';

export default function BranchesStep({ data, update, onNext, onBack }) {
  const setMultiple = (multiple) => {
    if (multiple && data.branches.length === 1) {
      update({ hasMultipleBranches: true, branches: [...data.branches, { name: '', city: '', address: '' }] });
    } else if (!multiple) {
      update({ hasMultipleBranches: false, branches: [data.branches[0]] });
    } else {
      update({ hasMultipleBranches: true });
    }
  };

  const updateBranch = (idx, field, value) => {
    const branches = [...data.branches];
    branches[idx] = { ...branches[idx], [field]: value };
    update({ branches });
  };

  const addBranch = () => update({ branches: [...data.branches, { name: '', city: '', address: '' }] });
  const removeBranch = (idx) => update({ branches: data.branches.filter((_, i) => i !== idx) });

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h1 className="font-playfair text-3xl gold-gradient mb-2">Branches</h1>
      <p className="font-inter text-sm text-white/50 mb-8">How many branches do you have?</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <button onClick={() => setMultiple(false)}
          className={`p-4 rounded-xl text-center transition-all ${!data.hasMultipleBranches ? 'bg-[#c9a962]/15 border-2 border-[#c9a962]' : 'luxury-border border'}`}>
          <Building className="w-6 h-6 mx-auto mb-2 text-[#c9a962]" />
          <p className="font-inter text-sm text-white font-medium">One location</p>
        </button>
        <button onClick={() => setMultiple(true)}
          className={`p-4 rounded-xl text-center transition-all ${data.hasMultipleBranches ? 'bg-[#c9a962]/15 border-2 border-[#c9a962]' : 'luxury-border border'}`}>
            <div className="flex gap-1 justify-center mb-2">
              <Building className="w-5 h-5 text-[#c9a962]" />
              <Building className="w-5 h-5 text-[#c9a962]" />
            </div>
          <p className="font-inter text-sm text-white font-medium">Multiple locations</p>
        </button>
      </div>

      <div className="space-y-4">
        {data.branches.map((branch, idx) => (
          <div key={idx} className="luxury-border rounded-xl p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider">{idx === 0 ? 'Main Branch' : `Branch ${idx + 1}`}</p>
              {idx > 0 && (
                <button onClick={() => removeBranch(idx)} className="text-white/40 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <input type="text" value={branch.name} onChange={(e) => updateBranch(idx, 'name', e.target.value)}
              placeholder="Branch name (e.g. Westlands Branch)"
              className="w-full bg-transparent luxury-border rounded-lg px-4 py-2.5 font-inter text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a962]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" value={branch.city} onChange={(e) => updateBranch(idx, 'city', e.target.value)}
                placeholder="City"
                className="bg-transparent luxury-border rounded-lg px-4 py-2.5 font-inter text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a962]" />
              <input type="text" value={branch.address} onChange={(e) => updateBranch(idx, 'address', e.target.value)}
                placeholder="Address"
                className="bg-transparent luxury-border rounded-lg px-4 py-2.5 font-inter text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a962]" />
            </div>
          </div>
        ))}
      </div>

      {data.hasMultipleBranches && (
        <button onClick={addBranch} className="mt-4 w-full luxury-border rounded-lg py-3 font-inter text-sm text-white/60 hover:text-[#c9a962] flex items-center justify-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Add Another Branch
        </button>
      )}

      <div className="flex gap-3 mt-8">
        <button onClick={onBack} className="px-5 py-3 luxury-border rounded-lg font-inter text-white/60 hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} disabled={!data.branches[0]?.name?.trim()}
          className="flex-1 bg-[#c9a962] text-[#0a0a0a] font-inter font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#e4d5a7] transition-colors disabled:opacity-40">
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}