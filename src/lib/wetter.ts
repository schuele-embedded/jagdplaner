import type { WetterDaten, Windrichtung, Niederschlag } from '@/types'

// ---- Cache ---------------------------------------------------------------
const cache = new Map<string, { data: WetterDaten; timestamp: number }>()
const CACHE_TTL_MS = 15 * 60 * 1000

function cacheKey(lat: number, lng: number): string {
  const hour = new Date().toISOString().slice(0, 13) // YYYY-MM-DDTHH
  return `${lat.toFixed(2)}_${lng.toFixed(2)}_${hour}`
}

// ---- Helpers -------------------------------------------------------------

export function windDegToCardinal(deg: number): Windrichtung {
  const dirs: Windrichtung[] = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

export function windSpeedToBeaufort(kmh: number): number {
  const thresholds = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118]
  return thresholds.findIndex((t) => kmh < t)
}

export function niederschlagFromMm(mm: number): Niederschlag {
  if (mm <= 0) return 'kein'
  if (mm <= 2) return 'leicht'
  if (mm <= 10) return 'mittel'
  return 'stark'
}

// ---- Open-Meteo ----------------------------------------------------------

interface OpenMeteoResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
    wind_speed_10m: number[]
    wind_direction_10m: number[]
    precipitation: number[]
    cloud_cover: number[]
    pressure_msl: number[]
  }
}

export async function fetchCurrentWeather(lat: number, lng: number): Promise<WetterDaten> {
  const key = cacheKey(lat, lng)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat.toFixed(4))
  url.searchParams.set('longitude', lng.toFixed(4))
  url.searchParams.set('hourly', 'temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover,pressure_msl')
  url.searchParams.set('timezone', 'Europe/Berlin')
  url.searchParams.set('forecast_days', '1')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Open-Meteo Fehler: ${res.status}`)
  const json: OpenMeteoResponse = await res.json()

  // Find the index for the current hour
  const now = new Date()
  const currentHour = `${now.toISOString().slice(0, 13)}:00`
  const hourIdx = json.hourly.time.findIndex((t) => t === currentHour)
  const idx = hourIdx !== -1 ? hourIdx : 0

  // Import getMoonPhase lazily to avoid circular issues
  const { getMoonPhase, getSunTimes } = await import('@/lib/mondphase')
  const sunTimes = getSunTimes(lat, lng, now)
  const formatTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  const data: WetterDaten = {
    temperatur_celsius: json.hourly.temperature_2m[idx],
    windrichtung: windDegToCardinal(json.hourly.wind_direction_10m[idx]),
    windstaerke_bft: windSpeedToBeaufort(json.hourly.wind_speed_10m[idx]),
    niederschlag_mm: json.hourly.precipitation[idx],
    bewoelkung_prozent: json.hourly.cloud_cover[idx],
    luftdruck_hpa: json.hourly.pressure_msl[idx],
    mondphase: getMoonPhase(now),
    sonnenaufgang: formatTime(sunTimes.sunrise),
    sonnenuntergang: formatTime(sunTimes.sunset),
    fetched_at: now.toISOString(),
  }

  cache.set(key, { data, timestamp: Date.now() })
  return data
}

export function getManualFallbackData(): Partial<WetterDaten> {
  return {}
}

export function getNiederschlagLabel(mm: number): Niederschlag {
  return niederschlagFromMm(mm)
}
