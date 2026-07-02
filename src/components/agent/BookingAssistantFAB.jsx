import React, { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

const BookingAssistantChat = lazy(() => import('./BookingAssistantChat'));

export default function BookingAssistantFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#d4b47a] text-[#0a0a0a] flex items-center justify-center shadow-lg shadow-[#d4b47a]/20 hover:scale-105 transition-transform"
        aria-label="Booking Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#d4b47a]" />
        )}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)]"
          >
            <Suspense fallback={
              <div className="flex items-center justify-center h-[520px] bg-[#0f0f0f] rounded-xl border border-[#c9a962]/10">
                <div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
              </div>
            }>
              <BookingAssistantChat embedded />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}