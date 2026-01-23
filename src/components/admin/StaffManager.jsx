import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Users, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LuxuryButton from '../common/LuxuryButton';
import { toast } from 'sonner';

export default function StaffManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: 'chef', status: 'available' });
  const queryClient = useQueryClient();

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => base44.entities.Staff.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Staff.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff-list']);
      setDialogOpen(false);
      setFormData({ name: '', role: 'chef', status: 'available' });
      toast.success('Staff member added');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Staff.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff-list']);
      setDialogOpen(false);
      setEditingStaff(null);
      setFormData({ name: '', role: 'chef', status: 'available' });
      toast.success('Staff member updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Staff.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff-list']);
      toast.success('Staff member removed');
    },
  });

  const handleSubmit = () => {
    if (!formData.name) return;

    if (editingStaff) {
      updateMutation.mutate({ id: editingStaff.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (member) => {
    setEditingStaff(member);
    setFormData({ name: member.name, role: member.role, status: member.status });
    setDialogOpen(true);
  };

  const statusColors = {
    available: 'bg-green-900/30 text-green-400 border-green-700',
    busy: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
    offline: 'bg-gray-900/30 text-gray-400 border-gray-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[#c9a962]" />
          <h3 className="font-playfair text-2xl text-white">Staff Management</h3>
        </div>
        <LuxuryButton onClick={() => {
          setEditingStaff(null);
          setFormData({ name: '', role: 'chef', status: 'available' });
          setDialogOpen(true);
        }}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff
        </LuxuryButton>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-[#c9a962]/30 mx-auto mb-4" />
          <p className="font-inter text-white/50">No staff members yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] rounded-xl p-6 border border-[#c9a962]/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-playfair text-lg text-white">{member.name}</h4>
                  <p className="font-inter text-sm text-[#c9a962]">
                    {member.role?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 rounded-lg bg-[#0a0a0a] border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all"
                  >
                    <Edit className="w-4 h-4 text-[#c9a962]" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Remove this staff member?')) {
                        deleteMutation.mutate(member.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-[#0a0a0a] border border-red-500/20 hover:border-red-500/50 transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className={`px-3 py-2 rounded-lg text-center border ${statusColors[member.status]}`}>
                <p className="font-inter text-xs uppercase tracking-wider">
                  {member.status}
                </p>
              </div>

              {member.current_orders?.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-[#0a0a0a] border border-[#c9a962]/10">
                  <p className="font-inter text-xs text-[#c9a962] uppercase tracking-wider">
                    Current Orders: {member.current_orders.length}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#c9a962]/20 text-white">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl">
              {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="font-inter text-sm text-white/70 mb-2 block">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                placeholder="Enter staff name"
              />
            </div>

            <div>
              <label className="font-inter text-sm text-white/70 mb-2 block">Role</label>
              <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#c9a962]/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
                  <SelectItem value="chef">Chef</SelectItem>
                  <SelectItem value="kitchen_assistant">Kitchen Assistant</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-inter text-sm text-white/70 mb-2 block">Status</label>
              <Select value={formData.status} onValueChange={(status) => setFormData({ ...formData, status })}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#c9a962]/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <LuxuryButton onClick={handleSubmit} disabled={!formData.name} className="w-full">
              {editingStaff ? 'Update' : 'Add'} Staff Member
            </LuxuryButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}