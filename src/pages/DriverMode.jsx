import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, Truck, CheckCircle, AlertCircle, RefreshCw, Phone, StopCircle } from 'lucide-react';
import LuxuryButton from '@/components/common/LuxuryButton';
import SectionHeader from '@/components/common/SectionHeader';
import { toast } from 'sonner';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const driverIcon = L.divIcon({
  className: '',
  html: `<div style="width:44px;height:44px;background:#c9a962;border-radius:50%;border:3px solid #fff;box-shadow:0 4px 16px rgba(201,169,98,0.8);display:flex;align-items:center;justify-content:center;font-size:22px;">🚚</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const customerIcon = L.divIcon({
  className: '',
  html: `<div style="width:40px;height:40px;background:#1a1a1a;border-radius:50%;border:3px solid #c9a962;box-shadow:0 4px 12px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:20px;">🏠</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function RecenterMap({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView(pos, map.getZoom(), { animate: true });
  }, [pos]);
  return null;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DriverMode() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [gpsPos, setGpsPos] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [gpsPermission, setGpsPermission] = useState('unknown'); // unknown | granted | denied
  const [customerCoords, setCustomerCoords] = useState(null);
  const watchIdRef = useRef(null);
  const updateTimerRef = useRef(null);
  const lastSavedPos = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthLoading(false); }).catch(() => setAuthLoading(false));
  }, []);

  const { data: activeOrders = [] } = useQuery({
    queryKey: ['driver-active-orders'],
    queryFn: () => base44.entities.Order.filter({ status: 'out_for_delivery' }, '-created_date', 20),
    refetchInterval: 15000,
  });

  const selectedOrder = activeOrders.find(o => o.id === selectedOrderId);

  const updatePositionMutation = useMutation({
    mutationFn: ({ orderId, lat, lng }) =>
      base44.entities.Order.update(orderId, {
        driver_lat: lat,
        driver_lng: lng,
        driver_updated_at: new Date().toISOString(),
      }),
  });

  const markDeliveredMutation = useMutation({
    mutationFn: (orderId) =>
      base44.entities.Order.update(orderId, {
        status: 'delivered',
        driver_lat: null,
        driver_lng: null,
      }),
    onSuccess: () => {
      stopTracking();
      toast.success('✅ Order marked as delivered!');
      queryClient.invalidateQueries(['driver-active-orders']);
      setSelectedOrderId(null);
    },
  });

  // Geocode delivery address for the map customer pin
  useEffect(() => {
    if (!selectedOrder?.delivery_address) { setCustomerCoords(null); return; }
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(selectedOrder.delivery_address + ', Nairobi, Kenya')}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } })
      .then(r => r.json())
      .then(data => { if (data.length > 0) setCustomerCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]); })
      .catch(() => {});
  }, [selectedOrder?.delivery_address]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    clearInterval(updateTimerRef.current);
    setIsTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    if (!selectedOrderId) { toast.error('Select an order first'); return; }

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser/device.');
      return;
    }

    setGpsError(null);
    setIsTracking(true);
    toast.success('📍 GPS tracking started! Your location is now live.');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsPos([latitude, longitude]);
        setGpsPermission('granted');
        lastSavedPos.current = { lat: latitude, lng: longitude };
      },
      (err) => {
        const msgs = {
          1: 'Location permission denied. Please allow location access in your browser settings.',
          2: 'Location unavailable. Make sure you have a GPS signal.',
          3: 'Location request timed out. Retrying…',
        };
        setGpsError(msgs[err.code] || 'GPS error occurred.');
        setGpsPermission('denied');
        setIsTracking(false);
        toast.error(msgs[err.code] || 'GPS error occurred.');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    // Push to database every 5 seconds
    updateTimerRef.current = setInterval(() => {
      if (lastSavedPos.current && selectedOrderId) {
        updatePositionMutation.mutate({
          orderId: selectedOrderId,
          lat: lastSavedPos.current.lat,
          lng: lastSavedPos.current.lng,
        });
      }
    }, 5000);
  }, [selectedOrderId]);

  // Cleanup on unmount
  useEffect(() => () => { stopTracking(); }, [stopTracking]);

  const distKm = gpsPos && customerCoords
    ? haversine(gpsPos[0], gpsPos[1], customerCoords[0], customerCoords[1])
    : null;
  const etaMin = distKm ? Math.round((distKm / 30) * 60) : null;

  if (authLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
    </div>
  );

  if (!user || (user.role !== 'admin' && user.role !== 'driver')) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="font-playfair text-2xl text-white mb-2">Staff Only</h2>
        <p className="font-inter text-white/50">This page is for delivery drivers only.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <SectionHeader title="Driver Mode" subtitle="Live GPS Tracking" />

        {/* Order Selector */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/20 mb-6">
          <h3 className="font-playfair text-lg text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#c9a962]" />
            Select Active Delivery
          </h3>

          {activeOrders.length === 0 ? (
            <p className="font-inter text-white/50 text-sm text-center py-4">
              No active deliveries found. Orders with status "Out for Delivery" appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {activeOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => { if (!isTracking) setSelectedOrderId(order.id); }}
                  disabled={isTracking && selectedOrderId !== order.id}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedOrderId === order.id
                      ? 'bg-[#c9a962]/10 border-[#c9a962]'
                      : 'bg-[#0a0a0a] border-[#c9a962]/10 hover:border-[#c9a962]/30'
                  } disabled:opacity-40`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-inter font-semibold text-white text-sm">{order.customer_name}</p>
                      <p className="font-mono text-xs text-[#c9a962]">{order.order_reference}</p>
                      {order.delivery_address && (
                        <p className="font-inter text-xs text-white/50 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{order.delivery_address}
                        </p>
                      )}
                    </div>
                    {order.customer_phone && (
                      <a href={`tel:${order.customer_phone}`} onClick={e => e.stopPropagation()}>
                        <Phone className="w-5 h-5 text-[#c9a962]" />
                      </a>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GPS Controls */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/20 mb-6">
          <h3 className="font-playfair text-lg text-white mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[#c9a962]" />
            GPS Tracking
          </h3>

          {gpsError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="font-inter text-xs text-red-300">{gpsError}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#0a0a0a] rounded-xl p-3 text-center border border-[#c9a962]/10">
              <p className="font-inter text-[10px] text-[#c9a962] uppercase tracking-wider mb-1">Status</p>
              <div className="flex items-center justify-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                <p className="font-inter text-xs text-white">{isTracking ? 'Live' : 'Stopped'}</p>
              </div>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-3 text-center border border-[#c9a962]/10">
              <p className="font-inter text-[10px] text-[#c9a962] uppercase tracking-wider mb-1">Distance</p>
              <p className="font-inter text-sm font-semibold text-white">
                {distKm !== null ? `${distKm.toFixed(1)} km` : '—'}
              </p>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-3 text-center border border-[#c9a962]/10">
              <p className="font-inter text-[10px] text-[#c9a962] uppercase tracking-wider mb-1">ETA</p>
              <p className="font-inter text-sm font-semibold text-white">
                {etaMin !== null ? `~${etaMin} min` : '—'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {!isTracking ? (
              <LuxuryButton
                onClick={startTracking}
                disabled={!selectedOrderId}
                className="flex-1"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Start Delivery Tracking
              </LuxuryButton>
            ) : (
              <>
                <LuxuryButton
                  variant="secondary"
                  onClick={stopTracking}
                  className="flex-1"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Tracking
                </LuxuryButton>
                <LuxuryButton
                  onClick={() => markDeliveredMutation.mutate(selectedOrderId)}
                  disabled={markDeliveredMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-500"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Delivered
                </LuxuryButton>
              </>
            )}
          </div>
        </div>

        {/* Live Map */}
        {gpsPos && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#c9a962]/20"
          >
            <div className="p-4 flex items-center gap-2 border-b border-[#c9a962]/10">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="font-inter text-sm text-white font-medium">Your Live Location</p>
              <p className="ml-auto font-mono text-xs text-white/40">
                {gpsPos[0].toFixed(5)}, {gpsPos[1].toFixed(5)}
              </p>
            </div>
            <div style={{ height: 320 }}>
              <MapContainer center={gpsPos} zoom={15} style={{ width: '100%', height: '100%' }} attributionControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <RecenterMap pos={gpsPos} />
                <Marker position={gpsPos} icon={driverIcon}>
                  <Popup><span className="font-inter text-xs font-semibold">📍 You are here</span></Popup>
                </Marker>
                {customerCoords && (
                  <Marker position={customerCoords} icon={customerIcon}>
                    <Popup><span className="font-inter text-xs font-semibold">🏠 {selectedOrder?.delivery_address}</span></Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </motion.div>
        )}

        {!gpsPos && !gpsError && (
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#c9a962]/10 text-center">
            <MapPin className="w-12 h-12 text-[#c9a962]/30 mx-auto mb-3" />
            <p className="font-inter text-white/40 text-sm">
              Press "Start Delivery Tracking" to enable your GPS and go live.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}