import { useAnsitze } from '@/hooks/useAnsitze'
import { AnsitzListe } from '@/components/statistiken/AnsitzListe'

export function ListePage() {
  const { ansitze, loading } = useAnsitze()

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-4">
      <h1 className="mb-4 text-lg font-semibold">Ansitz-Liste</h1>
      <AnsitzListe ansitze={ansitze} loading={loading} />
    </div>
  )
}
