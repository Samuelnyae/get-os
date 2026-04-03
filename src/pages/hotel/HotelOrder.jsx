/**
 * HotelOrder.jsx
 * Hotel-specific order page with:
 * - Cart review & quantity management
 * - Customer details form
 * - Pickup time selection
 * - WhatsApp order dispatch
 * - DB order record creation for tracking
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight,
  CheckCircle, Phone, User, Clock, MessageCircle, Mail, MapPin, Home
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import HotelLayout from '@/components/hotel/HotelLayout';
import LuxuryButton from '@/components/common/LuxuryButton';
import { sanitizeInput, sanitizeEmail, sanitizePhone, validateOrderData, orderRateLimiter } from '@/components/utils/security';
import { toast } from 'sonner';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build a pre-filled WhatsApp message URL */
function buildWhatsAppUrl(whatsappNumber, orderRef, customerInfo, cart, total, orderType) {
  const itemLines = cart
    .map(i => `  • ${i.name} x${i.quantity} — KES ${(i.price * i.quantity).toLocaleString()}`)
    .join('\n');

  const typeLabel = orderType === 'remote' ? '🚚 Remote/Delivery' : '🏨 In-Hotel Pickup';

  const message = [
    `🛒 *New Order: ${orderRef}*`,
    `📦 *Type: ${typeLabel}*`,
    ``,
    `👤 *Customer*`,
    `  Name: ${customerInfo.name}`,
    `  Phone: ${customerInfo.phone}`,
    `  Email: ${customerInfo.email}`,
    orderType === 'remote' && customerInfo.delivery_address ? `  Address: ${customerInfo.delivery_address}` : null,
    orderType === 'in_hotel' && customerInfo.table_room_number ? `  Table/Room: ${customerInfo.table_room_number}` : null,
    orderType === 'in_hotel' && customerInfo.pickup_time ? `  Pickup Time: ${customerInfo.pickup_time}` : null,
    ``,
    `🍽️ *Items Ordered*`,
    itemLines,
    ``,
    `💰 *Total: KES ${total.toLocaleString()}*`,
    customerInfo.special_instructions
      ? `\n📝 Note: ${customerInfo.special_instructions}`
      : null,
    ``,
    `_Sent via Hermanas Bites Online Ordering_`,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Generate a unique order reference */
const generateRef = () => `HB-${Date.now().toString().slice(-8)}`;

// ─── Component ───────────────────────────────────────────────────────────────

export default function HotelOrder() {
  const { slug } = useParams();
  const cartKey = `hermanas_cart_${slug}`;

  // ── Hotel data ──
  const { data: hotel, isLoading: hotelLoading } = useQuery({
    queryKey: ['hotel', slug],
    queryFn: () => base44.entities.Hotel.filter({ slug }),
    select: (data) => data[0],
  });

  // ── Cart state (hotel-specific localStorage cart) ──
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState(null); // 'remote' | 'in_hotel'
  const [step, setStep] = useState('type'); // 'type' | 'cart' | 'checkout' | 'confirmation'
  const [orderRef, setOrderRef] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  // ── Customer form ──
  const [customer, setCustomer] = useState({
    name: '', email: '', phone: '', pickup_time: '', delivery_address: '', special_instructions: '', table_room_number: '',
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(cartKey) || '[]');
    setCart(saved);
  }, [cartKey]);

  // ── Cart helpers ──
  const syncCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem(cartKey, JSON.stringify(newCart));
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { slug } }));
  };

  const updateQty = (idx, delta) => {
    const updated = [...cart];
    updated[idx].quantity = Math.max(1, updated[idx].quantity + delta);
    syncCart(updated);
  };

  const removeItem = (idx) => {
    syncCart(cart.filter((_, i) => i !== idx));
    toast.success('Item removed');
  };

  // ── Totals ──
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // ── Order mutation (saves to DB for tracking) ──
  const orderMutation = useMutation({
    mutationFn: (payload) => base44.entities.Order.create(payload),
    onSuccess: (order, variables) => {
      const ref = variables.order_reference;
      setOrderRef(ref);

      // Build WhatsApp URL if hotel has a number
      if (hotel?.whatsapp_number) {
        setWhatsappUrl(
          buildWhatsAppUrl(
            hotel.whatsapp_number,
            ref,
            customer,
            cart,
            total,
            orderType
          )
        );
      }

      // Clear cart
      localStorage.removeItem(cartKey);
      syncCart([]);
      setStep('confirmation');
    },
    onError: () => toast.error('Failed to place order. Please try again.'),
  });

  // ── Checkout handler ──
  const handlePlaceOrder = () => {
    // Sanitize inputs for security
    const safe = {
      customer_name: sanitizeInput(customer.name),
      customer_email: sanitizeEmail(customer.email),
      customer_phone: sanitizePhone(customer.phone),
      special_instructions: sanitizeInput(customer.special_instructions || ''),
      items: cart,
    };

    const { isValid, errors } = validateOrderData(safe);
    if (!isValid) { toast.error(errors[0]); return; }

    // Rate limiting per email
    if (!orderRateLimiter.canMakeRequest(safe.customer_email)) {
      toast.error('Too many orders. Please wait a minute before trying again.');
      return;
    }

    const ref = generateRef();
    orderMutation.mutate({
      ...safe,
      hotel_id: hotel.id,
      table_room_number: orderType === 'in_hotel' ? sanitizeInput(customer.table_room_number || '') : '',
      total_amount: total,
      payment_method: orderType === 'remote' ? 'Remote Delivery' : 'Pay at Counter',
      payment_status: 'pending',
      status: 'pending',
      order_reference: ref,
    });
  };

  // ── Loading / guards ──
  if (hotelLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Link to="/Hotels"><LuxuryButton>All Locations</LuxuryButton></Link>
      </div>
    );
  }

  // ── Confirmation screen ──
  if (step === 'confirmation') {
    return (
      <HotelLayout hotel={hotel}>
        <div className="min-h-screen py-16 px-4">
          <div className="max-w-lg mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8"
            >
              <CheckCircle className="w-12 h-12 text-green-400" />
            </motion.div>

            <h2 className="font-playfair text-4xl text-white mb-3">Order Placed!</h2>
            <p className="font-inter text-white/50 mb-2">Your order reference:</p>
            <p className="font-playfair text-3xl text-[#c9a962] font-bold tracking-wider mb-8">{orderRef}</p>

            {/* Order summary card */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-6 border border-[#c9a962]/10 text-left space-y-3">
              <p className="font-inter text-sm text-white"><span className="text-white/50">Customer:</span> {customer.name}</p>
              <p className="font-inter text-sm text-white"><span className="text-white/50">Phone:</span> {customer.phone}</p>
              {customer.pickup_time && (
                <p className="font-inter text-sm text-white"><span className="text-white/50">Pickup:</span> {customer.pickup_time}</p>
              )}
              <p className="font-inter text-sm text-white"><span className="text-white/50">Total:</span> <span className="text-[#c9a962] font-bold">KES {total.toLocaleString()}</span></p>
            </div>

            <div className="flex flex-col gap-3">
              {/* WhatsApp button — only shown if hotel has a WhatsApp number */}
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <LuxuryButton className="w-full bg-green-600 hover:bg-green-500 text-white">
                    <MessageCircle className="inline w-4 h-4 mr-2" />
                    Send Order via WhatsApp
                  </LuxuryButton>
                </a>
              )}
              <Link to={`/hotel/${slug}/track-order`}>
                <LuxuryButton variant="secondary" className="w-full">Track Order</LuxuryButton>
              </Link>
              <Link to={`/hotel/${slug}/menu`}>
                <LuxuryButton variant="ghost" className="w-full">Continue Shopping</LuxuryButton>
              </Link>
            </div>
          </div>
        </div>
      </HotelLayout>
    );
  }

  // ── Empty cart ──
  if (cart.length === 0 && step !== 'type' && step !== 'confirmation') {
    return (
      <HotelLayout hotel={hotel}>
        <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4 text-center">
          <ShoppingCart className="w-20 h-20 text-[#c9a962]/30 mb-6" />
          <h2 className="font-playfair text-3xl text-white mb-4">Your Cart is Empty</h2>
          <p className="font-inter text-white/50 mb-8">Browse the menu and add some items</p>
          <Link to={`/hotel/${slug}/menu`}>
            <LuxuryButton>Explore Menu <ArrowRight className="inline ml-2 w-4 h-4" /></LuxuryButton>
          </Link>
        </div>
      </HotelLayout>
    );
  }

  // ── Order type selector ──
  if (step === 'type') {
    return (
      <HotelLayout hotel={hotel}>
        <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4">
          <p className="font-inter text-xs tracking-[0.3em] text-[#c9a962] uppercase mb-3">How would you like to order?</p>
          <h1 className="font-playfair text-4xl text-white mb-12">Choose Order Type</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
            {/* In-Hotel */}
            <button
              onClick={() => { setOrderType('in_hotel'); setStep(cart.length ? 'cart' : 'cart'); }}
              className="group bg-[#1a1a1a] border border-[#c9a962]/20 hover:border-[#c9a962] rounded-2xl p-8 text-center transition-all duration-300 hover:bg-[#c9a962]/5"
            >
              <Home className="w-12 h-12 text-[#c9a962] mx-auto mb-4" />
              <h2 className="font-playfair text-2xl text-white mb-2">In-Hotel Order</h2>
              <p className="font-inter text-sm text-white/50">You're at {hotel.name}. Order & pick up from the counter.</p>
            </button>
            {/* Remote */}
            <button
              onClick={() => { setOrderType('remote'); setStep(cart.length ? 'cart' : 'cart'); }}
              className="group bg-[#1a1a1a] border border-[#c9a962]/20 hover:border-[#c9a962] rounded-2xl p-8 text-center transition-all duration-300 hover:bg-[#c9a962]/5"
            >
              <MapPin className="w-12 h-12 text-[#c9a962] mx-auto mb-4" />
              <h2 className="font-playfair text-2xl text-white mb-2">Remote Order</h2>
              <p className="font-inter text-sm text-white/50">Ordering from outside? We'll arrange delivery to your location.</p>
            </button>
          </div>
          {cart.length === 0 && (
            <p className="font-inter text-white/30 text-sm mt-8">Your cart is empty — <Link to={`/hotel/${slug}/menu`} className="text-[#c9a962] hover:underline">browse the menu first</Link></p>
          )}
        </div>
      </HotelLayout>
    );
  }

  // ── Main cart + checkout ──
  return (
    <HotelLayout hotel={hotel}>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page title */}
          <div className="text-center mb-10">
            <p className="font-inter text-xs tracking-[0.3em] text-[#c9a962] uppercase mb-2">
              {orderType === 'remote' ? '🚚 Remote Order' : '🏨 In-Hotel Order'} —{' '}
              {step === 'cart' ? 'Review Your Selection' : 'Complete Your Order'}
            </p>
            <h1 className="font-playfair text-4xl text-white">
              {step === 'cart' ? 'Your Cart' : 'Checkout'}
            </h1>
            <button onClick={() => setStep('type')} className="font-inter text-xs text-white/30 hover:text-[#c9a962] mt-2 transition-colors">← Change order type</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Left: cart items / customer form ── */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">

                {/* STEP 1: Cart items */}
                {step === 'cart' && (
                  <motion.div key="cart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    {cart.map((item, idx) => (
                      <div key={idx} className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#c9a962]/10 flex gap-4">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                          alt={item.name}
                          className="w-24 h-24 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-playfair text-lg text-white mb-1">{item.name}</h3>
                          <p className="font-inter text-[#c9a962]">KES {item.price?.toLocaleString()}</p>
                          <div className="flex items-center gap-4 mt-3">
                            {/* Quantity controls */}
                            <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-full p-1 border border-[#c9a962]/20">
                              <button onClick={() => updateQty(idx, -1)} className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-[#c9a962]/20">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-inter text-sm text-white">{item.quantity}</span>
                              <button onClick={() => updateQty(idx, 1)} className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-[#c9a962]/20">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right font-playfair text-xl text-white">
                          KES {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* STEP 2: Customer details */}
                {step === 'checkout' && (
                  <motion.div key="checkout" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
                      <h3 className="font-playfair text-xl text-white mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-[#c9a962]" /> Your Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                          <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Full Name *</label>
                          <Input value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} placeholder="Your name" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                        </div>
                        {/* Email */}
                        <div>
                          <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Email *</label>
                          <Input type="email" value={customer.email} onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))} placeholder="your@email.com" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                        </div>
                        {/* Phone */}
                        <div>
                          <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Phone *</label>
                          <Input type="tel" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} placeholder="+254 700 000 000" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                        </div>
                        {/* Conditional field: pickup time vs delivery address */}
                        {orderType === 'in_hotel' ? (
                          <>
                            <div>
                              <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                                🪑 Table / Room Number
                              </label>
                              <Input value={customer.table_room_number} onChange={e => setCustomer(c => ({ ...c, table_room_number: e.target.value }))} placeholder="e.g. Table 5 or Room 12" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                            </div>
                            <div>
                              <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                                <Clock className="inline w-3 h-3 mr-1" />Pickup Time
                              </label>
                              <Input type="time" value={customer.pickup_time} onChange={e => setCustomer(c => ({ ...c, pickup_time: e.target.value }))} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="md:col-span-2">
                            <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                              <MapPin className="inline w-3 h-3 mr-1" />Delivery Address *
                            </label>
                            <Input value={customer.delivery_address} onChange={e => setCustomer(c => ({ ...c, delivery_address: e.target.value }))} placeholder="Your full delivery address" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                          </div>
                        )}
                        </div>
                        {/* Special instructions */}
                      <div className="mt-4">
                        <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Special Instructions</label>
                        <Textarea value={customer.special_instructions} onChange={e => setCustomer(c => ({ ...c, special_instructions: e.target.value }))} placeholder="Allergies, preferences, etc." rows={3} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                      </div>
                    </div>

                    {/* WhatsApp notice */}
                    {hotel?.whatsapp_number && (
                      <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-inter text-sm text-green-300 font-medium">WhatsApp Confirmation</p>
                          <p className="font-inter text-xs text-green-300/70 mt-1">
                            After placing your order, you'll be able to send it directly to our WhatsApp for faster processing.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Right: Order summary ── */}
            <div className="lg:col-span-1">
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10 sticky top-24">
                <h3 className="font-playfair text-xl text-white mb-6">Order Summary</h3>

                <div className="space-y-2 mb-4">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="font-inter text-white/70">{item.name} ×{item.quantity}</span>
                      <span className="font-inter text-white">KES {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#c9a962]/20 pt-4">
                  <div className="flex justify-between pt-2">
                    <span className="font-playfair text-lg text-white">Total</span>
                    <span className="font-playfair text-2xl text-[#c9a962]">KES {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {step === 'cart' ? (
                    <LuxuryButton onClick={() => setStep('checkout')} className="w-full">
                      Proceed to Checkout <ArrowRight className="inline ml-2 w-4 h-4" />
                    </LuxuryButton>
                  ) : (
                    <>
                      <LuxuryButton onClick={handlePlaceOrder} disabled={orderMutation.isPending} className="w-full">
                        {orderMutation.isPending ? (
                          <><div className="w-4 h-4 border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a] rounded-full animate-spin mr-2 inline-block" /> Placing…</>
                        ) : (
                          <><CheckCircle className="inline w-4 h-4 mr-2" />Place Order</>
                        )}
                      </LuxuryButton>
                      <LuxuryButton variant="ghost" onClick={() => setStep('cart')} className="w-full">
                        ← Back to Cart
                      </LuxuryButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HotelLayout>
  );
}