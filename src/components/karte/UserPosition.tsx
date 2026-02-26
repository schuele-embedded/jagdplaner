import { useEffect, useRef } from 'react'
import { CircleMarker, useMap } from 'react-leaflet'
import { useGeolocation } from '@/hooks/useGeolocation'
import { MapPin } from 'lucide-react'

export function UserPosition() {
  const { position, error, loading } = useGeolocation(false)
  const map = useMap()
  const hasCenteredRef = useRef(false)

  // Auto-center on first position fix
  useEffect(() => {
    if (position && !hasCenteredRef.current) {
      map.flyTo([position.lat, position.lng], 15, { duration: 1.5 })
      hasCenteredRef.current = true
    }
  }, [position, map])

  function handleLocate() {
    if (position) {
      map.flyTo([position.lat, position.lng], 15, { duration: 1.5 })
    }
  }

  return (
    <>
      {/* GPS locate button */}
      <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'auto' }}>
        <div className="leaflet-control" style={{ marginBottom: '1rem', marginRight: '1rem' }}>
          <button
            onClick={handleLocate}
            disabled={loading}
            title="Meinen Standort anzeigen"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            ) : (
              <MapPin size={18} className={position ? 'text-green-700' : 'text-gray-500'} />
            )}
          </button>
          {error && (
            <p className="mt-1 text-xs text-red-600 bg-white rounded px-1">{error}</p>
          )}
        </div>
      </div>

      {/* Blue dot at user position */}
      {position && (
        <CircleMarker
          center={[position.lat, position.lng]}
          radius={8}
          pathOptions={{
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.9,
            weight: 2,
          }}
        />
      )}
    </>
  )
}
