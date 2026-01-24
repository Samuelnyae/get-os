import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Send, Users, TrendingUp, Mail, Loader2, RefreshCw } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LuxuryButton from '../common/LuxuryButton';
import { toast } from 'sonner';

export default function AIMarketingCampaigns() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['marketing-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['marketing-menu'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: likes = [] } = useQuery({
    queryKey: ['marketing-likes'],
    queryFn: () => base44.entities.Like.list(),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['marketing-comments'],
    queryFn: () => base44.entities.Comment.list(),
  });

  const analyzeCustomerData = () => {
    // Customer segmentation
    const customerMap = {};
    
    orders.forEach(order => {
      if (!customerMap[order.customer_email]) {
        customerMap[order.customer_email] = {
          email: order.customer_email,
          name: order.customer_name,
          orders: [],
          totalSpent: 0,
          orderedItems: {},
          lastOrderDate: order.created_date
        };
      }
      
      customerMap[order.customer_email].orders.push(order);
      customerMap[order.customer_email].totalSpent += order.total_amount || 0;
      
      order.items?.forEach(item => {
        const itemName = item.name;
        customerMap[order.customer_email].orderedItems[itemName] = 
          (customerMap[order.customer_email].orderedItems[itemName] || 0) + item.quantity;
      });
    });

    const customers = Object.values(customerMap);

    // Segment customers
    const loyalCustomers = customers.filter(c => c.orders.length >= 3).sort((a, b) => b.totalSpent - a.totalSpent);
    const oneTimeCustomers = customers.filter(c => c.orders.length === 1);
    const inactiveCustomers = customers.filter(c => {
      const daysSinceOrder = (Date.now() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceOrder > 30 && c.orders.length > 1;
    });

    // Popular items from likes
    const itemLikes = {};
    likes.forEach(like => {
      itemLikes[like.menu_item_id] = (itemLikes[like.menu_item_id] || 0) + 1;
    });

    return {
      totalCustomers: customers.length,
      loyalCustomers,
      oneTimeCustomers,
      inactiveCustomers,
      popularItems: menuItems.filter(item => (item.likes_count || 0) > 10),
      itemLikes,
      allCustomers: customers
    };
  };

  const generateCampaigns = async () => {
    setIsGenerating(true);
    try {
      const analysis = analyzeCustomerData();

      const prompt = `You are a marketing expert for a luxury restaurant "Hermanas Bites". Analyze this customer data and generate 4 personalized email marketing campaigns.

Customer Data:
- Total Customers: ${analysis.totalCustomers}
- Loyal Customers (3+ orders): ${analysis.loyalCustomers.length}
- One-time Customers: ${analysis.oneTimeCustomers.length}
- Inactive Customers (30+ days): ${analysis.inactiveCustomers.length}
- Popular Menu Items: ${analysis.popularItems.map(i => i.name).join(', ')}

Available Menu Items: ${menuItems.map(item => `${item.name} ($${item.price})`).join(', ')}

Generate 4 campaigns with different strategies:
1. Loyal Customer Appreciation (VIP discount, exclusive items)
2. Win-back Inactive Customers (special comeback offer)
3. New Customer Re-engagement (second order incentive)
4. Complementary Item Upsell (based on popular combinations)

For each campaign, provide:
- Campaign name
- Target segment description
- Email subject line (compelling, 50 chars max)
- Email body (personalized, warm tone, 200-300 words, include specific menu items and offers)
- Promotional offer details
- Target customer emails (select relevant emails from the data)

Make emails feel personal and luxurious, matching the seven-star dining experience.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            campaigns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  target_segment: { type: "string" },
                  subject: { type: "string" },
                  body: { type: "string" },
                  offer: { type: "string" },
                  estimated_recipients: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Match campaigns with actual customer emails
      const analysis2 = analyzeCustomerData();
      const enrichedCampaigns = response.campaigns.map((campaign, idx) => {
        let targetEmails = [];
        
        if (campaign.name.toLowerCase().includes('loyal')) {
          targetEmails = analysis2.loyalCustomers.slice(0, 20).map(c => c.email);
        } else if (campaign.name.toLowerCase().includes('inactive') || campaign.name.toLowerCase().includes('win-back')) {
          targetEmails = analysis2.inactiveCustomers.slice(0, 15).map(c => c.email);
        } else if (campaign.name.toLowerCase().includes('new') || campaign.name.toLowerCase().includes('re-engagement')) {
          targetEmails = analysis2.oneTimeCustomers.slice(0, 25).map(c => c.email);
        } else {
          targetEmails = analysis2.allCustomers.slice(0, 30).map(c => c.email);
        }

        return {
          ...campaign,
          id: `campaign_${idx}`,
          targetEmails,
          actualRecipients: targetEmails.length
        };
      });

      setCampaigns(enrichedCampaigns);
      toast.success('Marketing campaigns generated successfully');
    } catch (error) {
      toast.error('Failed to generate campaigns: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendCampaign = async (campaign) => {
    if (!campaign.targetEmails || campaign.targetEmails.length === 0) {
      toast.error('No recipients found for this campaign');
      return;
    }

    setIsSending(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const email of campaign.targetEmails) {
        try {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: campaign.subject,
            body: campaign.body
          });
          successCount++;
        } catch (error) {
          failCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success(`Campaign sent! ${successCount} emails delivered, ${failCount} failed`);
      setSelectedCampaign(null);
    } catch (error) {
      toast.error('Failed to send campaign: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const stats = analyzeCustomerData();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[#c9a962]" />
            <span className="font-inter text-xs text-white/50 uppercase tracking-wider">Total Customers</span>
          </div>
          <p className="font-playfair text-3xl text-white">{stats.totalCustomers}</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-green-500/10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="font-inter text-xs text-white/50 uppercase tracking-wider">Loyal Customers</span>
          </div>
          <p className="font-playfair text-3xl text-white">{stats.loyalCustomers.length}</p>
          <p className="font-inter text-xs text-white/40 mt-1">3+ orders</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-yellow-500/10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-5 h-5 text-yellow-400" />
            <span className="font-inter text-xs text-white/50 uppercase tracking-wider">Inactive</span>
          </div>
          <p className="font-playfair text-3xl text-white">{stats.inactiveCustomers.length}</p>
          <p className="font-inter text-xs text-white/40 mt-1">30+ days</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-blue-500/10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <span className="font-inter text-xs text-white/50 uppercase tracking-wider">One-time</span>
          </div>
          <p className="font-playfair text-3xl text-white">{stats.oneTimeCustomers.length}</p>
          <p className="font-inter text-xs text-white/40 mt-1">Need re-engagement</p>
        </div>
      </div>

      {/* Generate Button */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6 text-center">
        <Sparkles className="w-12 h-12 text-[#c9a962] mx-auto mb-4" />
        <h3 className="font-playfair text-2xl text-white mb-2">AI Marketing Campaign Generator</h3>
        <p className="font-inter text-sm text-white/60 mb-6 max-w-2xl mx-auto">
          Our AI analyzes customer order history, browsing behavior, and preferences to create personalized 
          email campaigns with targeted promotions, complementary item recommendations, and loyalty rewards.
        </p>
        <LuxuryButton onClick={generateCampaigns} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Customer Data...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Campaigns
            </>
          )}
        </LuxuryButton>
      </div>

      {/* Generated Campaigns */}
      {campaigns.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-playfair text-xl text-white">Generated Campaigns</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {campaigns.map((campaign) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1a1a1a] rounded-xl border border-[#c9a962]/10 p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-playfair text-lg text-white mb-1">{campaign.name}</h4>
                    <p className="font-inter text-xs text-[#c9a962]">{campaign.target_segment}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#c9a962]/10 text-[#c9a962] text-xs font-inter">
                    {campaign.actualRecipients} recipients
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="font-inter text-xs text-white/40 uppercase tracking-wider mb-1">Subject Line</p>
                    <p className="font-inter text-sm text-white">{campaign.subject}</p>
                  </div>

                  <div>
                    <p className="font-inter text-xs text-white/40 uppercase tracking-wider mb-1">Offer</p>
                    <p className="font-inter text-sm text-[#c9a962]">{campaign.offer}</p>
                  </div>

                  <div>
                    <p className="font-inter text-xs text-white/40 uppercase tracking-wider mb-1">Email Preview</p>
                    <div className="bg-[#0a0a0a] rounded-lg p-3 max-h-32 overflow-y-auto">
                      <p className="font-inter text-xs text-white/70 whitespace-pre-wrap">
                        {campaign.body.slice(0, 200)}...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#c9a962]/10">
                  <LuxuryButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedCampaign(campaign)}
                    className="flex-1"
                  >
                    Preview Full Email
                  </LuxuryButton>
                  <LuxuryButton
                    size="sm"
                    onClick={() => sendCampaign(campaign)}
                    disabled={isSending}
                    className="flex-1"
                  >
                    {isSending ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3 mr-1" />
                    )}
                    Send Campaign
                  </LuxuryButton>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedCampaign && (
        <div 
          className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCampaign(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6"
          >
            <div className="mb-6">
              <h3 className="font-playfair text-2xl text-white mb-2">{selectedCampaign.name}</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-inter text-[#c9a962]">{selectedCampaign.target_segment}</span>
                <span className="font-inter text-white/50">• {selectedCampaign.actualRecipients} recipients</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Subject</p>
                <p className="font-inter text-base text-white">{selectedCampaign.subject}</p>
              </div>

              <div>
                <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Email Body</p>
                <div className="bg-[#0a0a0a] rounded-lg p-4">
                  <p className="font-inter text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                    {selectedCampaign.body}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">Promotional Offer</p>
                <p className="font-inter text-sm text-white">{selectedCampaign.offer}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <LuxuryButton variant="ghost" onClick={() => setSelectedCampaign(null)} className="flex-1">
                Close
              </LuxuryButton>
              <LuxuryButton 
                onClick={() => {
                  sendCampaign(selectedCampaign);
                  setSelectedCampaign(null);
                }}
                disabled={isSending}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </LuxuryButton>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}