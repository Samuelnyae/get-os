import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, User, Mail, Phone, Flame, Leaf, 
  Clock, DollarSign, X, Check, MessageSquare
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import LuxuryButton from '../common/LuxuryButton';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CustomRequestsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-custom-requests'],
    queryFn: () => base44.entities.CustomFoodRequest.list('-created_date', 200),
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomFoodRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-custom-requests']);
      queryClient.invalidateQueries(['admin-custom']);
      toast.success('Request updated successfully');
      setSelectedRequest(null);
      setProposedPrice('');
    },
  });

  const handleUpdateStatus = (request, status) => {
    updateRequestMutation.mutate({
      id: request.id,
      data: { status }
    });
  };

  const handleProposePrice = (request) => {
    if (!proposedPrice) {
      toast.error('Please enter a price');
      return;
    }
    
    updateRequestMutation.mutate({
      id: request.id,
      data: { 
        status: 'quoted',
        proposed_price: parseFloat(proposedPrice)
      }
    });

    // Send email to customer
    base44.integrations.Core.SendEmail({
      to: request.customer_email,
      subject: 'Get OS - Custom Dish Quote',
      body: `
Dear ${request.customer_name},

Thank you for your custom dish request!

We are delighted to craft your personalized dish: ${request.preferred_dish_name || 'Your Custom Creation'}

Proposed Price: $${proposedPrice}

Our chef has reviewed your specifications and is ready to create this unique culinary experience for you. Please reply to confirm your acceptance.

Best regards,
Get OS - Seven Star Dining
      `
    });
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.preferred_dish_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
    reviewed: 'bg-blue-900/30 text-blue-400 border-blue-700',
    quoted: 'bg-purple-900/30 text-purple-400 border-purple-700',
    accepted: 'bg-green-900/30 text-green-400 border-green-700',
    preparing: 'bg-orange-900/30 text-orange-400 border-orange-700',
    completed: 'bg-teal-900/30 text-teal-400 border-teal-700',
    cancelled: 'bg-red-900/30 text-red-400 border-red-700',
  };

  const statusOptions = ['pending', 'reviewed', 'quoted', 'accepted', 'preparing', 'completed', 'cancelled'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search requests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-[#1a1a1a] border-[#c9a962]/20 text-white"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-[#1a1a1a] border-[#c9a962]/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Requests Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-[#c9a962]/30 mx-auto mb-4" />
          <p className="font-inter text-white/50">No custom requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-playfair text-lg text-white mb-1">
                    {request.preferred_dish_name || 'Custom Dish Request'}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-inter border ${statusColors[request.status]}`}>
                      {request.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-inter bg-[#c9a962]/20 text-[#c9a962]">
                      {request.food_category?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <User className="w-3.5 h-3.5 text-[#c9a962]" />
                  <span className="font-inter">{request.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Mail className="w-3.5 h-3.5 text-[#c9a962]" />
                  <span className="font-inter">{request.customer_email}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Phone className="w-3.5 h-3.5 text-[#c9a962]" />
                  <span className="font-inter">{request.customer_phone}</span>
                </div>
                {request.created_date && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Clock className="w-3.5 h-3.5 text-[#c9a962]" />
                    <span className="font-inter text-xs">
                      {format(new Date(request.created_date), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                )}
              </div>

              {/* Preferences Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {request.spice_level && (
                  <div className="p-2 rounded-lg bg-[#0a0a0a]">
                    <p className="font-inter text-xs text-[#c9a962] mb-0.5">Spice Level</p>
                    <p className="font-inter text-xs text-white flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {request.spice_level}
                    </p>
                  </div>
                )}
                {request.cooking_style && (
                  <div className="p-2 rounded-lg bg-[#0a0a0a]">
                    <p className="font-inter text-xs text-[#c9a962] mb-0.5">Cooking Style</p>
                    <p className="font-inter text-xs text-white">{request.cooking_style?.replace('_', ' ')}</p>
                  </div>
                )}
                {request.portion_size && (
                  <div className="p-2 rounded-lg bg-[#0a0a0a]">
                    <p className="font-inter text-xs text-[#c9a962] mb-0.5">Portion</p>
                    <p className="font-inter text-xs text-white">{request.portion_size}</p>
                  </div>
                )}
                {request.budget_range && (
                  <div className="p-2 rounded-lg bg-[#0a0a0a]">
                    <p className="font-inter text-xs text-[#c9a962] mb-0.5">Budget</p>
                    <p className="font-inter text-xs text-white">{request.budget_range}</p>
                  </div>
                )}
              </div>

              {/* Ingredients */}
              {request.ingredients_include?.length > 0 && (
                <div className="mb-3">
                  <p className="font-inter text-xs text-[#c9a962] mb-2 flex items-center gap-1">
                    <Leaf className="w-3 h-3" /> Include
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {request.ingredients_include.map((ing, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs font-inter bg-green-900/20 text-green-400 border border-green-900/30">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {request.ingredients_exclude?.length > 0 && (
                <div className="mb-3">
                  <p className="font-inter text-xs text-red-400 mb-2">Exclude/Allergies</p>
                  <div className="flex flex-wrap gap-1">
                    {request.ingredients_exclude.map((ing, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs font-inter bg-red-900/20 text-red-400 border border-red-900/30">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary Preferences */}
              {request.dietary_preferences?.length > 0 && (
                <div className="mb-4">
                  <p className="font-inter text-xs text-[#c9a962] mb-2">Dietary</p>
                  <div className="flex flex-wrap gap-1">
                    {request.dietary_preferences.map((pref, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs font-inter bg-[#c9a962]/20 text-[#c9a962]">
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              {request.special_instructions && (
                <div className="mb-4 p-3 rounded-lg bg-[#0a0a0a] border border-[#c9a962]/10">
                  <p className="font-inter text-xs text-[#c9a962] mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Special Instructions
                  </p>
                  <p className="font-inter text-sm text-white/70">
                    {request.special_instructions}
                  </p>
                </div>
              )}

              {/* Proposed Price */}
              {request.proposed_price && (
                <div className="mb-4 p-3 rounded-lg bg-[#c9a962]/10 border border-[#c9a962]/30">
                  <p className="font-inter text-xs text-[#c9a962] mb-1">Proposed Price</p>
                  <p className="font-playfair text-2xl text-[#c9a962]">
                    KES {request.proposed_price.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Reference Image */}
              {request.reference_image_url && (
                <div className="mb-4">
                  <img 
                    src={request.reference_image_url} 
                    alt="Reference" 
                    className="w-full h-32 rounded-lg object-cover"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-[#c9a962]/10">
                <LuxuryButton
                  size="sm"
                  onClick={() => setSelectedRequest(request)}
                  className="flex-1"
                >
                  <DollarSign className="w-3 h-3 mr-1" />
                  Quote Price
                </LuxuryButton>
                <Select
                  value={request.status}
                  onValueChange={(status) => handleUpdateStatus(request, status)}
                >
                  <SelectTrigger className="flex-1 h-9 bg-[#0a0a0a] border-[#c9a962]/20 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status} className="text-xs">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Price Proposal Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-playfair text-xl text-white">Propose Price</h3>
                <button onClick={() => setSelectedRequest(null)} className="text-white/50 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="font-inter text-sm text-white/70 mb-4">
                  {selectedRequest.preferred_dish_name || 'Custom Dish Request'}
                </p>
                <p className="font-inter text-xs text-white/50 mb-1">Customer</p>
                <p className="font-inter text-sm text-white mb-4">{selectedRequest.customer_name}</p>
              </div>

              <div className="mb-6">
                <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                  Proposed Price (KES)
                </label>
                <Input
                  type="number"
                  step="1"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  placeholder="0"
                  className="bg-[#0a0a0a] border-[#c9a962]/20 text-white text-2xl font-playfair"
                />
              </div>

              <div className="flex gap-3">
                <LuxuryButton
                  variant="ghost"
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1"
                >
                  Cancel
                </LuxuryButton>
                <LuxuryButton
                  onClick={() => handleProposePrice(selectedRequest)}
                  className="flex-1"
                  disabled={updateRequestMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Send Quote
                </LuxuryButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}