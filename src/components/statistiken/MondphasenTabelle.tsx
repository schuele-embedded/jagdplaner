import { useMemo } from 'react'
import type { Ansitz, Mondphase } from '@/types'

const MONDPHASEN_LABEL: Record<Mondphase, string> = {
  Neumond: '🌑 Neumond',
  zunehmend: '🌒 Zunehmend',
  Halbmond_zunehmend: '🌓 Halbmond ↑',
  Vollmond: '🌕 Vollmond',
  abnehmend: '🌖 Abnehmend',
  Halbmond_abnehmend: '🌗 Halbmond ↓',
}

interface MondphasenTabelleProps {
  ansitze: Ansitz[]
}

export function MondphasenTabelle({ ansitze }: MondphasenTabelleProps) {
  const rows = useMemo(() => {
    const map = new Map<Mondphase, { gesamt: number; erfolge: number }>()
    ansitze.forEach((a) => {
      const mp = a.bedingungen.mondphase
      if (!mp) return
      const entry = map.get(mp) ?? { gesamt: 0, erfolge: 0 }
      entry.gesamt++
      if (a.erfolg) entry.erfolge++
      map.set(mp, entry)
    })
    return (Object.keys(MONDPHASEN_LABEL) as Mondphase[])
      .map((phase) => {
        const entry = map.get(phase) ?? { gesamt: 0, erfolge: 0 }
        const quote = entry.gesamt > 0 ? Math.round((entry.erfolge / entry.gesamt) * 100) : null
        return { phase, ...entry, quote }
      })
      .filter((r) => r.gesamt > 0)
  }, [ansitze])

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
        Noch keine Ansitze mit Mondphasen-Daten
      </div>
    )
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Mondphase</th>
            <th className="px-3 py-2 text-right font-medium">Ansitze</th>
            <th className="px-3 py-2 text-right font-medium">Erfolge</th>
            <th className="px-3 py-2 text-right font-medium">Quote</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.phase} className="bg-white">
              <td className="px-3 py-2 text-gray-700">{MONDPHASEN_LABEL[r.phase]}</td>
              <td className="px-3 py-2 text-right text-gray-500">{r.gesamt}</td>
              <td className="px-3 py-2 text-right text-gray-500">{r.erfolge}</td>
              <td className="px-3 py-2 text-right font-semibold">
                {r.quote !== null ? (
                  <span className={r.quote >= 50 ? 'text-green-700' : 'text-gray-500'}>
                    {r.quote} %
                  </span>
                ) : (
                  <span className="text-gray-300">–</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
