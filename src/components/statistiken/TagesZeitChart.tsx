import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { Ansitz } from '@/types'

interface TagesZeitChartProps {
  ansitze: Ansitz[]
}

export function TagesZeitChart({ ansitze }: TagesZeitChartProps) {
  const data = useMemo(() => {
    const counts = Array(24).fill(0)
    ansitze.forEach((a) => {
      a.beobachtungen.forEach((b) => {
        const h = new Date(b.uhrzeit).getHours()
        counts[h]++
      })
    })
    return counts.map((anzahl, h) => ({
      stunde: `${String(h).padStart(2, '0')}`,
      anzahl,
    }))
  }, [ansitze])

  const total = data.reduce((s, d) => s + d.anzahl, 0)

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
        Noch keine Beobachtungen erfasst
      </div>
    )
  }

  return (
    <div>
      <p className="mb-2 text-sm text-gray-500">{total} Beobachtungen gesamt</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 4, left: -30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="stunde"
            tick={{ fontSize: 9 }}
            interval={2}
          />
          <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
          <Tooltip
            formatter={(v: number) => [v, 'Beobachtungen']}
            labelFormatter={(l) => `${l}:00 Uhr`}
          />
          <Bar dataKey="anzahl" fill="#2d5016" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
