import type { Ansitz } from '@/types'
import { useEinrichtungen } from '@/hooks/useEinrichtungen'

interface AnsitzListeProps {
  ansitze: Ansitz[]
  loading: boolean
}

function formatDuration(beginn: string, ende: string | null): string {
  if (!ende) return '–'
  const ms = new Date(ende).getTime() - new Date(beginn).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

export function AnsitzListe({ ansitze, loading }: AnsitzListeProps) {
  const { einrichtungen } = useEinrichtungen()
  const [filterEinrichtung, setFilterEinrichtung] = useState<string>('alle')
  const [nurErfolge, setNurErfolge] = useState(false)
  const [selectedAnsitz, setSelectedAnsitz] = useState<Ansitz | null>(null)

  const filtered = ansitze.filter((a) => {
    if (filterEinrichtung !== 'alle' && a.ansitzeinrichtung_id !== filterEinrichtung) return false
    if (nurErfolge && !a.erfolg) return false
    return true
  })

  if (loading) {
    return <div className="flex flex-1 items-center justify-center"><span className="text-gray-400">Lade…</span></div>
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filterEinrichtung}
          onChange={(e) => setFilterEinrichtung(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="alle">Alle Einrichtungen</option>
          {einrichtungen.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <button
          onClick={() => setNurErfolge((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            nurErfolge ? 'border-green-700 bg-green-700 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Nur Erfolge
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
          Keine Ansitze gefunden
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const einr = einrichtungen.find((e) => e.id === a.ansitzeinrichtung_id)
            const wildarten = [...new Set(a.beobachtungen.map((b) => b.wildart))]
            return (
              <button
                key={a.id}
                onClick={() => setSelectedAnsitz(a)}
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(a.beginn).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                      {' · '}
                      {new Date(a.beginn).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-500">{einr?.name ?? 'Unbekannte Einrichtung'} · {formatDuration(a.beginn, a.ende)}</p>
                    {wildarten.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {wildarten.map((w) => (
                          <span key={w} className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-800">{w}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    a.erfolg ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {a.erfolg ? 'Erfolg' : 'Kein Erfolg'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail sheet */}
      {selectedAnsitz && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => setSelectedAnsitz(null)}
        >
          <div
            className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-8 pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-300" />
            <AnsitzDetail ansitz={selectedAnsitz} einrichtungen={einrichtungen} />
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import type { Ansitzeinrichtung } from '@/types'

function AnsitzDetail({ ansitz, einrichtungen }: { ansitz: Ansitz; einrichtungen: Ansitzeinrichtung[] }) {
  const einr = einrichtungen.find((e) => e.id === ansitz.ansitzeinrichtung_id)
  const b = ansitz.bedingungen
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          {new Date(ansitz.beginn).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </h2>
        <p className="text-sm text-gray-500">{einr?.name ?? '–'}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-gray-50 p-2">
          <p className="text-xs text-gray-400">Beginn</p>
          <p>{new Date(ansitz.beginn).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <p className="text-xs text-gray-400">Ende</p>
          <p>{ansitz.ende ? new Date(ansitz.ende).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '–'}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <p className="text-xs text-gray-400">Ergebnis</p>
          <p>{ansitz.erfolg ? '✅ Erfolgreich' : '❌ Kein Erfolg'}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <p className="text-xs text-gray-400">Beobachtungen</p>
          <p>{ansitz.beobachtungen.length}</p>
        </div>
      </div>

      {b && (
        <div className="rounded-xl border border-gray-200 p-3 space-y-1 text-sm">
          <p className="text-xs font-medium text-gray-400 uppercase">Bedingungen</p>
          {b.temperatur_celsius != null && <p>🌡 {b.temperatur_celsius} °C</p>}
          {b.windstaerke_bft != null && <p>💨 {b.windstaerke_bft} Bft {b.windrichtung ?? ''}</p>}
          {b.mondphase && <p>🌛 {b.mondphase}</p>}
          {b.niederschlag && <p>🌧 {b.niederschlag}</p>}
        </div>
      )}

      {ansitz.beobachtungen.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Beobachtungen</p>
          <div className="space-y-1">
            {ansitz.beobachtungen.map((obs) => (
              <div key={obs.id} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="shrink-0 text-xs text-gray-400">
                  {new Date(obs.uhrzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>{obs.anzahl}× {obs.wildart} ({obs.verhalten})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ansitz.abschuss && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm">
          <p className="mb-1 font-medium text-red-800">Abschuss</p>
          <p>{ansitz.abschuss.wildart} · {ansitz.abschuss.geschlecht} · {ansitz.abschuss.alter_jahre ?? '?'} Jahre</p>
          {ansitz.abschuss.gewicht_kg && <p>{ansitz.abschuss.gewicht_kg} kg</p>}
          {ansitz.abschuss.notizen && <p className="mt-1 text-gray-600">{ansitz.abschuss.notizen}</p>}
        </div>
      )}

      {ansitz.notizen && (
        <div>
          <p className="mb-1 text-sm font-medium">Notizen</p>
          <p className="text-sm text-gray-600">{ansitz.notizen}</p>
        </div>
      )}
    </div>
  )
}
