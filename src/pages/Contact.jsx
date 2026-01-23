import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Mail, Phone, MapPin, Clock, Send, 
  Instagram, Facebook, Twitter, MessageCircle
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionHeader from '../components/common/SectionHeader';
import LuxuryButton from '../components/common/LuxuryButton';
import { toast } from 'sonner';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Send confirmation email to customer
      await base44.integrations.Core.SendEmail({
        to: formData.email,
        subject: `Hermanas Bites - We Received Your Message`,
        body: `
Dear ${formData.name},

Thank you for contacting Hermanas Bites! We have received your message and will get back to you within 24 hours.

Your Message:
${formData.message}

Best regards,
Hermanas Bites - Seven Star Dining
        `
      });

      toast.success('Message received!', {
        description: 'Check your email for confirmation. We will respond within 24 hours.'
      });
      
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send message. Please check your email address and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: MapPin, label: 'Address', value: '123 Luxury Avenue, Diamond District' },
    { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567' },
    { icon: Mail, label: 'Email', value: 'hello@hermanasbites.com' },
    { icon: Clock, label: 'Hours', value: 'Mon-Sun: 11:00 AM - 11:00 PM' },
  ];

  const socialLinks = [
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: MessageCircle, label: 'WhatsApp', href: '#' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader 
          subtitle="Get in Touch" 
          title="Contact Us" 
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10"
          >
            <h3 className="font-playfair text-2xl text-white mb-6">Send us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30 focus:border-[#c9a962]"
                  />
                </div>
                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30 focus:border-[#c9a962]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30 focus:border-[#c9a962]"
                  />
                </div>
                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Subject
                  </label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Reservation inquiry"
                    className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30 focus:border-[#c9a962]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Message *
                </label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us how we can assist you..."
                  rows={5}
                  className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30 focus:border-[#c9a962]"
                />
              </div>
              <LuxuryButton type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a] rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </LuxuryButton>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactInfo.map((info, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all"
                >
                  <info.icon className="w-6 h-6 text-[#c9a962] mb-3" />
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-1">
                    {info.label}
                  </p>
                  <p className="font-inter text-white/80">{info.value}</p>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="p-6 rounded-2xl bg-[#1a1a1a]/50 border border-[#c9a962]/10">
              <h4 className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-4">
                Follow Us
              </h4>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-12 h-12 rounded-full bg-[#0a0a0a] border border-[#c9a962]/20 flex items-center justify-center hover:bg-[#c9a962]/10 hover:border-[#c9a962]/50 transition-all"
                  >
                    <social.icon className="w-5 h-5 text-[#c9a962]" />
                  </a>
                ))}
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="relative h-64 rounded-2xl overflow-hidden border border-[#c9a962]/10">
              <img
                src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=800"
                alt="Location"
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/50">
                <div className="text-center">
                  <MapPin className="w-10 h-10 text-[#c9a962] mx-auto mb-2" />
                  <p className="font-playfair text-xl text-white">123 Luxury Avenue</p>
                  <p className="font-inter text-sm text-white/60">Diamond District</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}