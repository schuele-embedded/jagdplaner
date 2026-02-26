import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { Ansitz, Wildart } from '@/types'
import { ErfolgChart } from './ErfolgChart'

interface DashboardProps {
  ansitze: Ansitz[]
}

export function Dashboard({ ansitze }: DashboardProps) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const thisMonth = ansitze.filter((a) => new Date(a.beginn) >= monthStart)
  const total = thisMonth.length
  const erfolge = thisMonth.filter((a) => a.erfolg).length
  const erfolgsquote = total > 0 ? Math.round((erfolge / total) * 100) : 0
  const abschuesse = thisMonth.filter((a) => a.abschuss).length
  const beobachtungen = thisMonth.reduce((n, a) => n + a.beobachtungen.length, 0)

  // Best time analysis
  const bestTime = useMemo(() => {
    const stundenzähler: number[] = Array(24).fill(0)
    ansitze.forEach((a) => {
      a.beobachtungen.forEach((b) => {
        const h = new Date(b.uhrzeit).getHours()
        stundenzähler[h]++
      })
    })
    const max = Math.max(...stundenzähler)
    if (max === 0) return null
    const h = stundenzähler.indexOf(max)
    return `${String(h).padStart(2, '0')}:00–${String(h + 1).padStart(2, '0')}:00 Uhr`
  }, [ansitze])

  // Wildart distribution current month
  const wildartData = useMemo(() => {
    const counts: Partial<Record<Wildart, number>> = {}
    thisMonth.forEach((a) => {
      a.beobachtungen.forEach((b) => {
        counts[b.wildart] = (counts[b.wildart] ?? 0) + b.anzahl
      })
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([wildart, anzahl]) => ({ wildart, anzahl }))
  }, [thisMonth])

  // Last 5 ansitze
  const letzte5 = ansitze.slice(0, 5)

  if (ansitze.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400">
        Noch keine Ansitze vorhanden. Starte deinen ersten Ansitz!
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Ansitze (Monat)" value={String(total)} />
        <KpiCard label="Erfolgsquote" value={`${erfolgsquote} %`} />
        <KpiCard label="Beobachtungen" value={String(beobachtungen)} />
        <KpiCard label="Abschüsse" value={String(abschuesse)} />
      </div>

      {/* Best time */}
      {bestTime && (
        <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
          🕐 Die meisten Beobachtungen waren um <strong>{bestTime}</strong>
        </div>
      )}

      {/* Wildart chart */}
      {wildartData.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Beobachtungen nach Wildart (Monat)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={wildartData} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="wildart" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="anzahl" fill="#2d5016" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Erfolg chart */}
      <ErfolgChart ansitze={ansitze} />

      {/* Last 5 */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Letzte Ansitze</p>
        <div className="space-y-1">
          {letzte5.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50 text-sm">
              <span className="text-gray-700">
                {new Date(a.beginn).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                {' · '}
                {new Date(a.beginn).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                a.erfolg ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
              }`}>
                {a.erfolg ? '✓' : '–'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
    </div>
  )
}
