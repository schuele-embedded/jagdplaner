import { useAnsitze } from '@/hooks/useAnsitze'
import { Dashboard } from '@/components/statistiken/Dashboard'

export function StatistikenPage() {
  const { ansitze, loading } = useAnsitze()

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-gray-400">Lade…</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-4">
      <h1 className="mb-4 text-lg font-semibold">Statistiken</h1>
      <Dashboard ansitze={ansitze} />
    </div>
  )
}
