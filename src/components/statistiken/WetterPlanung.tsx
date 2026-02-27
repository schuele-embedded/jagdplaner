import { useEffect, useState } from 'react'
import { fetchWeeklyForecast, windSpeedToBeaufort } from '@/lib/wetter'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { TagesForecast } from '@/lib/wetter'

const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function ScoreBar({ score, best }: { score: number; best: boolean }) {
  const color =
    score >= 75
      ? 'bg-green-500'
      : score >= 50
        ? 'bg-yellow-400'
        : score >= 25
          ? 'bg-orange-400'
          : 'bg-red-400'
  return (
    <div className={`h-1.5 rounded-full ${best ? 'bg-green-100' : 'bg-gray-200'} overflow-hidden`} style={{ width: 60 }}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}

function wetterIcon(tag: TagesForecast): string {
  if (tag.niederschlag_mm > 5) return '🌧️'
  if (tag.niederschlag_mm > 0) return '🌦️'
  if (tag.bewoelkung > 80) return '☁️'
  if (tag.bewoelkung > 40) return '⛅'
  return '☀️'
}

function windLabel(kmh: number): string {
  const bft = windSpeedToBeaufort(kmh)
  return `${bft} Bft`
}

export function WetterPlanung() {
  const { position, loading: geoLoading, error: geoError } = useGeolocation()
  const [forecast, setForecast] = useState<TagesForecast[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!position) return
    setLoading(true)
    fetchWeeklyForecast(position.lat, position.lng)
      .then((data) => {
        setForecast(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.lat, position?.lng])

  if (geoLoading) {
    return (
      <div className="rounded-xl border p-4 text-center text-sm text-gray-400">
        📍 GPS wird abgerufen…
      </div>
    )
  }

  if (geoError || !position) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">
        GPS-Zugriff nicht verfügbar – Wetterplanung benötigt Standort
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl border p-4 text-center text-sm text-gray-400">
        Wetterdaten werden geladen…
      </div>
    )
  }

  if (error || !forecast) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">
        Wetterdaten nicht verfügbar: {error}
      </div>
    )
  }

  // Find top 2 days by jagdScore
  const sorted = [...forecast].sort((a, b) => b.jagdScore - a.jagdScore)
  const bestDates = new Set(sorted.slice(0, 2).map((d) => d.datum))

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">
        Die 2 besten Jagdtage der Woche sind grün hervorgehoben.
      </p>
      <div className="rounded-xl border overflow-hidden divide-y divide-gray-100">
        {forecast.map((tag) => {
          const date = new Date(tag.datum + 'T12:00:00')
          const wt = WOCHENTAGE[date.getDay()]
          const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
          const best = bestDates.has(tag.datum)
          return (
            <div
              key={tag.datum}
              className={`flex items-center gap-2 px-3 py-2.5 ${best ? 'bg-green-50' : 'bg-white'}`}
            >
              <div className="w-12 shrink-0">
                <p className={`text-xs font-semibold ${best ? 'text-green-800' : 'text-gray-700'}`}>{wt}</p>
                <p className="text-xs text-gray-400">{dateStr}</p>
              </div>
              <span className="text-lg shrink-0">{wetterIcon(tag)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">
                  {Math.round(tag.tempMin)}°–{Math.round(tag.tempMax)}°C
                  {' · '}
                  {tag.windrichtung} {windLabel(tag.wind_kmh)}
                  {tag.niederschlag_mm > 0 ? ` · ${tag.niederschlag_mm.toFixed(1)} mm` : ''}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <ScoreBar score={tag.jagdScore} best={best} />
                  <span className={`text-xs font-bold ${best ? 'text-green-700' : 'text-gray-500'}`}>
                    {tag.jagdScore}%
                  </span>
                  {best && <span className="text-xs text-green-600 font-medium">★ Gut</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
