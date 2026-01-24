import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function EnhancedDescription({ item, onUpdate }) {
  const [enhancedDesc, setEnhancedDesc] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const shouldEnhance = !item.full_description || 
                        item.full_description?.length < 50 ||
                        item.description?.length < 30;

  const generateEnhancedDescription = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a luxury food writer for Hermanas Bites, a seven-star restaurant.

Dish Name: ${item.name}
Category: ${item.category}
Current Description: ${item.description || 'No description'}
Ingredients: ${item.ingredients?.join(', ') || 'Not specified'}
Spices: ${item.spices?.join(', ') || 'Not specified'}
Price: KES ${item.price}

Write an elegant, appetizing description (2-3 sentences, ~80-120 words) that:
1. Evokes sensory experience (taste, texture, aroma)
2. Highlights unique ingredients or preparation
3. Uses sophisticated yet accessible language
4. Makes the dish irresistible

Be poetic but concise. Focus on what makes this dish special.`,
        response_json_schema: {
          type: "object",
          properties: {
            enhanced_description: {
              type: "string",
              description: "Elegant, sensory description of the dish"
            },
            tagline: {
              type: "string",
              description: "Short catchy tagline (5-8 words)"
            }
          }
        }
      });

      setEnhancedDesc(response);
      toast.success('Enhanced description generated!');
    } catch (error) {
      console.error('Failed to enhance description:', error);
      toast.error('Failed to generate description');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyDescription = async () => {
    if (!enhancedDesc) return;
    
    try {
      await base44.entities.MenuItem.update(item.id, {
        full_description: enhancedDesc.enhanced_description,
        description: enhancedDesc.tagline
      });
      toast.success('Description updated!');
      if (onUpdate) onUpdate();
      setEnhancedDesc(null);
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  if (!shouldEnhance && !enhancedDesc) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* AI Enhancement Prompt */}
      {shouldEnhance && !enhancedDesc && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={generateEnhancedDescription}
          disabled={isGenerating}
          className="w-full p-4 rounded-xl bg-gradient-to-r from-[#c9a962]/10 to-[#e4d5a7]/10 border border-[#c9a962]/20 hover:border-[#c9a962]/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#c9a962]/20 flex items-center justify-center group-hover:bg-[#c9a962]/30 transition-colors">
                {isGenerating ? (
                  <RefreshCw className="w-5 h-5 text-[#c9a962] animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5 text-[#c9a962]" />
                )}
              </div>
              <div className="text-left">
                <p className="font-inter text-sm text-white font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#c9a962]" />
                  Enhance with AI
                </p>
                <p className="font-inter text-xs text-white/50">
                  {isGenerating ? 'Crafting elegant description...' : 'Generate a luxurious description for this dish'}
                </p>
              </div>
            </div>
          </div>
        </motion.button>
      )}

      {/* Enhanced Description Preview */}
      <AnimatePresence>
        {enhancedDesc && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#1a1a1a] rounded-xl p-6 border border-[#c9a962]/20 space-y-4"
          >
            <div className="flex items-center gap-2 text-[#c9a962]">
              <Sparkles className="w-4 h-4" />
              <span className="font-inter text-xs uppercase tracking-wider">AI Enhanced</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="font-inter text-xs text-white/50 mb-1">Tagline</p>
                <p className="font-cormorant text-lg text-[#c9a962] italic">
                  "{enhancedDesc.tagline}"
                </p>
              </div>
              
              <div>
                <p className="font-inter text-xs text-white/50 mb-2">Full Description</p>
                <p className="font-inter text-white/80 leading-relaxed">
                  {enhancedDesc.enhanced_description}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={applyDescription}
                className="flex-1 px-4 py-2 rounded-full bg-[#c9a962] text-[#0a0a0a] font-inter text-sm font-medium hover:bg-[#e4d5a7] transition-colors"
              >
                Use This Description
              </button>
              <button
                onClick={() => setEnhancedDesc(null)}
                className="px-4 py-2 rounded-full border border-[#c9a962]/30 text-white/70 font-inter text-sm hover:bg-[#c9a962]/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateEnhancedDescription}
                className="px-4 py-2 rounded-full border border-[#c9a962]/30 text-white/70 font-inter text-sm hover:bg-[#c9a962]/10 transition-colors"
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}