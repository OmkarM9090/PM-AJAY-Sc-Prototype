/** Leaflet/OpenStreetMap view of empanelled training centres near the beneficiary. */

import { useEffect } from 'react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'

// Default marker assets are broken by bundlers — use a lightweight divIcon instead.
const icon = (label, colour) =>
  L.divIcon({
    className: '',
    html: `<div style="background:${colour};color:#fff;border-radius:9999px;padding:3px 8px;
      font:600 11px/1.3 'Noto Sans',sans-serif;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3)">
      ${label}</div>`,
    iconAnchor: [20, 12],
  })

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points.map((p) => [p.latitude, p.longitude]), { padding: [40, 40], maxZoom: 10 })
    } else if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 9)
    }
  }, [points, map])
  return null
}

export default function TrainingCenterMap({ centers = [], origin, height = 340 }) {
  const points = centers.filter((c) => c.latitude && c.longitude)
  const center = points[0]
    ? [points[0].latitude, points[0].longitude]
    : [25.3176, 82.9739] // Varanasi fallback

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200" style={{ height }}>
      <MapContainer center={center} zoom={8} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />

        {origin?.latitude && (
          <CircleMarker
            center={[origin.latitude, origin.longitude]}
            radius={9}
            pathOptions={{ color: '#FF9933', fillColor: '#FF9933', fillOpacity: 0.85 }}
          >
            <Popup>{origin.label || 'Your location'}</Popup>
          </CircleMarker>
        )}

        {points.map((c) => (
          <Marker
            key={c.center_id}
            position={[c.latitude, c.longitude]}
            icon={icon(`${c.distance_km ?? '—'} km`, '#1a237e')}
          >
            <Popup>
              <strong>{c.name}</strong>
              <br />
              {c.district}
              {c.distance_km != null && <> · {c.distance_km} km away</>}
              {c.next_batch_start && (
                <>
                  <br />
                  Next batch: {c.next_batch_start}
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
