import { useMemo } from 'react'
import type { Ansitz, Ansitzeinrichtung } from '@/types'

interface StandortRangfolgeProps {
  ansitze: Ansitz[]
  einrichtungen: Ansitzeinrichtung[]
}

export function StandortRangfolge({ ansitze, einrichtungen }: StandortRangfolgeProps) {
  const rows = useMemo(() => {
    return einrichtungen
      .map((e) => {
        const relevant = ansitze.filter((a) => a.ansitzeinrichtung_id === e.id)
        const erfolge = relevant.filter((a) => a.erfolg).length
        const quote = relevant.length > 0 ? Math.round((erfolge / relevant.length) * 100) : null
        return { e, gesamt: relevant.length, erfolge, quote }
      })
      .filter((r) => r.gesamt > 0)
      .sort((a, b) => {
        if (a.quote === null) return 1
        if (b.quote === null) return -1
        return b.quote - a.quote
      })
  }, [ansitze, einrichtungen])

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
        Noch keine Ansitze erfasst
      </div>
    )
  }

  return (
    <div className="rounded-xl border overflow-hidden divide-y divide-gray-100">
      {rows.map((r, idx) => (
        <div key={r.e.id} className="flex items-center gap-3 px-3 py-2.5 bg-white">
          <span className="shrink-0 text-xs font-bold text-gray-300 w-5 text-center">{idx + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{r.e.name}</p>
            <p className="text-xs text-gray-400">
              {r.e.typ} · {r.gesamt} Ansitz{r.gesamt !== 1 ? 'e' : ''}
            </p>
          </div>
          <div className="text-right shrink-0">
            {r.quote !== null ? (
              <span
                className={`text-sm font-bold ${
                  r.quote >= 60 ? 'text-green-700' : r.quote >= 30 ? 'text-yellow-600' : 'text-gray-400'
                }`}
              >
                {r.quote} %
              </span>
            ) : (
              <span className="text-sm text-gray-300">–</span>
            )}
            <p className="text-xs text-gray-400">{r.erfolge} Erfolg{r.erfolge !== 1 ? 'e' : ''}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
