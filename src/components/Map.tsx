"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

const defaultIcon = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
delete defaultIcon._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapProps { center: [number, number]; radiusKm?: number; markers?: { id: string; lat: number; lng: number; title: string; type: string; }[]; }

/** Leaflet is dynamically loaded by callers, so it only runs in the browser. */
export default function Map({ center, radiusKm, markers = [] }: MapProps) {
  return <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%", zIndex: 0 }} className="rounded-2xl">
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Marker position={center}><Popup>Beneficiary area (illustrative)</Popup></Marker>
    {radiusKm && <Circle center={center} radius={radiusKm * 1000} pathOptions={{ fillColor: "#138808", color: "#138808", weight: 2, fillOpacity: 0.08 }} />}
    {markers.map((marker) => <Marker key={marker.id} position={[marker.lat, marker.lng]}><Popup><b>{marker.title}</b><br/><small>{marker.type}</small></Popup></Marker>)}
  </MapContainer>;
}
