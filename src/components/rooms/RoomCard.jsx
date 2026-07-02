import React from 'react';
import { motion } from 'framer-motion';
import { Users, Eye, BedDouble, Wifi, Tv, Lock, Wine, Wind, Coffee, Car, Waves } from 'lucide-react';

const STATUS_BADGE = {
  available: { label: 'Available', cls: 'bg-emerald-500/90 text-white' },
  occupied: { label: 'Occupied', cls: 'bg-red-500/90 text-white' },
  reserved: { label: 'Reserved', cls: 'bg-blue-500/90 text-white' },
  maintenance: { label: 'Maintenance', cls: 'bg-orange-500/90 text-white' },
  cleaning: { label: 'Housekeeping', cls: 'bg-yellow-500/90 text-black' },
};

const AMENITY_ICONS = {
  wifi: Wifi, 'wi-fi': Wifi,
  tv: Tv,
  safe: Lock,
  'mini bar': Wine, minibar: Wine,
  ac: Wind, 'air conditioning': Wind,
  breakfast: Coffee,
  parking: Car,
  pool: Waves,
};

const TYPE_LABELS = {
  standard: 'Standard Room',
  deluxe: 'Deluxe Room',
  suite: 'Suite',
  family: 'Family Room',
  penthouse: 'Penthouse',
};

function getView(room) {
  const desc = (room.description || '').toLowerCase();
  if (desc.includes('garden')) return 'garden view';
  if (desc.includes('city')) return 'city view';
  if (desc.includes('ocean') || desc.includes('sea')) return 'ocean view';
  if (desc.includes('pool')) return 'pool view';
  if (desc.includes('mountain')) return 'mountain view';
  return 'garden view';
}

export default function RoomCard({ room, onBook }) {
  const status = STATUS_BADGE[room.status] || STATUS_BADGE.available;
  const isAvailable = room.status === 'available';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden hover:border-[#c9a962]/20 transition-all group"
    >
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] overflow-hidden">
        {room.image_url ? (
          <img src={room.image_url} alt={room.room_number} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BedDouble className="w-14 h-14 text-[#c9a962]/15" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.cls}`}>
            {status.label}
          </span>
        </div>
        {room.floor != null && (
          <div className="absolute top-3 right-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-black/60 text-white/80 backdrop-blur-sm">
              Floor {room.floor}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-white font-playfair text-lg font-semibold mb-0.5">#{room.room_number}</p>
        <h3 className="text-white font-playfair text-base mb-2.5">{TYPE_LABELS[room.room_type] || room.room_type}</h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-white/40 text-xs mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {room.capacity} guests
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {getView(room)}
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="w-3 h-3" /> Room
          </span>
        </div>

        {/* Amenities */}
        {room.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {room.amenities.slice(0, 4).map((a) => {
              const Icon = AMENITY_ICONS[(a || '').toLowerCase()];
              return (
                <span key={a} className="flex items-center gap-1 text-xs bg-[#262626] text-white/60 px-2 py-1 rounded-full">
                  {Icon && <Icon className="w-3 h-3" />}
                  {a}
                </span>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            <span className="text-[#c9a962] font-semibold text-sm">KSh {(room.price_per_night || 0).toLocaleString()}</span>
            <span className="text-white/30 text-xs"> / night</span>
          </div>
          <button
            onClick={() => isAvailable && onBook(room)}
            disabled={!isAvailable}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isAvailable
                ? 'bg-[#c9a962] text-black hover:bg-[#b8944f]'
                : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
            }`}
          >
            {isAvailable ? 'Book Now' : 'Unavailable'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}