import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { base44 } from '@/api/base44Client';

// Fix default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Restaurant fixed location — Nairobi CBD (update to exact coords as needed)
const RESTAURANT_COORDS = [-1.2921, 36.8219];

const makeIcon = (emoji, bg = '#c9a962', border = '#fff', size = 40) => L.divIcon({
  className: '',
  html: `<div style="width:${size}px;height:${size}px;background:${bg};border-radius:50%;border:3px solid ${border};box-shadow:0 4px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:${size * 0.45}px;">${emoji}</div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
});

const restaurantIcon = makeIcon('🍽️', '#1a1a1a', '#c9a962');
const customerIcon   = makeIcon('🏠', '#1a1a1a', '#c9a962');
const driverIcon     = makeIcon('🚚', '#c9a962', '#fff');

// Haversine distance in km
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Nominatim geocode (OpenStreetMap — free, no key needed)
async function geocodeAddress(address) {
  if (!address) return null;
  const query = `${address}, Nairobi, Kenya`;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  if (data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }
  return null;
}

// Smooth marker movement using CSS transition trick via repeated position updates
function AnimatedDriverMarker({ position }) {
  const [displayPos, setDisplayPos] = useState(position);
  const targetRef = useRef(position);
  const rafRef = useRef(null);

  useEffect(() => {
    targetRef.current = position;
    const animate = () => {
      setDisplayPos(prev => {
        const lat = prev[0] + (targetRef.current[0] - prev[0]) * 0.15;
        const lng = prev[1] + (targetRef.current[1] - prev[1]) * 0.15;
        const dist = Math.abs(lat - targetRef.current[0]) + Math.abs(lng - targetRef.current[1]);
        if (dist < 0.000001) return targetRef.current;
        return [lat, lng];
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [position[0], position[1]]);

  return (
    <Marker position={displayPos} icon={driverIcon}>
      <Popup><span className="font-inter text-xs font-semibold">🚚 Driver — Live GPS</span></Popup>
    </Marker>
  );
}

// Fit map to all visible points
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [50, 50] });
    }
  }, []);
  return null;
}

export default function DeliveryMap({ order }) {
  const [customerCoords, setCustomerCoords] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [driverPos, setDriverPos] = useState(
    order.driver_lat && order.driver_lng
      ? [order.driver_lat, order.driver_lng]
      : RESTAURANT_COORDS
  );
  const [liveOrder, setLiveOrder] = useState(order);

  // Geocode customer delivery address
  useEffect(() => {
    if (!order.delivery_address) {
      // Fallback: offset from restaurant
      const seed = order.id?.charCodeAt(0) || 5;
      setCustomerCoords([
        RESTAURANT_COORDS[0] + ((seed % 10) - 5) * 0.004,
        RESTAURANT_COORDS[1] + ((seed % 8)  - 4) * 0.004,
      ]);
      return;
    }
    setGeocoding(true);
    geocodeAddress(order.delivery_address)
      .then(coords => {
        if (coords) setCustomerCoords(coords);
        else {
          const seed = order.id?.charCodeAt(0) || 5;
          setCustomerCoords([
            RESTAURANT_COORDS[0] + ((seed % 10) - 5) * 0.004,
            RESTAURANT_COORDS[1] + ((seed % 8)  - 4) * 0.004,
          ]);
        }
      })
      .catch(() => setCustomerCoords(RESTAURANT_COORDS))
      .finally(() => setGeocoding(false));
  }, [order.delivery_address, order.id]);

  // Subscribe to real-time driver position updates
  useEffect(() => {
    const unsub = base44.entities.Order.subscribe(event => {
      if (event.id === order.id && event.type === 'update') {
        const updated = event.data;
        setLiveOrder(updated);
        if (updated.driver_lat && updated.driver_lng) {
          setDriverPos([updated.driver_lat, updated.driver_lng]);
        }
      }
    });
    return unsub;
  }, [order.id]);

  // Update from prop changes too
  useEffect(() => {
    if (order.driver_lat && order.driver_lng) {
      setDriverPos([order.driver_lat, order.driver_lng]);
    }
  }, [order.driver_lat, order.driver_lng]);

  const customer = customerCoords || RESTAURANT_COORDS;
  const hasDriver = liveOrder.driver_lat && liveOrder.driver_lng;
  const isActive  = liveOrder.status === 'out_for_delivery';
  const isDelivered = liveOrder.status === 'delivered';

  // Distance & ETA from driver to customer
  const distKm = hasDriver
    ? haversine(driverPos[0], driverPos[1], customer[0], customer[1])
    : haversine(RESTAURANT_COORDS[0], RESTAURANT_COORDS[1], customer[0], customer[1]);
  const etaMin = Math.round((distKm / 30) * 60); // 30 km/h avg speed

  const allPoints = [RESTAURANT_COORDS, driverPos, customer];

  // Polyline: restaurant → driver → customer
  const travelledLine = [RESTAURANT_COORDS, driverPos];
  const remainingLine  = [driverPos, customer];

  if (geocoding) {
    return (
      <div className="rounded-xl border border-[#c9a962]/20 bg-[#1a1a1a] h-72 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin mx-auto mb-3" />
          <p className="font-inter text-xs text-white/50">Loading map…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#c9a962]/10 text-center">
          <p className="font-inter text-[10px] text-[#c9a962] uppercase tracking-wider mb-1">Distance</p>
          <p className="font-inter text-lg font-semibold text-white">{distKm.toFixed(1)} km</p>
        </div>
        <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#c9a962]/10 text-center">
          <p className="font-inter text-[10px] text-[#c9a962] uppercase tracking-wider mb-1">ETA</p>
          <p className="font-inter text-lg font-semibold text-white">
            {isDelivered ? '✅' : `~${etaMin} min`}
          </p>
        </div>
        <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#c9a962]/10 text-center">
          <p className="font-inter text-[10px] text-[#c9a962] uppercase tracking-wider mb-1">GPS</p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${hasDriver && isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <p className="font-inter text-xs text-white/70">
              {hasDriver && isActive ? 'Live' : 'Waiting'}
            </p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-[#c9a962]/20" style={{ height: 340 }}>
        <MapContainer
          center={RESTAURANT_COORDS}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <FitBounds positions={allPoints} />

          {/* Travelled route — gold */}
          <Polyline positions={travelledLine} color="#c9a962" weight={5} opacity={0.9} />
          {/* Remaining route — muted dashed */}
          <Polyline positions={remainingLine} color="#c9a962" weight={3} opacity={0.3} dashArray="8 6" />

          {/* Restaurant pin */}
          <Marker position={RESTAURANT_COORDS} icon={restaurantIcon}>
            <Popup><span className="font-inter text-xs font-semibold">🍽️ Hermanas Bites</span></Popup>
          </Marker>

          {/* Customer pin */}
          <Marker position={customer} icon={customerIcon}>
            <Popup><span className="font-inter text-xs font-semibold">🏠 {order.delivery_address || 'Your Location'}</span></Popup>
          </Marker>

          {/* Driver pin — animated */}
          {(isActive || isDelivered) && (
            <AnimatedDriverMarker position={isDelivered ? customer : driverPos} />
          )}
        </MapContainer>
      </div>

      {!hasDriver && isActive && (
        <p className="font-inter text-xs text-yellow-400/70 text-center">
          ⏳ Waiting for driver to enable GPS tracking…
        </p>
      )}
    </div>
  );
}