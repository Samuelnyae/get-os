import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Star, Trash2, User, Image as ImageIcon } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function FeedbackViewer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('comments');
  
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['admin-feedback-comments'],
    queryFn: () => base44.entities.Comment.list('-created_date', 200),
  });

  const { data: likes = [], isLoading: likesLoading } = useQuery({
    queryKey: ['admin-feedback-likes'],
    queryFn: () => base44.entities.Like.list('-created_date', 200),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['admin-menu-for-feedback'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-feedback-comments']);
      queryClient.invalidateQueries(['admin-comments']);
      toast.success('Comment deleted');
    },
  });

  const deleteLikeMutation = useMutation({
    mutationFn: (id) => base44.entities.Like.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-feedback-likes']);
      toast.success('Like removed');
    },
  });

  const getMenuItemName = (itemId) => {
    const item = menuItems.find(m => m.id === itemId);
    return item?.name || 'Unknown Item';
  };

  const getMenuItemImage = (itemId) => {
    const item = menuItems.find(m => m.id === itemId);
    return item?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
  };

  const filteredComments = comments.filter(comment =>
    comment.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getMenuItemName(comment.menu_item_id)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLikes = likes.filter(like =>
    getMenuItemName(like.menu_item_id)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group likes by menu item
  const likesByItem = likes.reduce((acc, like) => {
    if (!acc[like.menu_item_id]) {
      acc[like.menu_item_id] = [];
    }
    acc[like.menu_item_id].push(like);
    return acc;
  }, {});

  const handleDeleteComment = (id) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-6 py-2 rounded-xl font-inter text-sm transition-all ${
              activeTab === 'comments'
                ? 'bg-[#c9a962] text-[#0a0a0a]'
                : 'bg-[#1a1a1a] text-white/70 border border-[#c9a962]/10'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Comments ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`px-6 py-2 rounded-xl font-inter text-sm transition-all ${
              activeTab === 'likes'
                ? 'bg-[#c9a962] text-[#0a0a0a]'
                : 'bg-[#1a1a1a] text-white/70 border border-[#c9a962]/10'
            }`}
          >
            <Heart className="w-4 h-4 inline mr-2" />
            Likes ({likes.length})
          </button>
        </div>
        <Input
          placeholder="Search feedback..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-[#1a1a1a] border-[#c9a962]/20 text-white"
        />
      </div>

      {/* Comments View */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {commentsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-[#c9a962]/30 mx-auto mb-4" />
              <p className="font-inter text-white/50">No comments found</p>
            </div>
          ) : (
            filteredComments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10"
              >
                <div className="flex gap-4">
                  {/* Menu Item Image */}
                  <img
                    src={getMenuItemImage(comment.menu_item_id)}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover"
                  />

                  {/* Comment Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 rounded-full bg-[#c9a962]/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-[#c9a962]" />
                          </div>
                          <div>
                            <p className="font-inter font-medium text-white">{comment.user_name}</p>
                            <p className="font-inter text-xs text-white/40">
                              {comment.created_date && format(new Date(comment.created_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <p className="font-inter text-sm text-[#c9a962] ml-10">
                          On: {getMenuItemName(comment.menu_item_id)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Rating */}
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (comment.rating || 5)
                                  ? 'fill-[#c9a962] text-[#c9a962]'
                                  : 'text-white/20'
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="font-inter text-white/70 leading-relaxed ml-10">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Likes View */}
      {activeTab === 'likes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {likesLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
            </div>
          ) : Object.keys(likesByItem).length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Heart className="w-12 h-12 text-[#c9a962]/30 mx-auto mb-4" />
              <p className="font-inter text-white/50">No likes yet</p>
            </div>
          ) : (
            Object.entries(likesByItem)
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([itemId, itemLikes], index) => (
                <motion.div
                  key={itemId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#c9a962]/10"
                >
                  <div className="relative h-32">
                    <img
                      src={getMenuItemImage(itemId)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-playfair text-lg text-white mb-2">
                      {getMenuItemName(itemId)}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-[#c9a962] fill-[#c9a962]" />
                      <span className="font-inter text-2xl text-[#c9a962] font-semibold">
                        {itemLikes.length}
                      </span>
                      <span className="font-inter text-sm text-white/50">likes</span>
                    </div>
                  </div>
                </motion.div>
              ))
          )}
        </div>
      )}
    </div>
  );
}