import { useEffect, useState } from 'react'

interface GeolocationState {
  position: { lat: number; lng: number } | null
  loading: boolean
  error: string | null
}

export function useGeolocation(watch = false): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ position: null, loading: false, error: 'Geolocation nicht verfügbar.' })
      return
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setState({
        position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        loading: false,
        error: null,
      })
    }

    const onError = (err: GeolocationPositionError) => {
      setState({ position: null, loading: false, error: err.message })
    }

    const options: PositionOptions = { enableHighAccuracy: true, timeout: 10000 }

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, options)
      return () => navigator.geolocation.clearWatch(id)
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
    }
  }, [watch])

  return state
}
