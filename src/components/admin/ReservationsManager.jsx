import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, Users, Search, Filter, CheckCircle, 
  XCircle, AlertCircle, Mail, Phone, User, MessageSquare,
  Table as TableIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function ReservationsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reservation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['reservations']);
      toast.success('Reservation updated');
      setIsDialogOpen(false);
    },
  });

  const handleStatusChange = async (reservation, newStatus) => {
    await updateMutation.mutateAsync({
      id: reservation.id,
      data: { status: newStatus }
    });

    // Send email notification for status changes
    if (newStatus === 'confirmed') {
      try {
        await base44.integrations.Core.SendEmail({
          to: reservation.customer_email,
          subject: `Hermanas Bites - Reservation Confirmed`,
          body: `
Dear ${reservation.customer_name},

Your reservation has been confirmed!

Reservation Details:
- Confirmation Code: ${reservation.confirmation_code}
- Date: ${format(parseISO(reservation.reservation_date), 'EEEE, MMMM d, yyyy')}
- Time: ${reservation.reservation_time}
- Party Size: ${reservation.party_size} guests
${reservation.table_number ? `- Table: ${reservation.table_number}` : ''}

We look forward to welcoming you!

Best regards,
Hermanas Bites
          `
        });
      } catch (error) {
        console.error('Email error:', error);
      }
    }
  };

  const handleAssignTable = () => {
    if (!tableNumber) {
      toast.error('Please enter a table number');
      return;
    }

    updateMutation.mutate({
      id: selectedReservation.id,
      data: {
        table_number: tableNumber,
        notes,
        status: 'confirmed'
      }
    });
  };

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = 
      res.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.confirmation_code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    confirmed: 'bg-green-500/20 text-green-300 border-green-500/30',
    seated: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    completed: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
    waitlist: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  };

  const statusIcons = {
    pending: AlertCircle,
    confirmed: CheckCircle,
    seated: Users,
    completed: CheckCircle,
    cancelled: XCircle,
    waitlist: Clock
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a962]/50" />
          <Input
            placeholder="Search by name, email, or confirmation code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#0a0a0a] border-[#c9a962]/20 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-[#0a0a0a] border-[#c9a962]/20 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="seated">Seated</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="waitlist">Waitlist</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['pending', 'confirmed', 'seated', 'waitlist'].map(status => {
          const count = reservations.filter(r => r.status === status).length;
          const Icon = statusIcons[status];
          return (
            <div key={status} className="bg-[#1a1a1a] rounded-xl p-4 border border-[#c9a962]/10">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-[#c9a962]" />
                <span className="font-inter text-xs uppercase tracking-wider text-white/50">
                  {status}
                </span>
              </div>
              <p className="font-playfair text-2xl text-white">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
        </div>
      )}

      {/* Reservations List */}
      <div className="space-y-3">
        {filteredReservations.map((reservation) => {
          const StatusIcon = statusIcons[reservation.status];
          
          return (
            <motion.div
              key={reservation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a1a1a] rounded-xl p-4 border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#c9a962]/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-[#c9a962]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-inter font-medium text-white mb-1">
                        {reservation.customer_name}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {reservation.customer_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {reservation.customer_phone}
                        </span>
                        <span className="font-mono text-[#c9a962]">
                          {reservation.confirmation_code}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-white/50 text-xs mb-1">Date</p>
                      <p className="text-white flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#c9a962]" />
                        {format(parseISO(reservation.reservation_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-1">Time</p>
                      <p className="text-white flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#c9a962]" />
                        {reservation.reservation_time}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-1">Guests</p>
                      <p className="text-white flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#c9a962]" />
                        {reservation.party_size}
                      </p>
                    </div>
                    {reservation.table_number && (
                      <div>
                        <p className="text-white/50 text-xs mb-1">Table</p>
                        <p className="text-white flex items-center gap-1">
                          <TableIcon className="w-3 h-3 text-[#c9a962]" />
                          {reservation.table_number}
                        </p>
                      </div>
                    )}
                  </div>

                  {reservation.special_requests && (
                    <div className="mt-3 p-2 rounded bg-[#0a0a0a] border border-[#c9a962]/10">
                      <p className="text-xs text-white/50 mb-1">Special Requests</p>
                      <p className="text-xs text-white/70">{reservation.special_requests}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-inter border flex items-center gap-1 ${statusColors[reservation.status]}`}>
                    <StatusIcon className="w-3 h-3" />
                    {reservation.status}
                  </span>

                  <div className="flex gap-2">
                    {reservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setTableNumber(reservation.table_number || '');
                            setNotes(reservation.notes || '');
                            setIsDialogOpen(true);
                          }}
                          className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-colors"
                        >
                          Assign Table
                        </button>
                        <button
                          onClick={() => handleStatusChange(reservation, 'cancelled')}
                          className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {reservation.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusChange(reservation, 'seated')}
                        className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                      >
                        Mark Seated
                      </button>
                    )}
                    {reservation.status === 'seated' && (
                      <button
                        onClick={() => handleStatusChange(reservation, 'completed')}
                        className="px-3 py-1 rounded-full text-xs bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                    {reservation.status === 'waitlist' && (
                      <button
                        onClick={() => handleStatusChange(reservation, 'confirmed')}
                        className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-colors"
                      >
                        Confirm
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredReservations.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-[#c9a962]/30 mx-auto mb-4" />
            <p className="font-inter text-white/50">No reservations found</p>
          </div>
        )}
      </div>

      {/* Assign Table Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#c9a962]/20">
          <DialogHeader>
            <DialogTitle className="font-playfair text-white">Assign Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                Table Number
              </label>
              <Input
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g., A1, B5"
                className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
              />
            </div>
            <div>
              <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes..."
                rows={3}
                className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 px-4 py-2 rounded-full border border-[#c9a962]/30 text-white/70 font-inter text-sm hover:bg-[#c9a962]/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTable}
                className="flex-1 px-4 py-2 rounded-full bg-[#c9a962] text-[#0a0a0a] font-inter text-sm font-medium hover:bg-[#e4d5a7] transition-colors"
              >
                Confirm & Assign
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}