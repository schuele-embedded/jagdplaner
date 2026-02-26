import { useNavigate } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'
import type { Ansitzeinrichtung, EinrichtungZustand } from '@/types'
import { Navigation, Pencil, Trash2, Play } from 'lucide-react'

const ZUSTAND_LABEL: Record<EinrichtungZustand, string> = {
  gut: 'Gut',
  mittel: 'Mittel',
  schlecht: 'Schlecht',
  gesperrt: 'Gesperrt',
}

const ZUSTAND_CLASS: Record<EinrichtungZustand, string> = {
  gut: 'bg-green-100 text-green-800',
  mittel: 'bg-yellow-100 text-yellow-800',
  schlecht: 'bg-orange-100 text-orange-800',
  gesperrt: 'bg-red-100 text-red-800',
}

interface EinrichtungPopupProps {
  einrichtung: Ansitzeinrichtung
  onEdit?: () => void
  onDelete?: () => void
}

export function EinrichtungPopup({ einrichtung, onEdit, onDelete }: EinrichtungPopupProps) {
  const navigate = useNavigate()
  const permissions = usePermissions()

  function handleNavigation() {
    const { lat, lng } = einrichtung.position
    // Try geo URI (Android) first, fallback link for iOS/desktop
    const geoUrl = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(einrichtung.name)})`
    window.open(geoUrl, '_blank')
  }

  function handleAnsitzStarten() {
    navigate(`/ansitz?einrichtung_id=${einrichtung.id}`)
  }

  return (
    <div className="min-w-[220px] text-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 leading-tight">{einrichtung.name}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ZUSTAND_CLASS[einrichtung.zustand]}`}>
          {ZUSTAND_LABEL[einrichtung.zustand]}
        </span>
      </div>

      <p className="mb-1 text-xs text-gray-500">{einrichtung.typ}</p>

      {einrichtung.letzte_wartung && (
        <p className="mb-1 text-xs text-gray-500">
          Gewartet: {new Date(einrichtung.letzte_wartung).toLocaleDateString('de-DE')}
        </p>
      )}

      {einrichtung.notizen && (
        <p className="mb-3 text-xs text-gray-600">{einrichtung.notizen}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleAnsitzStarten}
          className="flex items-center gap-1 rounded bg-green-700 px-3 py-1.5 text-xs text-white hover:bg-green-800"
        >
          <Play size={12} />
          Ansitz starten
        </button>

        <button
          onClick={handleNavigation}
          className="flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
        >
          <Navigation size={12} />
          Navigation
        </button>

        {permissions.canManageEinrichtungen() && onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={12} />
            Bearbeiten
          </button>
        )}

        {permissions.canManageEinrichtungen() && onDelete && (
          <button
            onClick={() => {
              if (confirm(`"${einrichtung.name}" wirklich löschen?`)) {
                onDelete()
              }
            }}
            className="flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
          >
            <Trash2 size={12} />
            Löschen
          </button>
        )}
      </div>
    </div>
  )
}
