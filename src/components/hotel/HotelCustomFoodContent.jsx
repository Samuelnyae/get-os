import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChefHat, Plus, X, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import LuxuryButton from '@/components/common/LuxuryButton';
import SectionHeader from '@/components/common/SectionHeader';
import { toast } from 'sonner';

export default function HotelCustomFoodContent({ hotel }) {
  const [submitted, setSubmitted] = useState(false);
  const [ingredient, setIngredient] = useState('');
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    preferred_dish_name: '', food_category: 'non_vegetarian',
    spice_level: 'medium', cooking_style: 'chefs_choice', portion_size: 'medium',
    ingredients_include: [], ingredients_exclude: [], special_instructions: '',
  });

  const createRequest = useMutation({
    mutationFn: (data) => base44.entities.CustomFoodRequest.create(data),
    onSuccess: () => { setSubmitted(true); toast.success('Custom request submitted!'); },
  });

  const addIngredient = (type) => {
    if (!ingredient.trim()) return;
    setForm(f => ({ ...f, [type]: [...f[type], ingredient.trim()] }));
    setIngredient('');
  };

  const removeIngredient = (type, idx) =>
    setForm(f => ({ ...f, [type]: f[type].filter((_, i) => i !== idx) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_email || !form.customer_phone) { toast.error('Please fill in contact details'); return; }
    createRequest.mutate(form);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-16 px-4 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-[#c9a962]/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-[#c9a962]" />
          </div>
          <h3 className="font-playfair text-3xl text-white mb-3">Request Submitted!</h3>
          <p className="font-inter text-white/60 mb-8">Our chef at {hotel?.name} will review your custom request and get back to you soon.</p>
          <LuxuryButton onClick={() => setSubmitted(false)}>Submit Another</LuxuryButton>
        </motion.div>
      </div>
    );
  }

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">{label}</label>
      <Input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" />
    </div>
  );

  const selectField = (label, key, options) => (
    <div>
      <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">{label}</label>
      <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#c9a962]/50">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <SectionHeader title="Customize Your Order" subtitle={hotel?.name || 'Your Dish, Your Way'} />
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-6">
          {/* Contact */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
            <h3 className="font-playfair text-xl text-white mb-4 flex items-center gap-2"><ChefHat className="w-5 h-5 text-[#c9a962]" />Contact Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Name *', 'customer_name', 'text', 'Your full name')}
              {field('Email *', 'customer_email', 'email', 'your@email.com')}
              {field('Phone *', 'customer_phone', 'tel', '+254 ...')}
              {field('Dish Name', 'preferred_dish_name', 'text', 'e.g. Spicy Grilled Tilapia')}
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
            <h3 className="font-playfair text-xl text-white mb-4">Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {selectField('Category', 'food_category', [
                { value: 'vegetarian', label: 'Vegetarian' }, { value: 'vegan', label: 'Vegan' },
                { value: 'non_vegetarian', label: 'Non-Vegetarian' }, { value: 'seafood', label: 'Seafood' },
                { value: 'dessert', label: 'Dessert' }, { value: 'drinks', label: 'Drinks' },
              ])}
              {selectField('Spice Level', 'spice_level', [
                { value: 'mild', label: 'Mild' }, { value: 'medium', label: 'Medium' }, { value: 'hot', label: 'Hot' },
              ])}
              {selectField('Cooking Style', 'cooking_style', [
                { value: 'grilled', label: 'Grilled' }, { value: 'fried', label: 'Fried' },
                { value: 'steamed', label: 'Steamed' }, { value: 'baked', label: 'Baked' },
                { value: 'chefs_choice', label: "Chef's Choice" },
              ])}
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
            <h3 className="font-playfair text-xl text-white mb-4">Ingredients</h3>
            <div className="flex gap-2 mb-3">
              <Input value={ingredient} onChange={e => setIngredient(e.target.value)} placeholder="Add ingredient..." className="bg-[#0a0a0a] border-[#c9a962]/20 text-white" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIngredient('ingredients_include'))} />
              <button type="button" onClick={() => addIngredient('ingredients_include')} className="px-4 py-2 rounded-lg bg-[#c9a962]/10 text-[#c9a962] hover:bg-[#c9a962]/20 transition-colors"><Plus className="w-4 h-4" /></button>
              <button type="button" onClick={() => addIngredient('ingredients_exclude')} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-inter">Exclude</button>
            </div>
            {form.ingredients_include.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs text-[#c9a962] font-inter">Include:</span>
                {form.ingredients_include.map((ing, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#c9a962]/10 text-[#c9a962] text-xs font-inter">
                    {ing}<button type="button" onClick={() => removeIngredient('ingredients_include', i)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            {form.ingredients_exclude.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-red-400 font-inter">Exclude:</span>
                {form.ingredients_exclude.map((ing, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-inter">
                    {ing}<button type="button" onClick={() => removeIngredient('ingredients_exclude', i)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Special Instructions */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
            <label className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 block">Special Instructions</label>
            <textarea value={form.special_instructions} onChange={e => setForm(f => ({ ...f, special_instructions: e.target.value }))} placeholder="Any other instructions for the chef..." rows={3} className="w-full bg-[#0a0a0a] border border-[#c9a962]/20 rounded-lg px-3 py-2 font-inter text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a962]/50 resize-none" />
          </div>

          <LuxuryButton type="submit" disabled={createRequest.isPending} className="w-full">
            {createRequest.isPending ? 'Submitting...' : 'Submit Custom Order'}
          </LuxuryButton>
        </motion.form>
      </div>
    </div>
  );
}