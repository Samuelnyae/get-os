import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { motion } from 'framer-motion';
import { Heart, Plus } from 'lucide-react';

export default function MenuCard({ item, onAddToCart }) {
  const addToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const cart = JSON.parse(localStorage.getItem('hermanas_cart') || '[]');
    const existingIndex = cart.findIndex(i => i.menu_item_id === item.id);
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image_url: item.image_url
      });
    }
    
    localStorage.setItem('hermanas_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    if (onAddToCart) onAddToCart(item);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group"
    >
      <Link to={createPageUrl(`FoodDetails?id=${item.id}`)}>
        <div className="relative overflow-hidden rounded-2xl bg-[#1a1a1a] border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all duration-500">
          {/* Image Container */}
          <div className="relative h-64 overflow-hidden">
            <img
              src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
              alt={item.name}
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />
            
            {/* Likes Badge */}
            <div className="absolute top-4 right-4 flex items-center space-x-1 px-3 py-1.5 rounded-full bg-[#0a0a0a]/60 backdrop-blur-sm border border-[#c9a962]/20">
              <Heart className="w-3.5 h-3.5 text-[#c9a962]" />
              <span className="text-xs font-inter text-white/90">{item.likes_count || 0}</span>
            </div>

            {/* Dietary Tags */}
            {item.dietary_tags && item.dietary_tags.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                {item.dietary_tags.slice(0, 2).map((tag, i) => (
                  <span key={i} className="px-2 py-1 text-[10px] font-inter uppercase tracking-wider bg-[#c9a962]/90 text-[#0a0a0a] rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={addToCart}
              className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-[#c9a962] text-[#0a0a0a] flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#e4d5a7]"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-playfair text-xl text-white group-hover:text-[#c9a962] transition-colors">
                {item.name}
              </h3>
              <span className="font-inter text-lg text-[#c9a962] font-semibold">
                KES {item.price?.toLocaleString()}
              </span>
            </div>
            <p className="font-inter text-sm text-white/50 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}