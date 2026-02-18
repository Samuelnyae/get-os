import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome to Hermanas Bites! I\'m your AI concierge. How may I assist you today? I can help with menu recommendations, reservations, order tracking, and more.',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Get context about the restaurant
      const menuItems = await base44.entities.MenuItem.list('-created_date', 50);
      
      const context = `You are an AI assistant for Hermanas Bites, a luxury seven-star restaurant. 
      
Current menu highlights:
${menuItems.slice(0, 10).map(item => `- ${item.name} (${item.category}): KES ${item.price} - ${item.description}`).join('\n')}

Restaurant information:
- We offer dine-in, takeout, and delivery
- Table reservations available
- Custom food requests accepted
- Payment at counter model
- Real-time order tracking available

Be helpful, professional, and embody luxury hospitality. If asked about specific menu items, recommend from the list. If asked about orders, guide them to the Order Tracking page. For reservations, guide them to the Reservations page.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${context}\n\nUser question: ${userMessage}\n\nProvide a helpful, concise response (2-3 sentences max):`,
        add_context_from_internet: false,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error('Sorry, I encountered an error. Please try again.');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I\'m having trouble responding right now. Please try again or contact our staff directly.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-[#c9a962] to-[#e4d5a7] shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          >
            <MessageCircle className="w-7 h-7 text-[#0a0a0a]" />
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-md h-[600px] bg-[#1a1a1a] rounded-2xl shadow-2xl border border-[#c9a962]/20 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#c9a962]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a962] to-[#e4d5a7] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#0a0a0a]" />
                </div>
                <div>
                  <h3 className="font-playfair text-lg text-white">AI Concierge</h3>
                  <p className="font-inter text-xs text-[#c9a962]">Hermanas Bites</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-[#c9a962]/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#c9a962] text-[#0a0a0a]'
                        : 'bg-[#0a0a0a] text-white border border-[#c9a962]/20'
                    }`}
                  >
                    <p className="font-inter text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#0a0a0a] rounded-2xl px-4 py-3 border border-[#c9a962]/20">
                    <Loader2 className="w-5 h-5 text-[#c9a962] animate-spin" />
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#c9a962]/20">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1 bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 rounded-full bg-[#c9a962] hover:bg-[#e4d5a7] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Send className="w-5 h-5 text-[#0a0a0a]" />
                </button>
              </div>
              <p className="font-inter text-xs text-white/40 mt-2 text-center">
                AI-powered assistance for your dining experience
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}