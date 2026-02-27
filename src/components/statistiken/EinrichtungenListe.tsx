import { useState } from 'react'
import { useEinrichtungen } from '@/hooks/useEinrichtungen'
import type { Ansitzeinrichtung, EinrichtungZustand } from '@/types'

const TYP_EMOJI: Record<string, string> = {
  Hochsitz: '🏕',
  Kanzel: '🎯',
  Drückjagdbock: '🌲',
  Ansitzleiter: '🪜',
  Feldansitz: '🌾',
  Sonstiges: '📍',
}

const ZUSTAND_STYLE: Record<EinrichtungZustand, string> = {
  gut: 'bg-green-100 text-green-800',
  mittel: 'bg-yellow-100 text-yellow-800',
  schlecht: 'bg-red-100 text-red-800',
  gesperrt: 'bg-gray-200 text-gray-600',
}

const ZUSTAND_LABEL: Record<EinrichtungZustand, string> = {
  gut: 'Gut',
  mittel: 'Mittel',
  schlecht: 'Schlecht',
  gesperrt: 'Gesperrt',
}

function formatWartung(date: string | null): string {
  if (!date) return '–'
  return new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function EinrichtungenListe() {
  const { einrichtungen, loading } = useEinrichtungen()
  const [selectedTyp, setSelectedTyp] = useState<string>('alle')
  const [detail, setDetail] = useState<Ansitzeinrichtung | null>(null)

  const typen = [...new Set(einrichtungen.map((e) => e.typ))]

  const filtered = einrichtungen.filter(
    (e) => selectedTyp === 'alle' || e.typ === selectedTyp
  )

  if (loading) {
    return <div className="flex flex-1 items-center justify-center"><span className="text-gray-400">Lade…</span></div>
  }

  return (
    <div className="space-y-3">
      {/* Filter */}
      {typen.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTyp('alle')}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedTyp === 'alle'
                ? 'border-green-700 bg-green-700 text-white'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Alle
          </button>
          {typen.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTyp(t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedTyp === t
                  ? 'border-green-700 bg-green-700 text-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {TYP_EMOJI[t] ?? '📍'} {t}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
          Keine Einrichtungen vorhanden
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => setDetail(e)}
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{TYP_EMOJI[e.typ] ?? '📍'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{e.name}</p>
                    <p className="text-xs text-gray-500">{e.typ}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ZUSTAND_STYLE[e.zustand]}`}>
                  {ZUSTAND_LABEL[e.zustand]}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail bottom-sheet */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-10 pt-4 sm:rounded-2xl sm:max-w-lg sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-300 sm:hidden" />

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{TYP_EMOJI[detail.typ] ?? '📍'}</span>
              <div>
                <h2 className="text-lg font-semibold">{detail.name}</h2>
                <p className="text-sm text-gray-500">{detail.typ}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="rounded-lg bg-gray-50 p-2">
                <p className="text-xs text-gray-400">Zustand</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ZUSTAND_STYLE[detail.zustand]}`}>
                  {ZUSTAND_LABEL[detail.zustand]}
                </span>
              </div>
              {detail.hoehe_meter != null && (
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-xs text-gray-400">Höhe</p>
                  <p>{detail.hoehe_meter} m</p>
                </div>
              )}
              {detail.ausrichtung_grad != null && (
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-xs text-gray-400">Ausrichtung</p>
                  <p>{detail.ausrichtung_grad}°</p>
                </div>
              )}
              {detail.sichtweite_meter != null && (
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-xs text-gray-400">Sichtweite</p>
                  <p>{detail.sichtweite_meter} m</p>
                </div>
              )}
              <div className="rounded-lg bg-gray-50 p-2">
                <p className="text-xs text-gray-400">Letzte Wartung</p>
                <p>{formatWartung(detail.letzte_wartung)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2">
                <p className="text-xs text-gray-400">Nächste Wartung</p>
                <p>{formatWartung(detail.naechste_wartung)}</p>
              </div>
            </div>

            {detail.guenstige_windrichtungen.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-medium text-gray-400 uppercase">Günstige Windrichtungen</p>
                <div className="flex flex-wrap gap-1">
                  {detail.guenstige_windrichtungen.map((w) => (
                    <span key={w} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-800">💨 {w}</span>
                  ))}
                </div>
              </div>
            )}

            {detail.beschreibung && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-medium text-gray-400 uppercase">Beschreibung</p>
                <p className="text-sm text-gray-700">{detail.beschreibung}</p>
              </div>
            )}

            {detail.notizen && (
              <div>
                <p className="mb-1 text-xs font-medium text-gray-400 uppercase">Notizen</p>
                <p className="text-sm text-gray-700">{detail.notizen}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
