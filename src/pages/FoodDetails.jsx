import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, MessageCircle, Plus, Minus, ShoppingCart, 
  ChevronLeft, ChevronRight, Clock, Flame, Leaf,
  Star, Send, User
} from 'lucide-react';
import LuxuryButton from '../components/common/LuxuryButton';
import AIMenuSuggestions from '../components/menu/AIMenuSuggestions';
import EnhancedDescription from '../components/menu/EnhancedDescription';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function FoodDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');
  
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newComment, setNewComment] = useState({ user_name: '', content: '', rating: 5 });
  const [hasLiked, setHasLiked] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cartItems, setCartItems] = useState([]);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const likedItems = JSON.parse(localStorage.getItem('hermanas_likes') || '[]');
    setHasLiked(likedItems.includes(itemId));
    
    const cart = JSON.parse(localStorage.getItem('hermanas_cart') || '[]');
    setCartItems(cart);
    
    const handleCartUpdate = () => {
      const updatedCart = JSON.parse(localStorage.getItem('hermanas_cart') || '[]');
      setCartItems(updatedCart);
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [itemId]);

  const { data: item, isLoading } = useQuery({
    queryKey: ['menu-item', itemId],
    queryFn: async () => {
      const items = await base44.entities.MenuItem.filter({ id: itemId });
      return items[0];
    },
    enabled: !!itemId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', itemId],
    queryFn: () => base44.entities.Comment.filter({ menu_item_id: itemId }, '-created_date'),
    enabled: !!itemId,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!hasLiked) {
        await base44.entities.Like.create({
          menu_item_id: itemId,
          user_identifier: `guest_${Date.now()}`
        });
        await base44.entities.MenuItem.update(itemId, {
          likes_count: (item?.likes_count || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-item', itemId]);
      const likedItems = JSON.parse(localStorage.getItem('hermanas_likes') || '[]');
      localStorage.setItem('hermanas_likes', JSON.stringify([...likedItems, itemId]));
      setHasLiked(true);
      toast.success('Thanks for the love!');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', itemId]);
      setNewComment({ user_name: '', content: '', rating: 5 });
      toast.success('Comment posted!');
    },
  });

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('hermanas_cart') || '[]');
    const existingIndex = cart.findIndex(i => i.menu_item_id === item.id);
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: quantity,
        image_url: item.image_url
      });
    }
    
    localStorage.setItem('hermanas_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success(`${quantity} × ${item.name} added to cart`);
  };

  const submitComment = (e) => {
    e.preventDefault();
    if (!newComment.user_name || !newComment.content) {
      toast.error('Please fill in all fields');
      return;
    }
    commentMutation.mutate({
      ...newComment,
      menu_item_id: itemId
    });
  };

  const allImages = item ? [item.image_url, ...(item.gallery_images || [])].filter(Boolean) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-white/50">Item not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Live Time */}
        <div className="text-center mb-8">
          <p className="font-inter text-xs text-[#c9a962]/70 tracking-wider">
            {format(currentTime, 'EEEE, MMMM d, yyyy')} • {format(currentTime, 'h:mm:ss a')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#1a1a1a]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={allImages[currentImageIndex] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0a0a0a]/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-[#c9a962] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0a0a0a]/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-[#c9a962] transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex ? 'border-[#c9a962]' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Category & Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-inter uppercase tracking-wider bg-[#c9a962]/20 text-[#c9a962] border border-[#c9a962]/30">
                {item.category?.replace('_', ' ')}
              </span>
              {item.dietary_tags?.map((tag, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-inter uppercase tracking-wider bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10">
                  {tag}
                </span>
              ))}
            </div>

            {/* Name & Price */}
            <div>
              <h1 className="font-playfair text-4xl md:text-5xl text-white mb-2">{item.name}</h1>
              <p className="font-playfair text-3xl text-[#c9a962]">KES {item.price?.toLocaleString()}</p>
            </div>

            {/* Description */}
            <p className="font-cormorant text-xl text-white/70 leading-relaxed">
              {item.full_description || item.description}
            </p>

            {/* AI Description Enhancement */}
            <EnhancedDescription 
              item={item} 
              onUpdate={() => queryClient.invalidateQueries(['menu-item', itemId])}
            />

            {/* Like Button */}
            <button
              onClick={() => !hasLiked && likeMutation.mutate()}
              disabled={hasLiked}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                hasLiked 
                  ? 'bg-[#c9a962]/20 text-[#c9a962]' 
                  : 'bg-[#1a1a1a] text-white/70 hover:text-[#c9a962] border border-[#c9a962]/20'
              }`}
            >
              <Heart className={`w-5 h-5 ${hasLiked ? 'fill-[#c9a962]' : ''}`} />
              <span className="font-inter text-sm">{item.likes_count || 0} likes</span>
            </button>

            {/* Ingredients */}
            {item.ingredients?.length > 0 && (
              <div>
                <h3 className="font-inter text-xs tracking-wider text-[#c9a962] uppercase mb-3 flex items-center gap-2">
                  <Leaf className="w-4 h-4" /> Ingredients
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.ingredients.map((ing, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-sm font-inter bg-[#1a1a1a] text-white/70 border border-[#c9a962]/10">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Spices */}
            {item.spices?.length > 0 && (
              <div>
                <h3 className="font-inter text-xs tracking-wider text-[#c9a962] uppercase mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4" /> Spices
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.spices.map((spice, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-sm font-inter bg-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/20">
                      {spice}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Companions */}
            {item.companions?.length > 0 && (
              <div>
                <h3 className="font-inter text-xs tracking-wider text-[#c9a962] uppercase mb-3">
                  Perfect Companions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.companions.map((comp, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-sm font-inter bg-[#1a1a1a] text-white/60 border border-[#c9a962]/10">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex items-center gap-4">
                <span className="font-inter text-sm text-white/50">Quantity</span>
                <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-full p-1 border border-[#c9a962]/20">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-[#c9a962]/20 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-inter text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-[#c9a962]/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <LuxuryButton onClick={addToCart} className="flex-1 sm:flex-none">
                <ShoppingCart className="inline w-4 h-4 mr-2" />
                Add to Order • KES {(item.price * quantity).toLocaleString()}
              </LuxuryButton>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-20">
          <h2 className="font-playfair text-3xl text-white mb-8 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-[#c9a962]" />
            Guest Reviews ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={submitComment} className="bg-[#1a1a1a] rounded-2xl p-6 mb-8 border border-[#c9a962]/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Your Name
                </label>
                <Input
                  value={newComment.user_name}
                  onChange={(e) => setNewComment({ ...newComment, user_name: e.target.value })}
                  placeholder="Enter your name"
                  className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewComment({ ...newComment, rating: star })}
                      className="p-1"
                    >
                      <Star 
                        className={`w-6 h-6 transition-colors ${
                          star <= newComment.rating ? 'fill-[#c9a962] text-[#c9a962]' : 'text-white/20'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                Your Review
              </label>
              <Textarea
                value={newComment.content}
                onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                placeholder="Share your experience..."
                rows={3}
                className="bg-[#0a0a0a] border-[#c9a962]/20 text-white placeholder:text-white/30"
              />
            </div>
            <LuxuryButton type="submit" disabled={commentMutation.isPending}>
              <Send className="w-4 h-4 mr-2" />
              {commentMutation.isPending ? 'Posting...' : 'Post Review'}
            </LuxuryButton>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1a1a1a]/50 rounded-xl p-6 border border-[#c9a962]/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#c9a962]/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#c9a962]" />
                    </div>
                    <div>
                      <p className="font-inter font-medium text-white">{comment.user_name}</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={`w-3 h-3 ${
                              star <= (comment.rating || 5) ? 'fill-[#c9a962] text-[#c9a962]' : 'text-white/20'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="font-inter text-xs text-white/40">
                    {comment.created_date && format(new Date(comment.created_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="font-inter text-white/70 leading-relaxed">{comment.content}</p>
              </motion.div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-[#c9a962]/30 mx-auto mb-4" />
                <p className="font-inter text-white/50">No reviews yet. Be the first to share your experience!</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="mt-20">
          <AIMenuSuggestions currentItemId={itemId} cartItems={cartItems} />
        </div>
      </div>
    </div>
  );
}