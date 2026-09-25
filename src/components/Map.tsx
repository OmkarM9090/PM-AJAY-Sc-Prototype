"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  center: [number, number];
  radiusKm?: number;
  markers?: {
    id: string;
    lat: number;
    lng: number;
    title: string;
    type: string;
  }[];
}

export default function Map({ center, radiusKm, markers = [] }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-gray-100 animate-pulse rounded-2xl" />;

  return (
    <MapContainer 
      center={center} 
      zoom={11} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      className="rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* User Location */}
      <Marker position={center}>
        <Popup>Your Location</Popup>
      </Marker>

      {/* Search Radius */}
      {radiusKm && (
        <Circle 
          center={center} 
          radius={radiusKm * 1000} // convert km to meters
          pathOptions={{ fillColor: '#3b82f6', color: '#2563eb', weight: 2, fillOpacity: 0.1 }}
        />
      )}

      {/* Opportunity Markers */}
      {markers.map(m => (
        <Marker key={m.id} position={[m.lat, m.lng]}>
          <Popup>
            <div className="font-bold">{m.title}</div>
            <div className="text-xs text-gray-500 capitalize">{m.type}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
