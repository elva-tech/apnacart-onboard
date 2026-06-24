export interface PincodeArea {
  lat: number
  lng: number
  city?: string
  state?: string
  label?: string
}

interface PostalOffice {
  Name?: string
  District?: string
  State?: string
  Block?: string
}

const INDIA_BOUNDS = {
  minLat: 6.0,
  maxLat: 37.5,
  minLng: 68.0,
  maxLng: 97.5,
}

const DISTRICT_ALIASES: Record<string, string> = {
  'bangalore urban': 'Bengaluru',
  'bangalore rural': 'Bengaluru',
  bengaluru: 'Bengaluru',
  bangalore: 'Bengaluru',
  'new delhi': 'New Delhi',
  delhi: 'New Delhi',
  mumbai: 'Mumbai',
  bombay: 'Mumbai',
  chennai: 'Chennai',
  madras: 'Chennai',
  kolkata: 'Kolkata',
  calcutta: 'Kolkata',
  hyderabad: 'Hyderabad',
  pune: 'Pune',
  ahmedabad: 'Ahmedabad',
}

export function normalizeLongitude(lng: number): number {
  let normalized = lng
  while (normalized > 180) normalized -= 360
  while (normalized < -180) normalized += 360
  return normalized
}

export function isCoordinateInIndia(lat: number, lng: number): boolean {
  return (
    lat >= INDIA_BOUNDS.minLat &&
    lat <= INDIA_BOUNDS.maxLat &&
    lng >= INDIA_BOUNDS.minLng &&
    lng <= INDIA_BOUNDS.maxLng
  )
}

export function parseLatitude(value: string): number | null {
  const num = parseFloat(value.trim())
  if (isNaN(num) || num < -90 || num > 90) return null
  return num
}

export function parseLongitude(value: string): number | null {
  const num = parseFloat(value.trim())
  if (isNaN(num)) return null
  const normalized = normalizeLongitude(num)
  if (normalized < -180 || normalized > 180) return null
  return normalized
}

function normalizeDistrictName(district: string): string {
  const trimmed = district.trim()
  if (!trimmed) return trimmed
  return DISTRICT_ALIASES[trimmed.toLowerCase()] || trimmed
}

function pincodeApiUrl(pincode: string): string {
  return `/api/geocode/pincode/${pincode}`
}

function nominatimApiUrl(params: Record<string, string>): string {
  return `/api/geocode/nominatim?${new URLSearchParams(params).toString()}`
}

async function fetchPostalDetails(pincode: string): Promise<{
  district: string
  state: string
  offices: PostalOffice[]
} | null> {
  try {
    const res = await fetch(pincodeApiUrl(pincode))
    if (!res.ok) return null

    const data = (await res.json()) as {
      Status?: string
      PostOffice?: PostalOffice[]
    }

    if (data.Status !== 'Success' || !data.PostOffice?.length) return null

    const primary = data.PostOffice[0]
    return {
      district: primary.District || primary.Block || '',
      state: primary.State || '',
      offices: data.PostOffice,
    }
  } catch {
    return null
  }
}

async function geocodeWithOpenMeteo(query: string): Promise<{ lat: number; lng: number; label?: string } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en`,
    )
    if (!res.ok) return null

    const data = (await res.json()) as {
      results?: { name: string; latitude: number; longitude: number; country_code?: string }[]
    }

    for (const result of data.results || []) {
      if (result.country_code !== 'IN') continue
      const lng = normalizeLongitude(result.longitude)
      if (isCoordinateInIndia(result.latitude, lng)) {
        return { lat: result.latitude, lng, label: result.name }
      }
    }
  } catch {
    return null
  }

  return null
}

async function geocodeWithNominatim(
  params: Record<string, string>,
): Promise<{ lat: number; lng: number; label?: string } | null> {
  try {
    const res = await fetch(nominatimApiUrl({ ...params, format: 'json', limit: '5', countrycodes: 'in' }), {
      headers: { Accept: 'application/json', 'Accept-Language': 'en' },
    })
    if (!res.ok) return null

    const results = (await res.json()) as { lat?: string; lon?: string; display_name?: string }[]

    for (const result of results) {
      if (!result.lat || !result.lon) continue
      const lat = parseFloat(result.lat)
      const lng = normalizeLongitude(parseFloat(result.lon))
      if (isCoordinateInIndia(lat, lng)) {
        return { lat, lng, label: result.display_name }
      }
    }
  } catch {
    return null
  }

  return null
}

async function geocodePlaceName(
  district: string,
  state: string,
  postOfficeName?: string,
  pincode?: string,
): Promise<{ lat: number; lng: number; label?: string } | null> {
  const queries = [
    postOfficeName && district && state ? `${postOfficeName}, ${district}, ${state}` : '',
    district && state ? `${district}, ${state}` : '',
    district && state ? `${district}, ${state}, India` : '',
    state && pincode ? `${pincode}, ${state}, India` : '',
    district || '',
  ].filter(Boolean)

  for (const query of queries) {
    const openMeteo = await geocodeWithOpenMeteo(query)
    if (openMeteo) return openMeteo
  }

  if (district && state) {
    const nominatim = await geocodeWithNominatim({
      postalcode: pincode || '',
      city: district,
      state,
      country: 'India',
    })
    if (nominatim) return nominatim

    const nominatimQuery = await geocodeWithNominatim({ q: `${district}, ${state}, India` })
    if (nominatimQuery) return nominatimQuery
  }

  return null
}

export async function lookupPincodeArea(
  pincode: string,
  city?: string,
  state?: string,
): Promise<PincodeArea | null> {
  if (!/^\d{6}$/.test(pincode)) return null

  const postal = await fetchPostalDetails(pincode)
  const district = normalizeDistrictName(city?.trim() || postal?.district || '')
  const region = state?.trim() || postal?.state || ''
  const postOfficeName = postal?.offices[0]?.Name || ''

  const geocoded = await geocodePlaceName(district, region, postOfficeName, pincode)
  if (!geocoded) return null

  return {
    lat: geocoded.lat,
    lng: geocoded.lng,
    city: district || undefined,
    state: region || undefined,
    label: geocoded.label,
  }
}
