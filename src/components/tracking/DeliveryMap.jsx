import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { Truck, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom gold driver marker
const driverIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;
    background:#c9a962;
    border-radius:50%;
    border:3px solid #fff;
    box-shadow:0 2px 8px rgba(201,169,98,0.7);
    display:flex;align-items:center;justify-content:center;
    font-size:18px;
  ">🚚</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Custom restaurant marker
const restaurantIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;
    background:#1a1a1a;
    border-radius:50%;
    border:2px solid #c9a962;
    box-shadow:0 2px 8px rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;
    font-size:18px;
  ">🍽️</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Customer marker
const customerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;
    background:#1a1a1a;
    border-radius:50%;
    border:2px solid #c9a962;
    box-shadow:0 2px 8px rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;
    font-size:18px;
  ">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Nairobi-area coordinates: restaurant origin
const RESTAURANT = [-1.2921, 36.8219];

// Simulate a delivery destination slightly offset from the restaurant
const getDestination = (orderId) => {
  const seed = orderId ? orderId.charCodeAt(0) + orderId.charCodeAt(orderId.length - 1) : 42;
  const latOffset = ((seed % 20) - 10) * 0.003;
  const lngOffset = ((seed % 15) - 7) * 0.003;
  return [RESTAURANT[0] + latOffset, RESTAURANT[1] + lngOffset];
};

// Interpolate between two points
const interpolate = (start, end, t) => [
  start[0] + (end[0] - start[0]) * t,
  start[1] + (end[1] - start[1]) * t,
];

// Build a curved-ish route by adding intermediate waypoints
const buildRoute = (start, end) => {
  const mid1 = interpolate(start, end, 0.33);
  const mid2 = interpolate(start, end, 0.66);
  // Slight perpendicular offset for visual curve effect
  const dx = end[1] - start[1];
  const dy = end[0] - start[0];
  mid1[0] += dx * 0.05;
  mid1[1] -= dy * 0.05;
  mid2[0] -= dx * 0.05;
  mid2[1] += dy * 0.05;
  return [start, mid1, mid2, end];
};

// Component to fit map bounds to route
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, []);
  return null;
}

export default function DeliveryMap({ order }) {
  const destination = getDestination(order.id);
  const route = buildRoute(RESTAURANT, destination);

  const isDelivered = order.status === 'delivered';
  const [driverPos, setDriverPos] = useState(isDelivered ? destination : RESTAURANT);
  const [progress, setProgress] = useState(isDelivered ? 1 : 0);
  const animRef = useRef(null);
  const startTimeRef = useRef(null);
  const DURATION = 30000; // 30s for a full simulated trip

  useEffect(() => {
    if (order.status !== 'out_for_delivery') return;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      setProgress(t);
      // Interpolate along route segments
      const totalSegments = route.length - 1;
      const segment = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
      const segT = (t * totalSegments) - segment;
      setDriverPos(interpolate(route[segment], route[segment + 1], segT));

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [order.status]);

  // Portion of route already travelled (gold), remainder (dimmed)
  const totalSegments = route.length - 1;
  const splitIndex = Math.min(Math.floor(progress * totalSegments), totalSegments - 1);
  const segT = (progress * totalSegments) - splitIndex;
  const splitPoint = interpolate(route[splitIndex], route[splitIndex + 1], segT);

  const travelledRoute = [...route.slice(0, splitIndex + 1), splitPoint];
  const remainingRoute = [splitPoint, ...route.slice(splitIndex + 1)];

  return (
    <div className="rounded-xl overflow-hidden border border-[#c9a962]/20" style={{ height: 320 }}>
      <MapContainer
        center={RESTAURANT}
        zoom={14}
        style={{ width: '100%', height: '100%', background: '#0a0a0a' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
        />
        <FitBounds positions={route} />

        {/* Route: completed portion in gold */}
        <Polyline positions={travelledRoute} color="#c9a962" weight={4} opacity={0.9} />
        {/* Route: remaining in muted */}
        <Polyline positions={remainingRoute} color="#c9a962" weight={3} opacity={0.25} dashArray="6 6" />

        {/* Restaurant marker */}
        <Marker position={RESTAURANT} icon={restaurantIcon}>
          <Popup className="dark-popup">
            <span className="font-inter text-xs font-medium">🍽️ Hermanas Bites</span>
          </Popup>
        </Marker>

        {/* Customer / destination marker */}
        <Marker position={destination} icon={customerIcon}>
          <Popup>
            <span className="font-inter text-xs font-medium">📍 Your Location</span>
          </Popup>
        </Marker>

        {/* Driver marker — animated */}
        {(order.status === 'out_for_delivery' || order.status === 'delivered') && (
          <Marker position={driverPos} icon={driverIcon}>
            <Popup>
              <span className="font-inter text-xs font-medium">
                {isDelivered ? '✅ Delivered!' : `🚚 ${order.assigned_staff_name || 'Driver'} — On the way`}
              </span>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}