import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, ChefHat, Globe, Building2, Users, Truck, Send } from 'lucide-react';
import { toast } from 'sonner';

const StarRating = ({ value, onChange, label }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="transition-transform active:scale-90"
      >
        <Star
          className={`w-6 h-6 transition-colors ${
            star <= value ? 'fill-[#c9a962] text-[#c9a962]' : 'text-white/20'
          }`}
        />
      </button>
    ))}
  </div>
);

const DISMISSED_KEY = 'hermanas_feedback_dismissed';

export default function DeliveryFeedbackWidget({ order }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0); // 0=intro, 1=ratings, 2=comments, 3=done
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState({
    website: 0, food: 0, hotel: 0, reception: 0, service: 0
  });
  const [comments, setComments] = useState({
    website: '', food: '', hotel: '', reception: '', service: '', overall: ''
  });

  useEffect(() => {
    if (!order?.id) return;
    if (order.status !== 'delivered') return;

    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
    if (dismissed.includes(order.id)) return;

    const submitted = JSON.parse(localStorage.getItem('hermanas_feedback_submitted') || '[]');
    if (submitted.includes(order.id)) return;

    // Use a flag to avoid re-triggering if already visible
    setVisible(prev => {
      if (prev) return prev;
      return true; // show immediately, no delay needed
    });
  }, [order?.status, order?.id]);

  const dismiss = () => {
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
    dismissed.push(order.id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    setVisible(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Generate AI insights from the feedback
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a restaurant improvement AI for Hermanas Bites luxury restaurant. A customer just completed an order and provided the following feedback. Generate concise, actionable improvement suggestions.

ORDER ITEMS: ${order.items?.map(i => i.name).join(', ') || 'N/A'}

RATINGS (out of 5):
- Website/App: ${ratings.website}/5 — "${comments.website}"
- Food Quality: ${ratings.food}/5 — "${comments.food}"
- Hotel/Ambiance: ${ratings.hotel}/5 — "${comments.hotel}"
- Reception/Staff: ${ratings.reception}/5 — "${comments.reception}"
- Service: ${ratings.service}/5 — "${comments.service}"
- Overall: "${comments.overall}"

Provide specific, practical suggestions for improvement in each low-rated area. Be concise.`,
        response_json_schema: {
          type: "object",
          properties: {
            insights: { type: "string" },
            priority_areas: { type: "array", items: { type: "string" } }
          }
        }
      });

      await base44.entities.DeliveryFeedback.create({
        order_id: order.id,
        order_reference: order.order_reference,
        customer_email: order.customer_email,
        website_rating: ratings.website,
        food_rating: ratings.food,
        hotel_rating: ratings.hotel,
        reception_rating: ratings.reception,
        service_rating: ratings.service,
        website_comment: comments.website,
        food_comment: comments.food,
        hotel_comment: comments.hotel,
        reception_comment: comments.reception,
        service_comment: comments.service,
        overall_comment: comments.overall,
        ai_insights: aiResponse.insights,
        ordered_items: order.items?.map(i => i.name) || []
      });

      // Mark as submitted
      const submitted = JSON.parse(localStorage.getItem('hermanas_feedback_submitted') || '[]');
      submitted.push(order.id);
      localStorage.setItem('hermanas_feedback_submitted', JSON.stringify(submitted));

      setStep(3);
      setTimeout(() => setVisible(false), 3000);
      toast.success('Thank you for your feedback!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sections = [
    { key: 'website', label: 'Website & App', icon: Globe, placeholder: 'How was your ordering experience?' },
    { key: 'food', label: 'Food Quality', icon: ChefHat, placeholder: 'How was the food quality and taste?' },
    { key: 'hotel', label: 'Hotel & Ambiance', icon: Building2, placeholder: 'How was the overall atmosphere?' },
    { key: 'reception', label: 'Reception & Staff', icon: Users, placeholder: 'How was the staff and reception?' },
    { key: 'service', label: 'Delivery & Service', icon: Truck, placeholder: 'How was the delivery speed and service?' },
  ];

  const allRated = Object.values(ratings).every(r => r > 0);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            className="relative w-full max-w-lg bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#1a1a1a] px-6 pt-6 pb-4 border-b border-[#c9a962]/10 z-10">
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 p-1 rounded-full text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-[#c9a962]/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-[#c9a962]" />
                </div>
                <div>
                  <h3 className="font-playfair text-xl text-white">Share Your Experience</h3>
                  <p className="font-inter text-xs text-white/50">Order {order?.order_reference}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              {/* Step 0: Intro */}
              {step === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="font-inter text-sm text-white/70 mb-6 leading-relaxed">
                    Your order has been delivered! We'd love to hear about your experience with us. 
                    Your feedback helps us improve our food, service, and hospitality for you and future guests.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-full bg-[#c9a962] text-[#0a0a0a] font-inter font-medium text-sm hover:bg-[#e4d5a7] transition-colors"
                    >
                      Share Feedback
                    </button>
                    <button
                      onClick={dismiss}
                      className="flex-1 py-3 rounded-full border border-[#c9a962]/20 text-white/60 font-inter text-sm hover:bg-white/5 transition-colors"
                    >
                      No Thanks
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Ratings */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <p className="font-inter text-sm text-white/60 mb-4">Rate each area of your experience:</p>
                  {sections.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 text-[#c9a962] flex-shrink-0" />
                        <span className="font-inter text-sm text-white/80">{label}</span>
                      </div>
                      <StarRating
                        value={ratings[key]}
                        onChange={(val) => setRatings(prev => ({ ...prev, [key]: val }))}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setStep(2)}
                    disabled={!allRated}
                    className={`w-full mt-4 py-3 rounded-full font-inter font-medium text-sm transition-colors ${
                      allRated
                        ? 'bg-[#c9a962] text-[#0a0a0a] hover:bg-[#e4d5a7]'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Next — Add Comments
                  </button>
                </motion.div>
              )}

              {/* Step 2: Comments */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <p className="font-inter text-sm text-white/60 mb-2">Any additional thoughts? (optional)</p>
                  {sections.map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1 block">{label}</label>
                      <textarea
                        value={comments[key]}
                        onChange={(e) => setComments(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        rows={2}
                        className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 rounded-lg px-3 py-2 font-inter text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a962]/50 resize-none"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1 block">Overall Comment</label>
                    <textarea
                      value={comments.overall}
                      onChange={(e) => setComments(prev => ({ ...prev, overall: e.target.value }))}
                      placeholder="Anything else you'd like to share?"
                      rows={2}
                      className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 rounded-lg px-3 py-2 font-inter text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a962]/50 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-3 rounded-full bg-[#c9a962] text-[#0a0a0a] font-inter font-medium text-sm hover:bg-[#e4d5a7] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Step 3: Thank You */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 rounded-full bg-[#c9a962]/20 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 fill-[#c9a962] text-[#c9a962]" />
                  </div>
                  <h4 className="font-playfair text-2xl text-white mb-2">Thank You!</h4>
                  <p className="font-inter text-sm text-white/60">
                    Your feedback has been received and will help us make Hermanas Bites even better for you.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}