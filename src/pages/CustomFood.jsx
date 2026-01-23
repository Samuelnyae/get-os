import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ChefHat, Sparkles, Upload, Check, X, 
  Flame, Leaf, Clock, DollarSign, Send
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import SectionHeader from '../components/common/SectionHeader';
import LuxuryButton from '../components/common/LuxuryButton';
import { toast } from 'sonner';

export default function CustomFood() {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    preferred_dish_name: '',
    food_category: '',
    ingredients_include: [],
    ingredients_exclude: [],
    spice_level: 'medium',
    cooking_style: 'chefs_choice',
    portion_size: 'medium',
    dietary_preferences: [],
    budget_range: '',
    special_instructions: '',
    preferred_time: '',
    reference_image_url: '',
  });

  const [ingredientInput, setIngredientInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomFoodRequest.create(data),
    onSuccess: () => {
      toast.success('Your custom dish request has been received!', {
        description: 'Our chef will contact you shortly.',
        duration: 5000,
      });
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        preferred_dish_name: '',
        food_category: '',
        ingredients_include: [],
        ingredients_exclude: [],
        spice_level: 'medium',
        cooking_style: 'chefs_choice',
        portion_size: 'medium',
        dietary_preferences: [],
        budget_range: '',
        special_instructions: '',
        preferred_time: '',
        reference_image_url: '',
      });
    },
    onError: () => {
      toast.error('Failed to submit request. Please try again.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.customer_email || !formData.customer_phone || !formData.food_category) {
      toast.error('Please fill in all required fields');
      return;
    }
    submitMutation.mutate(formData);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, reference_image_url: file_url });
    setIsUploading(false);
    toast.success('Image uploaded successfully');
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setFormData({
        ...formData,
        ingredients_include: [...formData.ingredients_include, ingredientInput.trim()]
      });
      setIngredientInput('');
    }
  };

  const addExclude = () => {
    if (excludeInput.trim()) {
      setFormData({
        ...formData,
        ingredients_exclude: [...formData.ingredients_exclude, excludeInput.trim()]
      });
      setExcludeInput('');
    }
  };

  const toggleDietary = (pref) => {
    const current = formData.dietary_preferences || [];
    if (current.includes(pref)) {
      setFormData({ ...formData, dietary_preferences: current.filter(p => p !== pref) });
    } else {
      setFormData({ ...formData, dietary_preferences: [...current, pref] });
    }
  };

  const dietaryOptions = ['Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'Low-Sugar', 'Keto', 'Paleo'];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <SectionHeader 
          subtitle="Your Taste, Our Craft" 
          title="Customize Your Dish" 
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="font-cormorant text-xl text-white/60 max-w-2xl mx-auto">
            Create your perfect culinary masterpiece. Our master chefs will craft a unique dish tailored to your exact preferences.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10"
          >
            <h3 className="font-playfair text-2xl text-white mb-6 flex items-center gap-3">
              <ChefHat className="w-6 h-6 text-[#c9a962]" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Full Name *
                </label>
                <Input
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Your full name"
                  className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30 focus:border-[#c9a962]"
                />
              </div>
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  placeholder="your@email.com"
                  className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30 focus:border-[#c9a962]"
                />
              </div>
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Phone Number *
                </label>
                <Input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30 focus:border-[#c9a962]"
                />
              </div>
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Preferred Dish Name (Optional)
                </label>
                <Input
                  value={formData.preferred_dish_name}
                  onChange={(e) => setFormData({ ...formData, preferred_dish_name: e.target.value })}
                  placeholder="Name your creation"
                  className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30 focus:border-[#c9a962]"
                />
              </div>
            </div>
          </motion.div>

          {/* Food Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10"
          >
            <h3 className="font-playfair text-2xl text-white mb-6 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-[#c9a962]" />
              Food Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Food Category *
                </label>
                <Select value={formData.food_category} onValueChange={(v) => setFormData({ ...formData, food_category: v })}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#c9a962]/20 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="non_vegetarian">Non-Vegetarian</SelectItem>
                    <SelectItem value="seafood">Seafood</SelectItem>
                    <SelectItem value="dessert">Dessert</SelectItem>
                    <SelectItem value="drinks">Drinks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Cooking Style
                </label>
                <Select value={formData.cooking_style} onValueChange={(v) => setFormData({ ...formData, cooking_style: v })}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#c9a962]/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
                    <SelectItem value="grilled">Grilled</SelectItem>
                    <SelectItem value="fried">Fried</SelectItem>
                    <SelectItem value="steamed">Steamed</SelectItem>
                    <SelectItem value="baked">Baked</SelectItem>
                    <SelectItem value="chefs_choice">Chef's Choice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Flame className="w-4 h-4" /> Spice Level
                </label>
                <Select value={formData.spice_level} onValueChange={(v) => setFormData({ ...formData, spice_level: v })}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#c9a962]/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hot">Hot 🔥</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Portion Size
                </label>
                <Select value={formData.portion_size} onValueChange={(v) => setFormData({ ...formData, portion_size: v })}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#c9a962]/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Ingredients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10"
          >
            <h3 className="font-playfair text-2xl text-white mb-6 flex items-center gap-3">
              <Leaf className="w-6 h-6 text-[#c9a962]" />
              Ingredients
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Include */}
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Ingredients to Include
                </label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                    placeholder="Add ingredient"
                    className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                  />
                  <LuxuryButton type="button" onClick={addIngredient} size="sm">
                    <Check className="w-4 h-4" />
                  </LuxuryButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.ingredients_include.map((ing, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-sm font-inter bg-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/30 flex items-center gap-2">
                      {ing}
                      <button type="button" onClick={() => setFormData({
                        ...formData,
                        ingredients_include: formData.ingredients_include.filter((_, idx) => idx !== i)
                      })}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Exclude */}
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Ingredients to Exclude (Allergies)
                </label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={excludeInput}
                    onChange={(e) => setExcludeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExclude())}
                    placeholder="Add to exclude"
                    className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                  />
                  <LuxuryButton type="button" onClick={addExclude} size="sm" variant="secondary">
                    <X className="w-4 h-4" />
                  </LuxuryButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.ingredients_exclude.map((ing, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-sm font-inter bg-red-900/20 text-red-400 border border-red-900/30 flex items-center gap-2">
                      {ing}
                      <button type="button" onClick={() => setFormData({
                        ...formData,
                        ingredients_exclude: formData.ingredients_exclude.filter((_, idx) => idx !== i)
                      })}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dietary & Budget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10"
          >
            <h3 className="font-playfair text-2xl text-white mb-6 flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-[#c9a962]" />
              Dietary & Budget
            </h3>
            
            <div className="mb-6">
              <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-4">
                Dietary Preferences
              </label>
              <div className="flex flex-wrap gap-3">
                {dietaryOptions.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleDietary(pref)}
                    className={`px-4 py-2 rounded-full font-inter text-sm transition-all ${
                      formData.dietary_preferences?.includes(pref)
                        ? 'bg-[#c9a962] text-[#0a0a0a]'
                        : 'bg-[#0a0a0a] text-white/60 border border-[#c9a962]/20 hover:border-[#c9a962]/50'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Budget Range
                </label>
                <Input
                  value={formData.budget_range}
                  onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                  placeholder="e.g., $50 - $100"
                  className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Preferred Time
                </label>
                <Input
                  type="datetime-local"
                  value={formData.preferred_time}
                  onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                  className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                />
              </div>
            </div>
          </motion.div>

          {/* Special Instructions & Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10"
          >
            <h3 className="font-playfair text-2xl text-white mb-6 flex items-center gap-3">
              <Upload className="w-6 h-6 text-[#c9a962]" />
              Additional Details
            </h3>
            
            <div className="mb-6">
              <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                Special Instructions
              </label>
              <Textarea
                value={formData.special_instructions}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                placeholder="Any special requests or notes for our chef..."
                rows={4}
                className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                Reference Image (Optional)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-dashed border-[#c9a962]/30 hover:border-[#c9a962]/60 transition-colors">
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 text-[#c9a962]/60" />
                    )}
                    <span className="font-inter text-sm text-white/50">
                      {formData.reference_image_url ? 'Image uploaded' : 'Upload an image'}
                    </span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {formData.reference_image_url && (
                  <img src={formData.reference_image_url} alt="Reference" className="w-20 h-20 rounded-lg object-cover" />
                )}
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <LuxuryButton 
              type="submit" 
              size="lg" 
              disabled={submitMutation.isPending}
              className="min-w-[300px]"
            >
              {submitMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a] rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Custom Request
                </>
              )}
            </LuxuryButton>
            <p className="font-inter text-xs text-white/40 mt-4">
              Our chef will review your request and contact you within 24 hours
            </p>
          </motion.div>
        </form>
      </div>
    </div>
  );
}