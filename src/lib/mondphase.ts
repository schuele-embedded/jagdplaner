import SunCalc from 'suncalc'
import type { Mondphase } from '@/types'

// ---- Moon phase ----------------------------------------------------------

export function getMoonPhase(date: Date): Mondphase {
  const { phase } = SunCalc.getMoonIllumination(date)
  // phase: 0 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter
  if (phase < 0.05 || phase >= 0.95) return 'Neumond'
  if (phase < 0.25) return 'zunehmend'
  if (phase < 0.30) return 'Halbmond_zunehmend'
  if (phase < 0.55) return 'Vollmond'
  if (phase < 0.75) return 'abnehmend'
  return 'Halbmond_abnehmend'
}

export function getMoonIllumination(date: Date): number {
  return Math.round(SunCalc.getMoonIllumination(date).fraction * 100)
}

// ---- Sun times -----------------------------------------------------------

export interface SunTimes {
  sunrise: Date
  sunset: Date
  dawn: Date   // civil dawn
  dusk: Date   // civil dusk
}

export function getSunTimes(lat: number, lng: number, date: Date): SunTimes {
  const times = SunCalc.getTimes(date, lat, lng)
  return {
    sunrise: times.sunrise,
    sunset: times.sunset,
    dawn: times.dawn,
    dusk: times.dusk,
  }
}

export function isHuntingHour(lat: number, lng: number, date: Date): boolean {
  const times = getSunTimes(lat, lng, date)
  return date >= times.dawn && date <= times.dusk
}
