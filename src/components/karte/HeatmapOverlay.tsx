import { CircleMarker, Popup } from 'react-leaflet'
import { scoreToColor } from '@/lib/heatmap'
import type { HeatmapScore } from '@/lib/heatmap'
import type { Ansitzeinrichtung } from '@/types'

interface HeatmapOverlayProps {
  einrichtungen: Ansitzeinrichtung[]
  scores: HeatmapScore[]
}

function formatFaktor(value: number): string {
  const pct = Math.round((value - 1) * 100)
  if (pct > 0) return `+${pct}%`
  if (pct < 0) return `${pct}%`
  return '±0%'
}

function formatScore(score: HeatmapScore) {
  const { basis, wetter, mond, jagddruck } = score.faktoren
  const lines: { icon: string; label: string; wert: string; ok: boolean }[] = [
    { icon: '📊', label: 'Historische Basis', wert: `${basis}%`, ok: basis >= 50 },
    { icon: '💨', label: 'Wetter', wert: formatFaktor(wetter), ok: wetter >= 1 },
    { icon: '🌛', label: 'Mondphase', wert: formatFaktor(mond), ok: mond >= 1 },
    { icon: '🦶', label: 'Jagddruck', wert: formatFaktor(jagddruck), ok: jagddruck >= 1 },
  ]
  return lines
}

export function HeatmapOverlay({ einrichtungen, scores }: HeatmapOverlayProps) {
  return (
    <>
      {einrichtungen.map((e) => {
        const score = scores.find((s) => s.einrichtungId === e.id)
        if (!score) return null

        const color = scoreToColor(score.score, score.datenpunkte)
        const tooFewData = score.datenpunkte < 5

        return (
          <CircleMarker
            key={e.id}
            center={[e.position.lat, e.position.lng]}
            radius={36}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.35,
              weight: 2,
              opacity: 0.7,
            }}
          >
            <Popup>
              <div className="min-w-[200px] space-y-2 text-sm">
                <p className="font-semibold text-gray-800">📍 {e.name}</p>

                {tooFewData ? (
                  <p className="text-gray-500">
                    Zu wenig Daten ({score.datenpunkte} Ansitze).<br />
                    Ab 5 Ansitzen wird eine Vorhersage berechnet.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-bold text-base">{score.score}% Erfolgsaussicht</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Basierend auf {score.datenpunkte} Ansitzen
                    </p>
                    <div className="border-t pt-2 space-y-1">
                      {formatScore(score).map(({ icon, label, wert, ok }) => (
                        <div key={label} className="flex justify-between text-xs">
                          <span className="text-gray-600">{icon} {label}</span>
                          <span className={ok ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                            {wert}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </>
  )
}
