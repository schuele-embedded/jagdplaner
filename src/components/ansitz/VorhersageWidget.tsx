import { useHeatmap } from '@/hooks/useHeatmap'
import { useEinrichtungen } from '@/hooks/useEinrichtungen'
import { useAnsitze } from '@/hooks/useAnsitze'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatZeit(von: number, bis: number) {
  return `${pad(von)}:00–${pad(bis + 1)}:00 Uhr`
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : score >= 25 ? 'bg-orange-400' : 'bg-red-400'
  return (
    <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}

export function VorhersageWidget() {
  const { scores, bestTimes, loading } = useHeatmap()
  const { einrichtungen } = useEinrichtungen()
  const { ansitze } = useAnsitze()

  const totalAnsitze = ansitze.length

  if (loading) return null

  // Not enough data at all
  if (totalAnsitze < 3) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">
        🎯 Vorhersage verfügbar ab 5 erfassten Ansitzen
        <br />
        <span className="text-xs">({totalAnsitze} bisher erfasst)</span>
      </div>
    )
  }

  // Sort einrichtungen by score descending, take top 3
  const topEinrichtungen = einrichtungen
    .map((e) => {
      const sc = scores.find((s) => s.einrichtungId === e.id)
      const bt = bestTimes.find((b) => b.einrichtungId === e.id)
      return { e, score: sc?.score ?? 50, datenpunkte: sc?.datenpunkte ?? 0, bt }
    })
    .filter(({ datenpunkte }) => datenpunkte >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  if (topEinrichtungen.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">
        🎯 Noch zu wenig Ansitze pro Einrichtung für eine Vorhersage
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-green-900">🎯 Empfehlung für heute</p>
      <div className="space-y-3">
        {topEinrichtungen.map(({ e, score, bt }, i) => (
          <div key={e.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs w-4 text-gray-400 shrink-0">{i + 1}.</span>
              <span className="text-sm font-medium text-gray-800 truncate flex-1">{e.name}</span>
              <ScoreBar score={score} />
              <span className="text-sm font-bold text-gray-700 shrink-0 w-10 text-right">{score}%</span>
            </div>
            {bt && (
              <p className="text-xs text-gray-500 pl-6">
                Beste Zeit: {formatZeit(bt.stundeVon, bt.stundeBis)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
