import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ArrowRight, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CHECKLIST_ITEMS = [
  { key: 'business_created', label: 'Business Created', link: '/Admin', alwaysDone: true },
  { key: 'add_staff', label: 'Add Staff', link: '/HR' },
  { key: 'add_rooms', label: 'Add Rooms', link: '/Rooms' },
  { key: 'add_menu', label: 'Add Menu', link: '/Admin' },
  { key: 'connect_payments', label: 'Connect Payments', link: '/Billing' },
  { key: 'configure_taxes', label: 'Configure Taxes', link: '/Admin' },
  { key: 'import_inventory', label: 'Import Inventory', link: '/Inventory' },
  { key: 'invite_employees', label: 'Invite Employees', link: '/HR' },
  { key: 'first_reservation', label: 'Create First Reservation', link: '/Reservations' },
  { key: 'complete_profile', label: 'Complete Profile', link: '/Admin' },
];

export default function SetupChecklist({ onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  const [completed, setCompleted] = useState({ business_created: true });

  useEffect(() => {
    const saved = localStorage.getItem('getos_checklist');
    if (saved) {
      try { setCompleted(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const toggleItem = (key) => {
    const updated = { ...completed, [key]: !completed[key] };
    setCompleted(updated);
    localStorage.setItem('getos_checklist', JSON.stringify(updated));
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('getos_checklist_dismissed', 'true');
    if (onDismiss) onDismiss();
  };

  if (dismissed || localStorage.getItem('getos_checklist_dismissed') === 'true') return null;

  const doneCount = CHECKLIST_ITEMS.filter(item => completed[item.key]).length;
  const pct = Math.round((doneCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 overflow-hidden mb-6">
          <div className="flex items-center justify-between p-5 border-b border-[#c9a962]/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#c9a962]/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#c9a962]" />
              </div>
              <div>
                <h3 className="font-playfair text-lg text-white">Business Setup</h3>
                <p className="font-inter text-xs text-white/50">Complete these steps to get fully set up</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-inter text-sm text-[#c9a962] font-semibold">{pct}% Complete</span>
              <button onClick={handleDismiss} className="text-white/40 hover:text-white/70 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-5 pt-3">
            <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-[#c9a962] to-[#e4d5a7] rounded-full" />
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CHECKLIST_ITEMS.map((item) => {
              const isDone = completed[item.key];
              return (
                <div key={item.key} className="flex items-center gap-3 group">
                  <button onClick={() => toggleItem(item.key)} className="shrink-0">
                    {isDone
                      ? <CheckCircle2 className="w-5 h-5 text-[#c9a962]" />
                      : <Circle className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />}
                  </button>
                  <Link to={item.link} className={`font-inter text-sm transition-colors ${isDone ? 'text-white/40 line-through' : 'text-white/70 hover:text-[#c9a962]'}`}>
                    {item.label}
                  </Link>
                </div>
              );
            })}
          </div>

          {pct === 100 && (
            <div className="px-5 pb-5">
              <div className="bg-[#c9a962]/10 rounded-xl p-4 text-center">
                <p className="font-playfair text-lg text-[#c9a962] mb-1">🎉 All done!</p>
                <p className="font-inter text-xs text-white/50">Your business is fully set up. Welcome to Get OS.</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}