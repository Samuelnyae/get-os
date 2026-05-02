import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Trash2, Plus, Minus, ArrowRight,
  CheckCircle, Mail, Phone, User, Clock, MapPin, Package, Utensils
} from 'lucide-react';
import WhatsAppNotifier, { notifyAllStaff } from '../components/admin/WhatsAppNotifier';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionHeader from '../components/common/SectionHeader';
import LuxuryButton from '../components/common/LuxuryButton';
import SEOHead from '../components/common/SEOHead';
import { sanitizeInput, sanitizeEmail, sanitizePhone, validateOrderData, orderRateLimiter } from '../components/utils/security';
import { toast } from 'sonner';
import OrderReceipt from '../components/order/OrderReceipt';

export default function Order() {
  const [cart, setCart] = useState([]);

  const { data: allStaff = [] } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => base44.entities.Staff.list(),
  });
  const [step, setStep] = useState('cart'); // cart, checkout, confirmation
  const [orderType, setOrderType] = useState('takeaway'); // dine_in, takeaway, delivery
  const [pickupTime, setPickupTime] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    special_instructions: ''
  });
  const [orderReference, setOrderReference] = useState('');
  const [staffNotifyLinks, setStaffNotifyLinks] = useState([]);

  // Generate pickup time slots (next 2 hours to closing)
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const start = new Date(now.getTime() + 30 * 60 * 1000); // 30 min from now
    start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0);
    const end = new Date();
    end.setHours(22, 0, 0, 0);
    while (start <= end) {
      slots.push(start.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true }));
      start.setMinutes(start.getMinutes() + 30);
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('hermanas_cart') || '[]');
    setCart(savedCart);
  }, []);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('hermanas_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    updateCart(newCart);
  };

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    updateCart(newCart);
    toast.success('Item removed from cart');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  const orderMutation = useMutation({
    mutationFn: async (orderData) => {
      try {
        // Create the order first
        const order = await base44.entities.Order.create(orderData);
        
        // Send email notification with tracking info
        try {
          await base44.integrations.Core.SendEmail({
            to: orderData.customer_email,
            subject: `Digital Bites - Order Confirmation #${orderData.order_reference}`,
            body: `
Dear ${orderData.customer_name},

Thank you for your order at Digital Bites!
...
Best regards,
Digital Bites - Seven Star Dining
            `
          });
          toast.success('Order confirmation email sent!');
        } catch (emailError) {
          console.error('Email error:', emailError);
          toast.warning('Order placed but email failed to send. Your order reference is: ' + orderData.order_reference);
        }

        return order;
      } catch (error) {
        console.error('Order creation error:', error);
        throw error;
      }
    },
    onSuccess: (order) => {
      setOrderReference(order.order_reference);
      setStep('confirmation');
      // Save cart snapshot for receipt before clearing
      localStorage.setItem('hermanas_cart_last', localStorage.getItem('hermanas_cart') || '[]');
      localStorage.removeItem('hermanas_cart');
      setCart([]);
      window.dispatchEvent(new Event('cartUpdated'));
      // Notify all staff via WhatsApp (auto-opens tabs)
      const links = notifyAllStaff(allStaff, order);
      setStaffNotifyLinks(links);
    },
    onError: (error) => {
      console.error('Order mutation error:', error);
      toast.error('Failed to place order. Please try again.');
    },
  });

  const handleCheckout = () => {
    // Sanitize inputs
    const sanitizedData = {
      customer_name: sanitizeInput(customerInfo.name),
      customer_email: sanitizeEmail(customerInfo.email),
      customer_phone: sanitizePhone(customerInfo.phone),
      special_instructions: sanitizeInput(customerInfo.special_instructions || ''),
      items: cart,
    };

    // Validate
    const validation = validateOrderData(sanitizedData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    // Rate limiting
    if (!orderRateLimiter.canMakeRequest(sanitizedData.customer_email)) {
      toast.error('Too many orders. Please wait a minute before trying again.');
      return;
    }

    const reference = `HB-${Date.now().toString().slice(-8)}`;
    
    if ((orderType === 'takeaway' || orderType === 'delivery') && !pickupTime) {
      toast.error('Please select a pickup/delivery time');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }

    orderMutation.mutate({
      ...sanitizedData,
      total_amount: total,
      payment_method: 'Pay at Counter',
      payment_status: 'pending',
      status: 'pending',
      order_reference: reference,
      order_type: orderType,
      pickup_time: pickupTime || null,
      pickup_date: pickupDate || new Date().toLocaleDateString('en-KE'),
      delivery_address: orderType === 'delivery' ? deliveryAddress : null,
      table_room_number: orderType === 'dine_in' ? customerInfo.address : null,
    });
  };



  // Empty Cart
  if (cart.length === 0 && step === 'cart') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <ShoppingCart className="w-20 h-20 text-[#c9a962]/30 mx-auto mb-6" />
          <h2 className="font-playfair text-3xl text-white mb-4">Your Cart is Empty</h2>
          <p className="font-inter text-white/50 mb-8">
            Discover our exquisite menu and add some delicious items
          </p>
          <Link to={createPageUrl('Menu')}>
            <LuxuryButton>
              Explore Menu <ArrowRight className="inline ml-2 w-4 h-4" />
            </LuxuryButton>
          </Link>
        </div>
      </div>
    );
  }

  // Confirmation
  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
        <div className="max-w-2xl mx-auto text-center py-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="w-12 h-12 text-green-400" />
          </motion.div>
          <h2 className="font-playfair text-4xl text-white mb-4">✅ Order Received!</h2>
          <p className="font-inter text-white/60 mb-2">
            Download your receipt and present it at the cashier to complete payment
          </p>
          <p className="font-playfair text-3xl text-[#c9a962] mb-8 font-bold tracking-wider">
            {orderReference}
          </p>
          <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-8 border border-[#c9a962]/10 text-left space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-inter font-medium">Order Placed Successfully</span>
            </div>

            {/* Downloadable Receipt */}
            <OrderReceipt
              orderReference={orderReference}
              customerInfo={customerInfo}
              cart={cart.length > 0 ? cart : (JSON.parse(localStorage.getItem('hermanas_cart_last') || '[]'))}
              total={total}
              orderType={orderType}
              pickupTime={pickupTime}
              deliveryAddress={deliveryAddress}
            />

            <div className="flex items-center gap-2 text-[#c9a962]/70 text-xs">
              <Mail className="w-4 h-4" />
              <span>Confirmation sent to {customerInfo.email}</span>
            </div>

            {/* Staff notification links (in case browser blocked auto-open) */}
            {staffNotifyLinks.length > 0 && (
              <div className="pt-2 border-t border-[#c9a962]/10">
                <p className="font-inter text-xs text-white/40 mb-2">📲 Kitchen Staff Notifications (tap if not auto-sent):</p>
                <div className="flex flex-wrap gap-2">
                  {staffNotifyLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-inter font-medium transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {customerInfo.phone && (
              <div className="pt-2">
                <p className="font-inter text-xs text-white/40 mb-2">Send yourself a WhatsApp reminder:</p>
                <WhatsAppNotifier
                  order={{
                    customer_name: customerInfo.name,
                    customer_phone: customerInfo.phone,
                    order_reference: orderReference,
                    order_type: orderType,
                    pickup_time: pickupTime,
                    delivery_address: deliveryAddress,
                    total_amount: total,
                    items: cart,
                  }}
                  status="confirmed"
                  size="md"
                  label="📲 Save to WhatsApp"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl('OrderTracking')} className="flex-1">
              <LuxuryButton className="w-full">
                Track Order
              </LuxuryButton>
            </Link>
            <Link to={createPageUrl('Menu')} className="flex-1">
              <LuxuryButton variant="secondary" className="w-full">
                Continue Shopping
              </LuxuryButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <SEOHead 
        title="Order Now - Online Food Ordering & Delivery"
        description="Order gourmet food online from Digital Bites. Easy checkout, secure payment, fast delivery. Enjoy seven-star luxury dining at home or dine-in."
        keywords="Digital Bites order, order food online, food delivery, online ordering, checkout, place order, gourmet delivery"
      />
      <div className="max-w-6xl mx-auto">
        <SectionHeader 
          subtitle={step === 'cart' ? 'Review Your Selection' : 'Complete Your Order'} 
          title={step === 'cart' ? 'Your Cart' : 'Checkout'} 
        />

        {/* Order Type Selector - show on cart and checkout */}
        {step !== 'confirmation' && (
          <div className="mb-8">
            <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-3">How would you like to receive your order?</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'dine_in', label: 'Dine In', icon: Utensils, desc: 'Eat at the restaurant' },
                { id: 'takeaway', label: 'Takeaway', icon: Package, desc: 'Pick up your order' },
                { id: 'delivery', label: 'Delivery', icon: MapPin, desc: 'Get it delivered' },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setOrderType(type.id)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    orderType === type.id
                      ? 'bg-[#c9a962]/10 border-[#c9a962] text-[#c9a962]'
                      : 'bg-[#1a1a1a] border-[#c9a962]/10 text-white/60 hover:border-[#c9a962]/30'
                  }`}
                >
                  <type.icon className="w-5 h-5 mb-2" />
                  <p className="font-inter font-medium text-sm">{type.label}</p>
                  <p className="font-inter text-xs opacity-60 mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {step === 'cart' ? (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {cart.map((item, index) => (
                    <div
                      key={index}
                      className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#c9a962]/10 flex gap-4"
                    >
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                        alt={item.name}
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-playfair text-lg text-white mb-1">{item.name}</h3>
                        <p className="font-inter text-[#c9a962]">KES {item.price?.toLocaleString()}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-full p-1 border border-[#c9a962]/20">
                            <button
                              onClick={() => updateQuantity(index, -1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-[#c9a962]/20"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-inter text-sm text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(index, 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-[#c9a962]/20"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-playfair text-xl text-white">
                          KES {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="checkout"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Customer Info */}
                  <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
                    <h3 className="font-playfair text-xl text-white mb-6 flex items-center gap-2">
                      <User className="w-5 h-5 text-[#c9a962]" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Full Name *</label>
                        <Input value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} placeholder="Your name" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                      </div>
                      <div>
                        <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Email *</label>
                        <Input type="email" value={customerInfo.email} onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })} placeholder="your@email.com" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                      </div>
                      <div>
                        <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Phone *</label>
                        <Input type="tel" value={customerInfo.phone} onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} placeholder="+254 700 000 000" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                      </div>
                      {orderType === 'dine_in' && (
                        <div>
                          <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Table Number</label>
                          <Input value={customerInfo.address} onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })} placeholder="e.g., Table 5" className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                        </div>
                      )}
                    </div>

                    {/* Pickup/Delivery Fields */}
                    {(orderType === 'takeaway' || orderType === 'delivery') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                            <Clock className="inline w-3 h-3 mr-1" />
                            {orderType === 'takeaway' ? 'Pickup Time *' : 'Delivery Time *'}
                          </label>
                          <select
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full h-9 rounded-md border border-[#c9a962]/20 bg-[#0a0a0a] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c9a962]"
                          >
                            <option value="">Select a time...</option>
                            {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                          </select>
                        </div>
                        {orderType === 'delivery' && (
                          <div>
                            <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                              <MapPin className="inline w-3 h-3 mr-1" />
                              Delivery Address *
                            </label>
                            <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Street, area, landmark..." className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Special Instructions</label>
                      <Textarea value={customerInfo.special_instructions} onChange={(e) => setCustomerInfo({ ...customerInfo, special_instructions: e.target.value })} placeholder="Any dietary requirements or special requests..." rows={3} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30" />
                    </div>
                  </div>

                  {/* Payment Notice */}
                  <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#c9a962]/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-[#c9a962]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-playfair text-xl text-white mb-2">
                          Pay at Counter
                        </h3>
                        <p className="font-inter text-sm text-white/70 mb-3">
                          After placing your order, please visit our cashier counter to complete your payment. 
                          Show your Order ID to the staff.
                        </p>
                        <div className="bg-[#c9a962]/10 rounded-lg p-3 border border-[#c9a962]/20">
                          <p className="font-inter text-xs text-[#c9a962] font-medium">
                            ✓ Cash accepted
                          </p>
                          <p className="font-inter text-xs text-[#c9a962] font-medium">
                            ✓ Card payments at counter
                          </p>
                          <p className="font-inter text-xs text-[#c9a962] font-medium">
                            ✓ Mobile money at counter
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10 sticky top-24">
              <h3 className="font-playfair text-xl text-white mb-6">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="font-inter text-white/70">{item.name} x{item.quantity}</span>
                    <span className="font-inter text-white">KES {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#c9a962]/20 pt-4">
                <div className="flex justify-between pt-3">
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
                    <LuxuryButton 
                      onClick={handleCheckout} 
                      className="w-full"
                      disabled={orderMutation.isPending}
                    >
                      {orderMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a] rounded-full animate-spin mr-2" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="inline w-4 h-4 mr-2" />
                          Place Order
                        </>
                      )}
                    </LuxuryButton>
                    <LuxuryButton variant="ghost" onClick={() => setStep('cart')} className="w-full">
                      Back to Cart
                    </LuxuryButton>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}