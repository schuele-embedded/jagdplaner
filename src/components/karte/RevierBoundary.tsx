import { GeoJSON } from 'react-leaflet'
import { useRevier } from '@/hooks/useRevier'
import type { GeoJsonObject } from 'geojson'

export function RevierBoundary() {
  const { activeRevier } = useRevier()

  if (!activeRevier?.grenze_geojson) return null

  let geojson: GeoJsonObject
  try {
    geojson =
      typeof activeRevier.grenze_geojson === 'string'
        ? JSON.parse(activeRevier.grenze_geojson)
        : (activeRevier.grenze_geojson as unknown as GeoJsonObject)
  } catch {
    return null
  }

  return (
    <GeoJSON
      key={activeRevier.id}
      data={geojson}
      style={{
        color: '#2d5016',
        weight: 2,
        dashArray: '6 4',
        fillColor: '#4a7c23',
        fillOpacity: 0.08,
      }}
    />
  )
}
