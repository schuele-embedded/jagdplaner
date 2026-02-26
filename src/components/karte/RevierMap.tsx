import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet's default icon paths (broken in Vite builds)
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

interface MapClickHandlerProps {
  onMapClick: (latlng: { lat: number; lng: number }) => void
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

interface RevierMapProps {
  children?: React.ReactNode
  onMapClick?: (latlng: { lat: number; lng: number }) => void
  clickMode?: boolean
}

export function RevierMap({ children, onMapClick, clickMode = false }: RevierMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Force map resize when its container changes size
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'))
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="h-full w-full">
      <MapContainer
        center={[51.1, 10.4]}
        zoom={13}
        className={`h-full w-full ${clickMode ? 'cursor-crosshair' : ''}`}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {children}
      </MapContainer>
    </div>
  )
}
