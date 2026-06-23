import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { Input } from './ui/Input'

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

const DEFAULT_CENTER: [number, number] = [28.6139, 77.209]

interface MapPickerProps {
  latitude: number | null
  longitude: number | null
  onLocationChange: (lat: number, lng: number) => void
  error?: string
}

function LocationMarker({
  position,
  onLocationChange,
}: {
  position: [number, number] | null
  onLocationChange: (lat: number, lng: number) => void
}) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position)

  useEffect(() => {
    setMarkerPosition(position)
  }, [position])

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      setMarkerPosition([lat, lng])
      onLocationChange(lat, lng)
    },
  })

  return markerPosition ? <Marker position={markerPosition} /> : null
}

export function MapPicker({ latitude, longitude, onLocationChange, error }: MapPickerProps) {
  const position: [number, number] | null =
    latitude !== null && longitude !== null ? [latitude, longitude] : null

  const center = position || DEFAULT_CENTER

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Store Location <span className="text-red-500">*</span>
        </label>
        <p className="mb-2 text-sm text-slate-500">Tap or click on the map to set your store location.</p>
        <div
          className={`h-64 overflow-hidden rounded-lg border sm:h-80 ${
            error ? 'border-red-400' : 'border-slate-300'
          }`}
        >
          <MapContainer center={center} zoom={position ? 15 : 5} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} onLocationChange={onLocationChange} />
          </MapContainer>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Latitude"
          value={latitude !== null ? latitude.toFixed(6) : ''}
          readOnly
          placeholder="Select on map"
          className="bg-slate-50"
        />
        <Input
          label="Longitude"
          value={longitude !== null ? longitude.toFixed(6) : ''}
          readOnly
          placeholder="Select on map"
          className="bg-slate-50"
        />
      </div>
    </div>
  )
}
