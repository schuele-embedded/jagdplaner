import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import type { Ansitz } from '@/types'

interface ErfolgChartProps {
  ansitze: Ansitz[]
}

const MONATE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

export function ErfolgChart({ ansitze }: ErfolgChartProps) {
  const now = new Date()
  const currentYear = now.getFullYear()

  // Build monthly success rates for the current year
  const data = MONATE.map((label, monthIndex) => {
    const monthAnsitze = ansitze.filter((a) => {
      const d = new Date(a.beginn)
      return d.getFullYear() === currentYear && d.getMonth() === monthIndex
    })
    const total = monthAnsitze.length
    const successful = monthAnsitze.filter((a) => a.erfolg).length
    return {
      monat: label,
      quote: total > 0 ? Math.round((successful / total) * 100) : null,
      total,
      successful,
    }
  })

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-700">Erfolgsquote {currentYear}</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="monat" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            formatter={(value, _name, props) => {
              const total = (props.payload as { total?: number })?.total ?? 0
              const successful = (props.payload as { successful?: number })?.successful ?? 0
              if (value == null) return ['–', 'Erfolgsquote']
              return [`${successful} von ${total} (${value}%)`, 'Erfolgsquote']
            }}
          />
          <Line
            type="monotone"
            dataKey="quote"
            stroke="#2d5016"
            strokeWidth={2}
            dot={{ r: 3, fill: '#2d5016' }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
