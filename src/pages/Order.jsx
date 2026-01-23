import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Trash2, Plus, Minus, ArrowRight,
  CreditCard, Smartphone, Receipt, CheckCircle,
  Mail, Phone, User, MapPin, MessageSquare
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionHeader from '../components/common/SectionHeader';
import LuxuryButton from '../components/common/LuxuryButton';
import { toast } from 'sonner';

export default function Order() {
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState('cart'); // cart, checkout, confirmation
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    special_instructions: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderReference, setOrderReference] = useState('');

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
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const orderMutation = useMutation({
    mutationFn: async (orderData) => {
      const order = await base44.entities.Order.create(orderData);
      
      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: orderData.customer_email,
        subject: `Hermanas Bites - Order Confirmation #${orderData.order_reference}`,
        body: `
Dear ${orderData.customer_name},

Thank you for your order at Hermanas Bites!

Order Reference: ${orderData.order_reference}
Total Amount: KES ${orderData.total_amount.toLocaleString()}

Order Details:
${orderData.items.map(item => `- ${item.name} x${item.quantity} - KES ${(item.price * item.quantity).toLocaleString()}`).join('\n')}

We will prepare your order with love and care.

Best regards,
Hermanas Bites - Seven Star Dining
        `
      });

      return order;
    },
    onSuccess: (order) => {
      setOrderReference(order.order_reference || `HB-${Date.now()}`);
      setStep('confirmation');
      localStorage.removeItem('hermanas_cart');
      setCart([]);
      window.dispatchEvent(new Event('cartUpdated'));
    },
    onError: () => {
      toast.error('Failed to place order. Please try again.');
    },
  });

  const handleCheckout = () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    const reference = `HB-${Date.now().toString().slice(-8)}`;
    
    orderMutation.mutate({
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      items: cart,
      total_amount: total,
      payment_method: paymentMethod,
      payment_status: 'paid',
      status: 'confirmed',
      order_reference: reference,
      special_instructions: customerInfo.special_instructions
    });
  };

  const paymentMethods = [
    { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { id: 'mobile_money', label: 'M-Pesa', icon: Smartphone },
    { id: 'paypal', label: 'PayPal', icon: Receipt },
  ];

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
            className="w-24 h-24 rounded-full bg-[#c9a962]/20 flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="w-12 h-12 text-[#c9a962]" />
          </motion.div>
          <h2 className="font-playfair text-4xl text-white mb-4">Order Confirmed!</h2>
          <p className="font-inter text-white/60 mb-2">Thank you for your order</p>
          <p className="font-playfair text-2xl text-[#c9a962] mb-8">
            Reference: {orderReference}
          </p>
          <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-8 border border-[#c9a962]/10 text-left">
            <div className="flex items-center gap-2 text-[#c9a962] mb-4">
              <Mail className="w-5 h-5" />
              <span className="font-inter text-sm">Confirmation sent to {customerInfo.email}</span>
            </div>
            <p className="font-inter text-white/50 text-sm">
              You will receive an SMS notification when your order is ready.
            </p>
          </div>
          <Link to={createPageUrl('Menu')}>
            <LuxuryButton variant="secondary">
              Continue Shopping
            </LuxuryButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader 
          subtitle={step === 'cart' ? 'Review Your Selection' : 'Complete Your Order'} 
          title={step === 'cart' ? 'Your Cart' : 'Checkout'} 
        />

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
                        <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                          Full Name *
                        </label>
                        <Input
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                          placeholder="Your name"
                          className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                        />
                      </div>
                      <div>
                        <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                          Email *
                        </label>
                        <Input
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                          placeholder="your@email.com"
                          className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                        />
                      </div>
                      <div>
                        <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                          Phone *
                        </label>
                        <Input
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                        />
                      </div>
                      <div>
                        <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                          Room/Table Number
                        </label>
                        <Input
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                          placeholder="e.g., Room 302"
                          className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                        Special Instructions
                      </label>
                      <Textarea
                        value={customerInfo.special_instructions}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, special_instructions: e.target.value })}
                        placeholder="Any dietary requirements or special requests..."
                        rows={3}
                        className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
                    <h3 className="font-playfair text-xl text-white mb-6 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#c9a962]" />
                      Payment Method
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            paymentMethod === method.id
                              ? 'border-[#c9a962] bg-[#c9a962]/10'
                              : 'border-[#c9a962]/20 hover:border-[#c9a962]/50'
                          }`}
                        >
                          <method.icon className={`w-6 h-6 ${
                            paymentMethod === method.id ? 'text-[#c9a962]' : 'text-white/50'
                          }`} />
                          <span className={`font-inter text-sm ${
                            paymentMethod === method.id ? 'text-[#c9a962]' : 'text-white/70'
                          }`}>
                            {method.label}
                          </span>
                        </button>
                      ))}
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

              <div className="border-t border-[#c9a962]/20 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-inter text-white/50">Subtotal</span>
                  <span className="font-inter text-white">KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-inter text-white/50">Tax (10%)</span>
                  <span className="font-inter text-white">KES {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[#c9a962]/20">
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
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="inline w-4 h-4 mr-2" />
                          Confirm Payment
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