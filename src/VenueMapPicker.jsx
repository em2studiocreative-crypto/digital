import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const defaultMapCenter = [-6.2088, 106.8456]
const mapMarkerIcon = L.divIcon({
  className: 'venue-map-marker',
  html: '<svg viewBox="0 0 32 40" aria-hidden="true"><path d="M16 1C7.7 1 1 7.7 1 16c0 11.1 15 23 15 23s15-11.9 15-23C31 7.7 24.3 1 16 1Z" fill="#263a2f" stroke="#fffdf8" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="#e4c78d"/></svg>',
  iconSize: [32, 40],
  iconAnchor: [16, 39],
})

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function MapViewportUpdater({ center }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 15), { animate: true })
  }, [center, map])
  return null
}

export default function VenueMapPicker({ latitude, longitude, onPick }) {
  const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude)
  const center = hasLocation ? [latitude, longitude] : defaultMapCenter
  return <MapContainer className="venue-map" center={center} zoom={hasLocation ? 15 : 12} scrollWheelZoom={false} aria-label="Peta pilih lokasi acara">
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <MapClickHandler onPick={onPick} />
    {hasLocation && <>
      <MapViewportUpdater center={center} />
      <Marker position={center} icon={mapMarkerIcon} keyboard title="Lokasi acara yang dipilih" />
    </>}
  </MapContainer>
}
