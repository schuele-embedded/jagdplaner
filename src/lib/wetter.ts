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

// ---- 7-day forecast ------------------------------------------------------

export interface TagesForecast {
  datum: string          // YYYY-MM-DD
  tempMax: number
  tempMin: number
  niederschlag_mm: number
  wind_kmh: number
  windrichtung: Windrichtung
  bewoelkung: number     // 0–100
  jagdScore: number      // 0–100
}

interface OpenMeteoDailyResponse {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    wind_speed_10m_max: number[]
    wind_direction_10m_dominant: number[]
    cloud_cover_mean: number[]
  }
}

function calcJagdScore(
  tempMax: number,
  tempMin: number,
  niederschlag_mm: number,
  wind_kmh: number,
  bewoelkung: number,
): number {
  let score = 50
  const tempAvg = (tempMax + tempMin) / 2
  if (tempAvg >= 5 && tempAvg <= 15) score += 15
  else if (tempAvg > 25 || tempAvg < -5) score -= 15
  if (niederschlag_mm === 0) score += 10
  else if (niederschlag_mm > 2) score -= 20
  const bft = windSpeedToBeaufort(wind_kmh)
  if (bft <= 2) score += 15
  else if (bft >= 4) score -= 15
  if (bewoelkung >= 30 && bewoelkung <= 70) score += 10
  else if (bewoelkung > 90) score -= 10
  return Math.max(0, Math.min(100, Math.round(score)))
}

const weeklyCache = new Map<string, { data: TagesForecast[]; timestamp: number }>()
const WEEKLY_CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function fetchWeeklyForecast(lat: number, lng: number): Promise<TagesForecast[]> {
  const key = `weekly_${lat.toFixed(2)}_${lng.toFixed(2)}_${new Date().toISOString().slice(0, 10)}`
  const cached = weeklyCache.get(key)
  if (cached && Date.now() - cached.timestamp < WEEKLY_CACHE_TTL) {
    return cached.data
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat.toFixed(4))
  url.searchParams.set('longitude', lng.toFixed(4))
  url.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,cloud_cover_mean',
  )
  url.searchParams.set('timezone', 'Europe/Berlin')
  url.searchParams.set('forecast_days', '7')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Open-Meteo Fehler: ${res.status}`)
  const json: OpenMeteoDailyResponse = await res.json()

  const data: TagesForecast[] = json.daily.time.map((datum, i) => {
    const tempMax = json.daily.temperature_2m_max[i]
    const tempMin = json.daily.temperature_2m_min[i]
    const niederschlag_mm = json.daily.precipitation_sum[i]
    const wind_kmh = json.daily.wind_speed_10m_max[i]
    const windrichtung = windDegToCardinal(json.daily.wind_direction_10m_dominant[i])
    const bewoelkung = json.daily.cloud_cover_mean[i]
    return {
      datum,
      tempMax,
      tempMin,
      niederschlag_mm,
      wind_kmh,
      windrichtung,
      bewoelkung,
      jagdScore: calcJagdScore(tempMax, tempMin, niederschlag_mm, wind_kmh, bewoelkung),
    }
  })

  weeklyCache.set(key, { data, timestamp: Date.now() })
  return data
}
