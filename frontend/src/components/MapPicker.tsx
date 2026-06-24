import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { Input } from './ui/Input'
import { useWorkflowFormLocked } from '../context/WorkflowFormEditContext'
import { normalizeLongitude, parseLatitude, parseLongitude, isCoordinateInIndia } from '../utils/geocode'

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

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]

interface MapPickerProps {
  latitude: number | null
  longitude: number | null
  onLocationChange: (lat: number, lng: number) => void
  viewCenter?: [number, number] | null
  viewCenterVersion?: number
  viewZoom?: number
  areaLoading?: boolean
  error?: string
}

function PincodeViewController({
  center,
  zoom,
  version,
}: {
  center: [number, number] | null
  zoom: number
  version: number
}) {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 0.9 })
    }
  }, [center, zoom, version, map])

  return null
}

function MarkerViewController({ position }: { position: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (!position) return
    map.flyTo(position, 15, { duration: 0.6 })
  }, [position?.[0], position?.[1], map])

  return null
}

function LocationMarker({
  position,
  onLocationChange,
  readOnly,
}: {
  position: [number, number] | null
  onLocationChange: (lat: number, lng: number) => void
  readOnly: boolean
}) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position)

  useEffect(() => {
    setMarkerPosition(position)
  }, [position])

  const updatePosition = (lat: number, lng: number) => {
    const normalizedLng = normalizeLongitude(lng)
    setMarkerPosition([lat, normalizedLng])
    onLocationChange(lat, normalizedLng)
  }

  useMapEvents({
    click(e) {
      if (readOnly) return
      updatePosition(e.latlng.lat, e.latlng.lng)
    },
  })

  if (!markerPosition) return null

  return (
    <Marker
      position={markerPosition}
      draggable={!readOnly}
      eventHandlers={{
        dragend: (e) => {
          if (readOnly) return
          const { lat, lng } = e.target.getLatLng()
          updatePosition(lat, lng)
        },
      }}
    />
  )
}

export function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  viewCenter = null,
  viewCenterVersion = 0,
  viewZoom = 13,
  areaLoading = false,
  error,
}: MapPickerProps) {
  const locked = useWorkflowFormLocked()
  const position: [number, number] | null =
    latitude !== null &&
    longitude !== null &&
    !(latitude === 0 && longitude === 0) &&
    isCoordinateInIndia(latitude, longitude)
      ? [latitude, longitude]
      : null

  const initialCenter = viewCenter || position || DEFAULT_CENTER
  const initialZoom = viewCenter ? viewZoom : position ? 15 : 5

  const [latInput, setLatInput] = useState(latitude !== null ? String(latitude) : '')
  const [lngInput, setLngInput] = useState(longitude !== null ? String(longitude) : '')

  useEffect(() => {
    setLatInput(latitude !== null ? String(latitude) : '')
    setLngInput(longitude !== null ? String(longitude) : '')
  }, [latitude, longitude])

  const commitCoordinates = () => {
    if (locked) return
    const lat = parseLatitude(latInput)
    const lng = parseLongitude(lngInput)
    if (lat === null || lng === null) return
    if (!isCoordinateInIndia(lat, lng)) return
    onLocationChange(lat, lng)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Store Location <span className="text-red-500">*</span>
        </label>
        <p className="mb-2 text-sm text-slate-500">
          Click &quot;Locate on map&quot; after entering your pincode, then click the map or drag the
          pin for the exact spot. You can also type latitude and longitude below.
        </p>
        <div
          className={`relative h-64 overflow-hidden rounded-lg border sm:h-80 ${
            error ? 'border-red-400' : 'border-slate-300'
          }`}
        >
          {areaLoading && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/70 text-sm font-medium text-slate-700">
              Finding area for pincode…
            </div>
          )}
          <MapContainer center={initialCenter} zoom={initialZoom} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <PincodeViewController center={viewCenter} zoom={viewZoom} version={viewCenterVersion} />
            <MarkerViewController position={position} />
            <LocationMarker position={position} onLocationChange={onLocationChange} readOnly={locked} />
          </MapContainer>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Latitude"
          value={latInput}
          onChange={(e) => setLatInput(e.target.value)}
          onBlur={commitCoordinates}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitCoordinates()
            }
          }}
          placeholder="e.g. 28.613900"
          inputMode="decimal"
          hint="Editable — press Enter or leave field to update map"
        />
        <Input
          label="Longitude"
          value={lngInput}
          onChange={(e) => setLngInput(e.target.value)}
          onBlur={commitCoordinates}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitCoordinates()
            }
          }}
          placeholder="e.g. 77.209000"
          inputMode="decimal"
          hint="Editable — press Enter or leave field to update map"
        />
      </div>
    </div>
  )
}
