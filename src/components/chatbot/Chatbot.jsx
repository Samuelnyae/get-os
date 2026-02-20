import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Rate limiting
const RATE_LIMIT_KEY = 'chatbot_rate_limit';
const MAX_MESSAGES_PER_HOUR = 20;

const checkRateLimit = () => {
  const stored = localStorage.getItem(RATE_LIMIT_KEY);
  const data = stored ? JSON.parse(stored) : { count: 0, resetAt: Date.now() + 3600000 };
  
  if (Date.now() > data.resetAt) {
    data.count = 0;
    data.resetAt = Date.now() + 3600000;
  }
  
  if (data.count >= MAX_MESSAGES_PER_HOUR) {
    return false;
  }
  
  data.count++;
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  return true;
};

// Get or create session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('chat_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chat_session_id', sessionId);
  }
  return sessionId;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Get user identifier
  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await base44.auth.me();
        setUserIdentifier(user.email);
      } catch {
        setUserIdentifier(getSessionId());
      }
    };
    initUser();
  }, []);

  // Load or create conversation
  const { data: conversation } = useQuery({
    queryKey: ['chat-conversation', userIdentifier],
    queryFn: async () => {
      if (!userIdentifier) return null;
      
      const existing = await base44.entities.ChatConversation.filter({
        user_identifier: userIdentifier
      }, '-last_message_at', 1);
      
      if (existing.length > 0) {
        setConversationId(existing[0].id);
        return existing[0];
      }
      
      const newConv = await base44.entities.ChatConversation.create({
        user_identifier: userIdentifier,
        messages: [{
          role: 'assistant',
          content: 'Welcome to Hermanas Bites! I\'m your AI concierge. How may I assist you today? I can help with menu recommendations, reservations, order tracking, and more.',
          timestamp: new Date().toISOString()
        }],
        last_message_at: new Date().toISOString()
      });
      
      setConversationId(newConv.id);
      return newConv;
    },
    enabled: !!userIdentifier,
    staleTime: Infinity,
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  const messages = conversation?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateConversationMutation = useMutation({
    mutationFn: ({ messages }) => {
      return base44.entities.ChatConversation.update(conversationId, {
        messages,
        last_message_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-conversation', userIdentifier]);
    },
  });

  const clearConversationMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ChatConversation.delete(conversationId);
      const newConv = await base44.entities.ChatConversation.create({
        user_identifier: userIdentifier,
        messages: [{
          role: 'assistant',
          content: 'Welcome to Hermanas Bites! I\'m your AI concierge. How may I assist you today?',
          timestamp: new Date().toISOString()
        }],
        last_message_at: new Date().toISOString()
      });
      setConversationId(newConv.id);
      return newConv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-conversation', userIdentifier]);
      toast.success('Conversation cleared');
    },
  });

  const handleSend = async () => {
    if (!input.trim() || isLoading || !conversationId) return;

    // Rate limiting
    if (!checkRateLimit()) {
      toast.error('Rate limit exceeded. Please wait before sending more messages.');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    
    const newUserMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, newUserMsg];
    updateConversationMutation.mutate({ messages: updatedMessages });
    setIsLoading(true);

    try {
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

      const assistantMsg = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      
      updateConversationMutation.mutate({ messages: [...updatedMessages, assistantMsg] });
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error('Sorry, I encountered an error. Please try again.');
      
      const errorMsg = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again or contact our staff directly.',
        timestamp: new Date().toISOString()
      };
      
      updateConversationMutation.mutate({ messages: [...updatedMessages, errorMsg] });
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
            className="fixed bottom-6 right-6 z-50 w-full max-w-sm h-[500px] bg-[#1a1a1a] rounded-2xl shadow-2xl border border-[#c9a962]/20 flex flex-col"
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => clearConversationMutation.mutate()}
                  disabled={clearConversationMutation.isLoading}
                  className="w-8 h-8 rounded-full hover:bg-[#c9a962]/10 flex items-center justify-center transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4 text-white/70" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-[#c9a962]/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
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