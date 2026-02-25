import { useEffect, useState } from 'react'
import { fetchCurrentWeather } from '@/lib/wetter'
import type { WetterDaten } from '@/types'

interface WeatherState {
  wetter: WetterDaten | null
  loading: boolean
  error: string | null
}

export function useWeatherData(lat: number | null, lng: number | null): WeatherState {
  const [state, setState] = useState<WeatherState>({
    wetter: null,
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (lat === null || lng === null) return

    setState((s) => ({ ...s, loading: true, error: null }))
    fetchCurrentWeather(lat, lng)
      .then((wetter) => setState({ wetter, loading: false, error: null }))
      .catch((err: Error) => setState({ wetter: null, loading: false, error: err.message }))
  }, [lat, lng])

  return state
}
