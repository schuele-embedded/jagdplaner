import { useState } from 'react'
import { Plus, X, Layers } from 'lucide-react'
import { RevierMap } from '@/components/karte/RevierMap'
import { RevierBoundary } from '@/components/karte/RevierBoundary'
import { UserPosition } from '@/components/karte/UserPosition'
import { AnsitzMarker } from '@/components/karte/AnsitzMarker'
import { HeatmapOverlay } from '@/components/karte/HeatmapOverlay'
import { EinrichtungForm } from '@/components/einrichtungen/EinrichtungForm'
import { useRevier } from '@/hooks/useRevier'
import { useEinrichtungen } from '@/hooks/useEinrichtungen'
import { useHeatmap } from '@/hooks/useHeatmap'
import type { Ansitzeinrichtung } from '@/types'
import type { AnsitzeinrichtungFormValues } from '@/lib/validierung'

export function KartePage() {
  const { activeRevier, revierId, hasRevier } = useRevier()
  const { einrichtungen, create, update, remove } = useEinrichtungen()
  const { scores } = useHeatmap()

  const [clickMode, setClickMode] = useState(false)
  const [heatmapActive, setHeatmapActive] = useState(false)
  const [formPosition, setFormPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [editTarget, setEditTarget] = useState<Ansitzeinrichtung | null>(null)
  const [showForm, setShowForm] = useState(false)

  function handleMapClick(latlng: { lat: number; lng: number }) {
    if (!clickMode) return
    setFormPosition(latlng)
    setEditTarget(null)
    setShowForm(true)
    setClickMode(false)
  }

  function handleEdit(einrichtung: Ansitzeinrichtung) {
    setEditTarget(einrichtung)
    setFormPosition(einrichtung.position)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditTarget(null)
    setFormPosition(null)
  }

  async function handleSave(data: AnsitzeinrichtungFormValues & { revier_id: string }) {
    if (editTarget) {
      await update(editTarget.id, data)
    } else {
      await create({
        ...data,
        revier_id: revierId!,
        fotos: [],
        created_by: '',
        naechste_wartung: data.naechste_wartung ?? null,
        beschreibung: data.beschreibung ?? null,
        notizen: data.notizen ?? null,
        hoehe_meter: data.hoehe_meter ?? null,
        ausrichtung_grad: data.ausrichtung_grad ?? null,
        sichtweite_meter: data.sichtweite_meter ?? null,
        letzte_wartung: data.letzte_wartung ?? null,
      })
    }
    handleCloseForm()
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
          {einrichtungen.map((e) => (
            <AnsitzMarker
              key={e.id}
              einrichtung={e}
              onEdit={handleEdit}
              onDelete={remove}
            />
          ))}
          {heatmapActive && <HeatmapOverlay einrichtungen={einrichtungen} scores={scores} />}
        </RevierMap>

        {/* Click-mode banner */}
        {clickMode && (
          <div className="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full bg-green-700 px-4 py-2 text-sm text-white shadow-lg">
            Auf Karte tippen, um Einrichtung zu platzieren
          </div>
        )}

        {/* FAB – heatmap toggle */}
        {!showForm && (
          <div className="absolute bottom-36 right-4 z-[1000]">
            <button
              onClick={() => setHeatmapActive((v) => !v)}
              title={heatmapActive ? 'Heatmap ausblenden' : 'Erfolgs-Heatmap anzeigen'}
              className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg text-white transition-colors ${
                heatmapActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              <Layers size={20} />
            </button>
          </div>
        )}

        {/* FAB – add Einrichtung */}
        {!showForm && (
          <div className="absolute bottom-20 right-4 z-[1000]">
            <button
              onClick={() => {
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
        )}
      </div>

      {/* Bottom-sheet (mobile) / Modal (desktop) */}
      {showForm && revierId && (
        <>
          {/* Backdrop on desktop */}
          <div
            className="fixed inset-0 z-[1999] bg-black/30 hidden sm:block"
            onClick={handleCloseForm}
          />
          <div className="
            fixed z-[2000] overflow-y-auto bg-white shadow-2xl
            /* mobile: full-width bottom sheet */
            inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl px-4 pb-8 pt-4
            /* desktop: centered modal */
            sm:inset-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
            sm:w-full sm:max-w-lg sm:max-h-[90vh] sm:rounded-2xl sm:px-6 sm:pb-6 sm:pt-5
          ">
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-300 sm:hidden" />
            <EinrichtungForm
              initialPosition={formPosition ?? undefined}
              editData={editTarget ?? undefined}
              revierID={revierId}
              onSave={handleSave}
              onCancel={handleCloseForm}
            />
          </div>
        </>
      )}
    </div>
  )
}
