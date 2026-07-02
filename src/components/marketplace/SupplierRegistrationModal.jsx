import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, X, Check, ChevronLeft } from 'lucide-react';
import { CATEGORIES, CAT_LABELS } from '@/lib/marketplace';

const STEPS = [
  { id: 1, label: 'Company Info' },
  { id: 2, label: 'Products & Terms' },
  { id: 3, label: 'Review' },
];

export default function SupplierRegistrationModal({ open, onClose, onSubmit, pending }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    company_name: '', contact_person: '', phone: '', email: '',
    category: 'food', address: '', delivery_areas: '', description: '',
    payment_terms: 'Net 30', min_order: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const canNext = step === 1
    ? form.company_name && form.contact_person && form.phone && form.email
    : step === 2
    ? form.payment_terms
    : true;

  const handleSubmit = () => onSubmit(form);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#1a1a1a] border border-[#c5a059]/20 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#c5a059]" />
                <h3 className="font-playfair text-white text-lg">Register as a Supplier</h3>
              </div>
              <button onClick={handleClose}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
            </div>

            {/* Stepper */}
            <div className="px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                {STEPS.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                        step > s.id ? 'bg-[#c5a059] text-black' :
                        step === s.id ? 'bg-[#c5a059] text-black' :
                        'bg-white/5 text-white/30'
                      }`}>
                        {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                      </div>
                      <span className={`text-xs ${step >= s.id ? 'text-[#c5a059]' : 'text-white/30'}`}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-px ${step > s.id ? 'bg-[#c5a059]' : 'bg-white/10'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <h4 className="text-white font-semibold text-sm">Tell us about your company</h4>
                  <Field label="Company Name *" value={form.company_name} onChange={v => set('company_name', v)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Contact Person *" value={form.contact_person} onChange={v => set('contact_person', v)} />
                    <Field label="Phone *" value={form.phone} onChange={v => set('phone', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email *" value={form.email} onChange={v => set('email', v)} />
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Category</label>
                      <select value={form.category} onChange={e => set('category', e.target.value)}
                        className="w-full bg-[#202020] border border-[#333] text-white rounded-lg px-3 py-2 text-sm">
                        {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c] || c}</option>)}
                      </select>
                    </div>
                  </div>
                  <Field label="Physical Address" value={form.address} onChange={v => set('address', v)} />
                  <Field label="Delivery Areas (e.g. Nairobi, Mombasa)" value={form.delivery_areas} onChange={v => set('delivery_areas', v)} />
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Business Description</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                      className="w-full bg-[#202020] border border-[#333] text-white rounded-lg px-3 py-2 text-sm resize-none" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h4 className="text-white font-semibold text-sm">Products & Terms</h4>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Payment Terms</label>
                    <select value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)}
                      className="w-full bg-[#202020] border border-[#333] text-white rounded-lg px-3 py-2 text-sm">
                      <option value="Net 30">Net 30</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                      <option value="Cash on Delivery">Cash on Delivery</option>
                      <option value="Prepaid">Prepaid</option>
                    </select>
                  </div>
                  <Field label="Minimum Order Amount (KSh)" type="number" value={form.min_order} onChange={v => set('min_order', v)} />
                  <div className="p-3 rounded-lg bg-[#c5a059]/5 border border-[#c5a059]/10">
                    <p className="text-white/40 text-xs">You can add your product catalogue after registration from your supplier dashboard.</p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h4 className="text-white font-semibold text-sm">Review your details before submitting</h4>
                  <div className="bg-[#262626] rounded-xl p-4 space-y-2">
                    {[
                      ['Company', form.company_name],
                      ['Contact', form.contact_person],
                      ['Email', form.email],
                      ['Phone', form.phone],
                      ['Category', CAT_LABELS[form.category] || form.category],
                      ['Address', form.address || 'N/A'],
                      ['Delivery Areas', form.delivery_areas || 'N/A'],
                      ['Payment Terms', form.payment_terms],
                      ['Min Order', form.min_order ? `KSh ${Number(form.min_order).toLocaleString()}` : 'N/A'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-white/40">{k}</span>
                        <span className="text-white/80">{v}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-white/5 text-center">
                      <span className="text-white/30 text-[10px]">0 product(s) listed</span>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs">Your listing will be reviewed by our team before going live. This usually takes 1-2 business days.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-white/5">
              {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="flex-1 py-2.5 border border-white/10 text-white/60 rounded-lg text-sm hover:bg-white/5 flex items-center justify-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <button onClick={handleClose} className="flex-1 py-2.5 border border-white/10 text-white/60 rounded-lg text-sm hover:bg-white/5">
                  Cancel
                </button>
              )}
              {step < 3 ? (
                <button onClick={() => canNext && setStep(step + 1)} disabled={!canNext}
                  className="flex-1 py-2.5 bg-[#c5a059] text-black rounded-lg text-sm font-semibold disabled:opacity-50">
                  Continue
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={pending}
                  className="flex-1 py-2.5 bg-[#c5a059] text-black rounded-lg text-sm font-semibold disabled:opacity-50">
                  {pending ? 'Submitting...' : 'Submit Registration'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-white/50 text-xs mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#202020] border border-[#333] text-white rounded-lg px-3 py-2 text-sm" />
    </div>
  );
}