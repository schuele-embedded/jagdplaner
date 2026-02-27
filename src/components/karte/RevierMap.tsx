import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, LayersControl, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet's default icon paths (broken in Vite builds)
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

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
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
  },
}

// Persists map center/zoom and active layer in localStorage
const MAP_POS_KEY = 'ansitzplaner-map-pos'
const MAP_LAYER_KEY = 'ansitzplaner-map-layer'

function getStoredLayer(): string {
  return localStorage.getItem(MAP_LAYER_KEY) ?? LAYERS.osm.label
}

function getStoredMapPos(): { center: [number, number]; zoom: number } {
  try {
    const raw = localStorage.getItem(MAP_POS_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (typeof p.lat === 'number' && typeof p.lng === 'number' && typeof p.zoom === 'number') {
        return { center: [p.lat, p.lng], zoom: p.zoom }
      }
    }
  } catch {
    // ignore
  }
  return { center: [47.8, 13.0], zoom: 13 } // Austria/Bavaria default
}

function MapPositionPersist() {
  const map = useMapEvents({
    moveend() {
      const c = map.getCenter()
      localStorage.setItem(MAP_POS_KEY, JSON.stringify({ lat: c.lat, lng: c.lng, zoom: map.getZoom() }))
    },
    zoomend() {
      const c = map.getCenter()
      localStorage.setItem(MAP_POS_KEY, JSON.stringify({ lat: c.lat, lng: c.lng, zoom: map.getZoom() }))
    },
    baselayerchange(e) {
      localStorage.setItem(MAP_LAYER_KEY, e.name)
    },
  })
  return null
}


function MapResizeHandler() {
  const map = useMap()
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const container = map.getContainer()
    containerRef.current = container

    const observer = new ResizeObserver(() => {
      map.invalidateSize()
    })
    observer.observe(container)
    // Initial invalidate after mount
    setTimeout(() => map.invalidateSize(), 100)
    return () => observer.disconnect()
  }, [map])

  return null
}

interface MapClickHandlerProps {
  onMapClick: (latlng: { lat: number; lng: number }) => void
  clickMode: boolean
}

function MapClickHandler({ onMapClick, clickMode }: MapClickHandlerProps) {
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
  const { center, zoom } = getStoredMapPos()
  const activeLayer = getStoredLayer()
  return (
    // absolute inset-0 fills the relatively-positioned parent reliably
    <div className={`absolute inset-0 ${clickMode ? 'cursor-crosshair' : ''}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <MapResizeHandler />
        <MapPositionPersist />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked={activeLayer === LAYERS.osm.label} name={LAYERS.osm.label}>
            <TileLayer url={LAYERS.osm.url} attribution={LAYERS.osm.attribution} maxZoom={LAYERS.osm.maxZoom} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked={activeLayer === LAYERS.satellite.label} name={LAYERS.satellite.label}>
            <TileLayer url={LAYERS.satellite.url} attribution={LAYERS.satellite.attribution} maxZoom={LAYERS.satellite.maxZoom} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked={activeLayer === LAYERS.topo.label} name={LAYERS.topo.label}>
            <TileLayer url={LAYERS.topo.url} attribution={LAYERS.topo.attribution} maxZoom={LAYERS.topo.maxZoom} />
          </LayersControl.BaseLayer>
        </LayersControl>

        {onMapClick && <MapClickHandler onMapClick={onMapClick} clickMode={clickMode} />}
        {children}
      </MapContainer>
    </div>
  )
}
