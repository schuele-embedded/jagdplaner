import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { RevierMap } from '@/components/karte/RevierMap'
import { RevierBoundary } from '@/components/karte/RevierBoundary'
import { UserPosition } from '@/components/karte/UserPosition'
import { AnsitzMarker } from '@/components/karte/AnsitzMarker'
import { EinrichtungForm } from '@/components/einrichtungen/EinrichtungForm'
import { useRevier } from '@/hooks/useRevier'
import { useEinrichtungen } from '@/hooks/useEinrichtungen'
import type { Ansitzeinrichtung } from '@/types'
import type { AnsitzeinrichtungFormValues } from '@/lib/validierung'

export function KartePage() {
  const { activeRevier, revierId, hasRevier } = useRevier()
  const { einrichtungen, create, update, remove } = useEinrichtungen()

  const [clickMode, setClickMode] = useState(false)
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
        </RevierMap>

        {/* Click-mode banner */}
        {clickMode && (
          <div className="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full bg-green-700 px-4 py-2 text-sm text-white shadow-lg">
            Auf Karte tippen, um Einrichtung zu platzieren
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

      {/* Bottom-sheet form */}
      {showForm && revierId && (
        <div className="absolute inset-x-0 bottom-0 z-[2000] max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-8 pt-4 shadow-2xl">
          <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-300" />
          <EinrichtungForm
            initialPosition={formPosition ?? undefined}
            editData={editTarget ?? undefined}
            revierID={revierId}
            onSave={handleSave}
            onCancel={handleCloseForm}
          />
        </div>
      )}
    </div>
  )
}
