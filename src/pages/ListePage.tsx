import { useState } from 'react'
import { useAnsitze } from '@/hooks/useAnsitze'
import { AnsitzListe } from '@/components/statistiken/AnsitzListe'
import { EinrichtungenListe } from '@/components/statistiken/EinrichtungenListe'

type Tab = 'ansitze' | 'einrichtungen'

export function ListePage() {
  const { ansitze, loading } = useAnsitze()
  const [tab, setTab] = useState<Tab>('ansitze')

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-4">
      {/* Tab bar */}
      <div className="mb-4 flex rounded-xl border border-gray-200 bg-gray-100 p-1">
        <button
          onClick={() => setTab('ansitze')}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
            tab === 'ansitze' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Ansitze
        </button>
        <button
          onClick={() => setTab('einrichtungen')}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
            tab === 'einrichtungen' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Einrichtungen
        </button>
      </div>

      {tab === 'ansitze' ? (
        <AnsitzListe ansitze={ansitze} loading={loading} />
      ) : (
        <EinrichtungenListe />
      )}
    </div>
  )
}

