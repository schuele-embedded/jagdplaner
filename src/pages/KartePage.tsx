import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { RevierMap } from '@/components/karte/RevierMap'
import { RevierBoundary } from '@/components/karte/RevierBoundary'
import { UserPosition } from '@/components/karte/UserPosition'
import { useRevier } from '@/hooks/useRevier'

export function KartePage() {
  const { activeRevier, hasRevier } = useRevier()
  const [clickMode, setClickMode] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<{ lat: number; lng: number } | null>(null)

  function handleMapClick(latlng: { lat: number; lng: number }) {
    if (!clickMode) return
    setPendingPosition(latlng)
    setClickMode(false)
    // TASK-013 will open the EinrichtungForm here
    console.log('Neue Einrichtung an:', latlng)
  }

  if (!hasRevier) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800">Kein Revier ausgewählt</h2>
        <p className="text-sm text-gray-500">
          Erstelle oder wähle ein Revier, um die Karte zu nutzen.
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Revier name bar */}
      <div className="z-10 bg-white px-4 py-2 shadow-sm">
        <p className="text-sm font-medium text-gray-700">{activeRevier?.name}</p>
      </div>

      {/* Map fills remaining space */}
      <div className="relative flex-1">
        <RevierMap onMapClick={handleMapClick} clickMode={clickMode}>
          <RevierBoundary />
          <UserPosition />
          {/* TASK-013: <AnsitzMarker> components go here */}
        </RevierMap>

        {/* Click-mode banner */}
        {clickMode && (
          <div className="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full bg-green-700 px-4 py-2 text-sm text-white shadow-lg">
            Auf Karte tippen, um Einrichtung zu platzieren
          </div>
        )}

        {/* FAB – add Einrichtung */}
        <div className="absolute bottom-20 right-4 z-[1000]">
          <button
            onClick={() => {
              setPendingPosition(null)
              setClickMode((prev) => !prev)
            }}
            title={clickMode ? 'Abbrechen' : 'Einrichtung hinzufügen'}
            className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg text-white transition-colors ${
              clickMode ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'
            }`}
          >
            {clickMode ? <X size={24} /> : <Plus size={24} />}
          </button>
        </div>

        {/* Pending position debug (removed in TASK-013 when form exists) */}
        {pendingPosition && (
          <div className="absolute bottom-40 left-4 z-[1000] rounded bg-white px-3 py-2 text-xs shadow">
            Ausgewählt: {pendingPosition.lat.toFixed(5)}, {pendingPosition.lng.toFixed(5)}
          </div>
        )}
      </div>
    </div>
  )
}
