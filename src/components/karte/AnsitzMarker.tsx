import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Ansitzeinrichtung, EinrichtungTyp, EinrichtungZustand } from '@/types'
import { EinrichtungPopup } from '@/components/einrichtungen/EinrichtungPopup'

// Color per zustand
const ZUSTAND_COLOR: Record<EinrichtungZustand, string> = {
  gut: '#22c55e',
  mittel: '#eab308',
  schlecht: '#f97316',
  gesperrt: '#ef4444',
}

// SVG path per typ
function typSvgPath(typ: EinrichtungTyp): string {
  switch (typ) {
    case 'Hochsitz':
      // Tower silhouette
      return 'M8 2v5H5l3 3v6h4v-6l3-3h-3V2H8z'
    case 'Kanzel':
      // Tent/cabin
      return 'M12 3L2 13h3v5h14v-5h3L12 3z'
    case 'Ansitzleiter':
      // Ladder
      return 'M7 2h2v20H7V2zm8 0h2v20h-2V2zM7 8h10v2H7zm0 6h10v2H7z'
    case 'Drückjagdbock':
      // Platform/stand
      return 'M4 4h16v4H4zm2 4v12h4V8zm8 0v12h4V8z'
    case 'Feldansitz':
    case 'Sonstiges':
    default:
      // Circle dot
      return 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'
  }
}

function createIcon(typ: EinrichtungTyp, zustand: EinrichtungZustand): L.DivIcon {
  const color = ZUSTAND_COLOR[zustand]
  const svgPath = typSvgPath(typ)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5">
    <circle cx="12" cy="12" r="12" fill="${color}" opacity="0.2"/>
    <path d="${svgPath}" fill="${color}" stroke="white" stroke-width="0.5"/>
  </svg>`

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

interface AnsitzMarkerProps {
  einrichtung: Ansitzeinrichtung
  onEdit?: (einrichtung: Ansitzeinrichtung) => void
  onDelete?: (id: string) => void
}

export function AnsitzMarker({ einrichtung, onEdit, onDelete }: AnsitzMarkerProps) {
  const icon = createIcon(einrichtung.typ, einrichtung.zustand)

  return (
    <Marker
      position={[einrichtung.position.lat, einrichtung.position.lng]}
      icon={icon}
    >
      <Popup minWidth={240}>
        <EinrichtungPopup
          einrichtung={einrichtung}
          onEdit={onEdit ? () => onEdit(einrichtung) : undefined}
          onDelete={onDelete ? () => onDelete(einrichtung.id) : undefined}
        />
      </Popup>
    </Marker>
  )
}
