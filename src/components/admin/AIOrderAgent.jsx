import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader2, ShoppingCart, Sparkles, User, Trash2, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AIOrderAgent() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI Order Agent 🤖 Tell me what you'd like to order in plain language, and I'll build the order for you. Try: *\"One spicy chicken main, no onions, and a mango juice\"*" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [isPlacing, setIsPlacing] = useState(false);
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-for-agent'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const menuSummary = menuItems.map(m =>
        `- ID: ${m.id} | Name: ${m.name} | Category: ${m.category} | Price: KES ${m.price} | Stock: ${m.stock_count ?? 'available'} | Dietary: ${m.dietary_tags?.join(', ') || 'none'}`
      ).join('\n');

      const currentCartText = cart.length > 0
        ? `Current cart: ${cart.map(c => `${c.name} x${c.quantity}`).join(', ')}`
        : 'Cart is empty.';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a friendly AI waiter at Digital Bites luxury restaurant. Help the customer place their order.

MENU AVAILABLE:
${menuSummary}

${currentCartText}

Customer says: "${userMsg}"

Instructions:
- Parse what they want and match to menu items (fuzzy match names)
- Handle modifications like "no onions" in special_instructions
- Suggest complementary upsells naturally if appropriate (e.g. suggest a drink with a main)
- Be friendly and conversational
- If something is out of stock (stock_count = 0), apologize and suggest alternatives

Respond with JSON:`,
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string", description: "Friendly conversational reply to the customer" },
            items_to_add: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  menu_item_id: { type: "string" },
                  name: { type: "string" },
                  price: { type: "number" },
                  quantity: { type: "number" },
                  special_note: { type: "string" }
                }
              }
            },
            upsell_suggestion: { type: "string" }
          }
        }
      });

      if (response.items_to_add?.length > 0) {
        setCart(prev => {
          const updated = [...prev];
          for (const item of response.items_to_add) {
            const idx = updated.findIndex(c => c.menu_item_id === item.menu_item_id);
            if (idx >= 0) {
              updated[idx].quantity += item.quantity;
            } else {
              updated.push({ ...item });
            }
          }
          return updated;
        });
      }

      let fullReply = response.reply;
      if (response.upsell_suggestion) {
        fullReply += `\n\n💡 *${response.upsell_suggestion}*`;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fullReply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble understanding that. Could you rephrase?' }]);
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setIsPlacing(true);
    try {
      const order = await base44.entities.Order.create({
        customer_name: 'Walk-in (AI Agent)',
        customer_email: 'agent@digitalbites.pos',
        items: cart.map(c => ({ menu_item_id: c.menu_item_id, name: c.name, price: c.price, quantity: c.quantity })),
        total_amount: cart.reduce((s, c) => s + c.price * c.quantity, 0),
        order_type: 'dine_in',
        status: 'pending',
        payment_method: 'Pay at Counter',
        payment_status: 'pending',
        order_reference: `AI-${Date.now().toString().slice(-6)}`,
        special_instructions: cart.filter(c => c.special_note).map(c => `${c.name}: ${c.special_note}`).join('; '),
      });
      qc.invalidateQueries({ queryKey: ['kds-orders'] });
      toast.success(`Order ${order.order_reference} sent to kitchen!`);
      setCart([]);
      setMessages(prev => [...prev, { role: 'assistant', content: `✅ Order placed! Reference: **${order.order_reference}**. It's been sent to the kitchen. Anything else?` }]);
    } catch (e) {
      toast.error('Failed to place order');
    } finally {
      setIsPlacing(false);
    }
  };

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh]">
      {/* Chat Panel */}
      <div className="lg:col-span-2 bg-[#111] rounded-2xl border border-[#c9a962]/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#c9a962]/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#c9a962]/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#c9a962]" />
          </div>
          <div>
            <p className="font-playfair text-white text-sm">AI Order Agent</p>
            <p className="font-inter text-xs text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#c9a962]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-[#c9a962]" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm font-inter leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-[#c9a962] text-[#0a0a0a] rounded-br-sm'
                    : 'bg-[#1a1a1a] text-white/90 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-white/60" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-[#c9a962]/20 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-[#c9a962]" />
              </div>
              <div className="bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-bl-sm">
                <Loader2 className="w-4 h-4 text-[#c9a962] animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-[#c9a962]/10 flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="e.g. Two grilled chicken mains and a passion juice..."
            className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30 flex-1"
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="px-4 py-2 rounded-xl bg-[#c9a962] hover:bg-[#e4d5a7] text-[#0a0a0a] transition-all disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="bg-[#111] rounded-2xl border border-[#c9a962]/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#c9a962]/10 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#c9a962]" />
          <span className="font-playfair text-white">Order Cart</span>
          <span className="ml-auto text-xs font-inter text-white/40">{cart.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-inter text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map((item, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-xl p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-sm text-white truncate">{item.name}</p>
                  {item.special_note && <p className="font-inter text-xs text-amber-400 truncate">⚠ {item.special_note}</p>}
                  <p className="font-inter text-xs text-[#c9a962]">KES {(item.price * item.quantity).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-inter text-sm text-white/60">×{item.quantity}</span>
                  <button onClick={() => setCart(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400/60 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-[#c9a962]/10 space-y-3">
            <div className="flex justify-between font-inter text-sm">
              <span className="text-white/60">Total</span>
              <span className="text-[#c9a962] font-bold">KES {total.toLocaleString()}</span>
            </div>
            <button onClick={placeOrder} disabled={isPlacing}
              className="w-full py-2.5 rounded-xl bg-[#c9a962] hover:bg-[#e4d5a7] text-[#0a0a0a] font-inter font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isPlacing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {isPlacing ? 'Placing...' : 'Send to Kitchen'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}