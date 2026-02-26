import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, LayersControl, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet's default icon paths (broken in Vite builds)
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

// Tile layer definitions
const LAYERS = {
  osm: {
    label: 'Karte',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    label: 'Satellit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  topo: {
    label: 'Topographie',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 17,
  },
}

interface MapClickHandlerProps {
  onMapClick: (latlng: { lat: number; lng: number }) => void
  clickMode: boolean
}

function MapClickHandler({ onMapClick, clickMode }: MapClickHandlerProps) {
  // Use ref to always have the latest callback & clickMode without stale closure
  const cbRef = useRef(onMapClick)
  const modeRef = useRef(clickMode)
  useEffect(() => { cbRef.current = onMapClick }, [onMapClick])
  useEffect(() => { modeRef.current = clickMode }, [clickMode])

  useMapEvents({
    click(e) {
      if (modeRef.current) {
        cbRef.current({ lat: e.latlng.lat, lng: e.latlng.lng })
      }
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
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name={LAYERS.osm.label}>
            <TileLayer url={LAYERS.osm.url} attribution={LAYERS.osm.attribution} maxZoom={LAYERS.osm.maxZoom} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name={LAYERS.satellite.label}>
            <TileLayer url={LAYERS.satellite.url} attribution={LAYERS.satellite.attribution} maxZoom={LAYERS.satellite.maxZoom} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name={LAYERS.topo.label}>
            <TileLayer url={LAYERS.topo.url} attribution={LAYERS.topo.attribution} maxZoom={LAYERS.topo.maxZoom} />
          </LayersControl.BaseLayer>
        </LayersControl>

        {onMapClick && <MapClickHandler onMapClick={onMapClick} clickMode={clickMode} />}
        {children}
      </MapContainer>
    </div>
  )
}
