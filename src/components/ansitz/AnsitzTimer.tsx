import { useState, useEffect } from 'react'
import { useAnsitz } from '@/hooks/useAnsitz'
import { useEinrichtungen } from '@/hooks/useEinrichtungen'
import { BeobachtungForm } from './BeobachtungForm'
import { AbschussForm } from './AbschussForm'
import type { Wildart } from '@/types'

const WILDART_EMOJI: Partial<Record<Wildart, string>> = {
  Rehwild: '🦌', Schwarzwild: '🐗', Rotwild: '🦌', Fuchs: '🦊', Feldhase: '🐇',
  Fasan: '🐦', Damwild: '🦌', Gamswild: '🐐', Muffelwild: '🐑',
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function AnsitzTimer() {
  const { activeAnsitz, observations, finalize } = useAnsitz()
  const { einrichtungen } = useEinrichtungen()
  const [elapsed, setElapsed] = useState(0)
  const [showBeobachtung, setShowBeobachtung] = useState(false)
  const [showAbschuss, setShowAbschuss] = useState(false)
  const [showEndeDialog, setShowEndeDialog] = useState(false)
  const [erfolg, setErfolg] = useState(false)
  const [schlussNotiz, setSchlussNotiz] = useState('')

  useEffect(() => {
    if (!activeAnsitz) return
    const start = new Date(activeAnsitz.beginn).getTime()
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [activeAnsitz])

  if (!activeAnsitz) return null

  const einrichtung = einrichtungen.find((e) => e.id === activeAnsitz.ansitzeinrichtung_id)
  const b = activeAnsitz.bedingungen

  async function handleBeenden() {
    await finalize(new Date().toISOString(), erfolg, schlussNotiz || undefined)
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto pb-8">
      {/* Timer header */}
      <div className="bg-green-700 px-4 py-5 text-white">
        <p className="text-sm opacity-80">{einrichtung?.name ?? 'Unbekannte Einrichtung'}</p>
        <p className="mt-1 font-mono text-4xl font-bold tracking-widest">{formatDuration(elapsed)}</p>
        <p className="mt-1 text-xs opacity-70">
          Seit {new Date(activeAnsitz.beginn).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
        </p>
      </div>

      {/* Weather strip */}
      {b && (
        <div className="flex gap-4 overflow-x-auto bg-green-50 px-4 py-2 text-sm text-green-800">
          {b.temperatur_celsius != null && <span>🌡 {b.temperatur_celsius.toFixed(1)} °C</span>}
          {b.windstaerke_bft != null && <span>💨 {b.windstaerke_bft} Bft</span>}
          {b.mondphase && <span>🌛 {b.mondphase}</span>}
        </div>
      )}

      {/* Observations list */}
      <div className="px-4 py-3">
        <p className="mb-2 text-xs font-medium uppercase text-gray-500">Beobachtungen ({observations.length})</p>
        {observations.length === 0 ? (
          <p className="text-sm text-gray-400">Noch keine Beobachtungen</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {observations.map((obs) => (
              <span
                key={obs.id}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
              >
                {WILDART_EMOJI[obs.wildart] ?? '🐾'} {obs.anzahl}× {obs.wildart}{' '}
                {new Date(obs.uhrzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto px-4 space-y-3 pt-4">
        <button
          onClick={() => setShowBeobachtung(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
        >
          🐾 Beobachtung erfassen
        </button>
        <button
          onClick={() => setShowAbschuss(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white border border-red-200 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
        >
          🎯 Abschuss erfassen
        </button>
        <button
          onClick={() => setShowEndeDialog(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-800 text-sm font-medium text-white hover:bg-gray-900"
        >
          Ansitz beenden
        </button>
      </div>

      {/* Beobachtung bottom-sheet */}
      {showBeobachtung && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40" onClick={() => setShowBeobachtung(false)}>
          <div
            className="w-full rounded-t-2xl bg-white px-4 pb-24 pt-4 max-h-[90vh] overflow-y-auto sm:rounded-2xl sm:max-w-lg sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-300 sm:hidden" />
            <BeobachtungForm
              onSave={() => { setShowBeobachtung(false) }}
              onCancel={() => setShowBeobachtung(false)}
            />
          </div>
        </div>
      )}

      {/* Abschuss bottom-sheet */}
      {showAbschuss && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40" onClick={() => setShowAbschuss(false)}>
          <div
            className="w-full rounded-t-2xl bg-white px-4 pb-24 pt-4 max-h-[90vh] overflow-y-auto sm:rounded-2xl sm:max-w-lg sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-300 sm:hidden" />
            <AbschussForm
              onSave={() => setShowAbschuss(false)}
              onCancel={() => setShowAbschuss(false)}
            />
          </div>
        </div>
      )}

      {/* Ende dialog */}
      {showEndeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold">Ansitz beenden</h2>
            <p className="text-sm text-gray-600">
              Dauer: {formatDuration(elapsed)} · {observations.length} Beobachtung(en)
              {activeAnsitz.abschuss && ' · 1 Abschuss'}
            </p>
            <div className="space-y-1">
              <p className="text-sm font-medium">War der Ansitz erfolgreich?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setErfolg(true)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                    erfolg ? 'border-green-600 bg-green-600 text-white' : 'border-gray-200 text-gray-700'
                  }`}
                >
                  Ja
                </button>
                <button
                  onClick={() => setErfolg(false)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                    !erfolg ? 'border-gray-400 bg-gray-100 text-gray-800' : 'border-gray-200 text-gray-700'
                  }`}
                >
                  Nein
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="schluss-notiz">Schluss-Notiz (optional)</label>
              <textarea
                id="schluss-notiz"
                rows={2}
                value={schlussNotiz}
                onChange={(e) => setSchlussNotiz(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                placeholder="Bemerkungen zum Ansitz…"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndeDialog(false)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700"
              >
                Abbrechen
              </button>
              <button
                onClick={handleBeenden}
                className="flex-1 rounded-xl bg-gray-800 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
