import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, Users, Mail, Phone, 
  User, MessageSquare, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SectionHeader from '../components/common/SectionHeader';
import LuxuryButton from '../components/common/LuxuryButton';
import AIRecommendedSlots from '../components/reservations/AIRecommendedSlots';
import SEOHead from '../components/common/SEOHead';
import { sanitizeInput, sanitizeEmail, sanitizePhone } from '../components/utils/security';
import { toast } from 'sonner';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { useLanguage } from '@/lib/LanguageContext';

export default function Reservations() {
  const { t } = useLanguage();
  const [step, setStep] = useState('select'); // select, form, confirmation
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    special_requests: ''
  });
  const [confirmationCode, setConfirmationCode] = useState('');

  // Fetch existing reservations to check availability
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list('-created_date', 500),
  });

  // Time slots from 11:00 AM to 10:00 PM
  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  const partySizes = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];

  // Check availability for a specific date and time
  const checkAvailability = (date, time) => {
    if (!date || !time) return { available: true, count: 0 };
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const booked = reservations.filter(res => 
      res.reservation_date === dateStr && 
      res.reservation_time === time &&
      res.status !== 'cancelled'
    );
    
    // Max 5 tables per time slot
    const maxTables = 5;
    return {
      available: booked.length < maxTables,
      count: booked.length,
      remaining: maxTables - booked.length
    };
  };

  const reservationMutation = useMutation({
    mutationFn: async (reservationData) => {
      const availability = checkAvailability(selectedDate, selectedTime);
      
      // Generate confirmation code
      const code = `HB-RES-${Date.now().toString().slice(-6)}`;
      
      // Determine status based on availability
      const status = availability.available ? 'pending' : 'waitlist';
      
      const reservation = await base44.entities.Reservation.create({
        ...reservationData,
        reservation_date: format(selectedDate, 'yyyy-MM-dd'),
        reservation_time: selectedTime,
        party_size: partySize,
        confirmation_code: code,
        status
      });

      // Send confirmation email
      try {
        await base44.integrations.Core.SendEmail({
          to: reservationData.customer_email,
          subject: status === 'waitlist' 
            ? `Get OS - Waitlist Confirmation #${code}`
            : `Get OS - Reservation Confirmation #${code}`,
          body: `
Dear ${reservationData.customer_name},

${status === 'waitlist' 
  ? `Your reservation request has been added to our waiting list. We will contact you if a table becomes available.`
  : `Your table reservation has been confirmed!`
}

📋 Reservation Details:
- Confirmation Code: ${code}
- Date: ${format(selectedDate, 'EEEE, MMMM d, yyyy')}
- Time: ${selectedTime}
- Party Size: ${partySize} ${partySize === 1 ? 'guest' : 'guests'}
${reservationData.special_requests ? `- Special Requests: ${reservationData.special_requests}` : ''}

${status === 'pending' 
  ? `Please arrive 10 minutes before your reservation time. If you need to cancel or modify your reservation, please contact us at least 4 hours in advance.`
  : `You are currently on our waiting list. We will notify you via email or phone if a table becomes available.`
}

We look forward to serving you!

Best regards,
Get OS - Seven Star Dining
          `
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      return { reservation, code, status };
    },
    onSuccess: ({ code, status }) => {
      setConfirmationCode(code);
      setStep('confirmation');
      toast.success(status === 'waitlist' ? t('addedToWaitlist') : t('reservationConfirmedToast'),
        { description: `${t('confirmationCode')}: ${code}` }
      );
    },
    onError: (error) => {
      console.error('Reservation error:', error);
      toast.error(t('failedReservation'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }

    // Sanitize inputs
    const sanitizedData = {
      customer_name: sanitizeInput(formData.customer_name),
      customer_email: sanitizeEmail(formData.customer_email),
      customer_phone: sanitizePhone(formData.customer_phone),
      special_requests: sanitizeInput(formData.special_requests || '')
    };

    if (!sanitizedData.customer_name || !sanitizedData.customer_email || !sanitizedData.customer_phone) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    reservationMutation.mutate(sanitizedData);
  };

  const resetForm = () => {
    setStep('select');
    setSelectedDate(null);
    setSelectedTime('');
    setPartySize(2);
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      special_requests: ''
    });
    setConfirmationCode('');
  };

  // Confirmation Screen
  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
        <div className="max-w-2xl mx-auto text-center py-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-24 h-24 rounded-full bg-[#c9a962]/20 flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="w-12 h-12 text-[#c9a962]" />
          </motion.div>
          <h2 className="font-playfair text-4xl text-white mb-4">Reservation Confirmed!</h2>
          <p className="font-playfair text-2xl text-[#c9a962] mb-8">
            {confirmationCode}
          </p>
          <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-8 border border-[#c9a962]/10 text-left">
            <div className="space-y-3 font-inter text-sm text-white/70">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-[#c9a962]" />
                <span>{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#c9a962]" />
                <span>{selectedTime}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#c9a962]" />
                <span>{partySize} {partySize === 1 ? 'guest' : 'guests'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#c9a962]" />
                <span>Confirmation sent to {formData.customer_email}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <LuxuryButton onClick={resetForm}>
              Make Another Reservation
            </LuxuryButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <SEOHead 
        title="Table Reservations - Book Your Table Online"
        description="Reserve your table at Get OS. Easy online booking for luxury dining experience. Book now for fine dining, special occasions, and unforgettable meals."
        keywords="Get OS reservations, book table online, restaurant reservations, table booking, reserve table, dining reservations"
      />
      <div className="max-w-6xl mx-auto">
        <SectionHeader 
          subtitle="Reserve Your Table" 
          title="Book a Table" 
        />

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className={`flex items-center gap-2 ${step === 'select' ? 'text-[#c9a962]' : 'text-white/40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'select' ? 'border-[#c9a962] bg-[#c9a962]/20' : 'border-white/20'
            }`}>
              1
            </div>
            <span className="font-inter text-sm">Select Date & Time</span>
          </div>
          <div className="w-12 h-px bg-white/20" />
          <div className={`flex items-center gap-2 ${step === 'form' ? 'text-[#c9a962]' : 'text-white/40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'form' ? 'border-[#c9a962] bg-[#c9a962]/20' : 'border-white/20'
            }`}>
              2
            </div>
            <span className="font-inter text-sm">Your Details</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Calendar */}
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
                <h3 className="font-playfair text-xl text-white mb-4">Select Date</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 60)}
                  className="rounded-md border-0"
                />
              </div>

              {/* Time & Party Size */}
              <div className="space-y-6">
                {/* Party Size */}
                <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
                  <h3 className="font-playfair text-xl text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#c9a962]" />
                    Party Size
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {partySizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setPartySize(size)}
                        className={`py-3 rounded-lg font-inter text-sm transition-all ${
                          partySize === size
                            ? 'bg-[#c9a962] text-[#0a0a0a]'
                            : 'bg-[#0a0a0a] text-white/70 border border-[#c9a962]/20 hover:border-[#c9a962]/50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Recommended Slots */}
                {selectedDate && (
                  <div className="mb-4">
                    <AIRecommendedSlots 
                      selectedDate={selectedDate}
                      partySize={partySize}
                      onSelectTime={setSelectedTime}
                    />
                  </div>
                )}

                {/* Time Slots */}
                <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
                  <h3 className="font-playfair text-xl text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#c9a962]" />
                    All Available Times
                  </h3>
                  {!selectedDate ? (
                    <p className="font-inter text-sm text-white/50 text-center py-8">
                      Please select a date first
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                      {timeSlots.map(time => {
                        const availability = checkAvailability(selectedDate, time);
                        const isSelected = selectedTime === time;
                        
                        return (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            disabled={!availability.available}
                            className={`py-2 rounded-lg font-inter text-sm transition-all relative ${
                              isSelected
                                ? 'bg-[#c9a962] text-[#0a0a0a]'
                                : availability.available
                                ? 'bg-[#0a0a0a] text-white/70 border border-[#c9a962]/20 hover:border-[#c9a962]/50'
                                : 'bg-[#0a0a0a]/50 text-white/30 border border-white/5 cursor-not-allowed'
                            }`}
                          >
                            {time}
                            {!availability.available && (
                              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {selectedDate && selectedTime && (
                    <div className="mt-4 p-3 rounded-lg bg-[#c9a962]/10 border border-[#c9a962]/20">
                      <p className="font-inter text-xs text-[#c9a962]">
                        {checkAvailability(selectedDate, selectedTime).available
                          ? `✓ Available - ${checkAvailability(selectedDate, selectedTime).remaining} tables remaining`
                          : '⚠️ Fully booked - Will be added to waiting list'
                        }
                      </p>
                    </div>
                  )}
                </div>

                <LuxuryButton
                  onClick={() => setStep('form')}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full"
                >
                  Continue to Details
                </LuxuryButton>
              </div>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10 space-y-6">
                <div>
                  <h3 className="font-playfair text-2xl text-white mb-6">Your Details</h3>
                  
                  {/* Summary */}
                  <div className="bg-[#0a0a0a] rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-inter text-white/50 mb-1">Date</p>
                        <p className="font-inter text-white">{selectedDate && format(selectedDate, 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="font-inter text-white/50 mb-1">Time</p>
                        <p className="font-inter text-white">{selectedTime}</p>
                      </div>
                      <div>
                        <p className="font-inter text-white/50 mb-1">Guests</p>
                        <p className="font-inter text-white">{partySize}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a962]/50" />
                      <Input
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        placeholder="Your name"
                        className="pl-10 bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a962]/50" />
                      <Input
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                        placeholder="your@email.com"
                        className="pl-10 bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a962]/50" />
                    <Input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="pl-10 bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Special Requests
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-[#c9a962]/50" />
                    <Textarea
                      value={formData.special_requests}
                      onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                      placeholder="Dietary restrictions, occasion, seating preferences..."
                      rows={3}
                      className="pl-10 bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <LuxuryButton
                    type="button"
                    variant="secondary"
                    onClick={() => setStep('select')}
                    className="flex-1"
                  >
                    Back
                  </LuxuryButton>
                  <LuxuryButton
                    type="submit"
                    disabled={reservationMutation.isPending}
                    className="flex-1"
                  >
                    {reservationMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Reservation
                      </>
                    )}
                  </LuxuryButton>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}