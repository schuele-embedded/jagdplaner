import { useState } from 'react'
import { useAnsitze } from '@/hooks/useAnsitze'
import { useEinrichtungen } from '@/hooks/useEinrichtungen'
import { Dashboard } from '@/components/statistiken/Dashboard'
import { WetterPlanung } from '@/components/statistiken/WetterPlanung'
import { TagesZeitChart } from '@/components/statistiken/TagesZeitChart'
import { MondphasenTabelle } from '@/components/statistiken/MondphasenTabelle'
import { StandortRangfolge } from '@/components/statistiken/StandortRangfolge'

type Tab = 'uebersicht' | 'wetter' | 'auswertung'

const TABS: { id: Tab; label: string }[] = [
  { id: 'uebersicht', label: 'Übersicht' },
  { id: 'wetter', label: '7-Tage' },
  { id: 'auswertung', label: 'Auswertung' },
]

export function StatistikenPage() {
  const { ansitze, loading } = useAnsitze()
  const { einrichtungen } = useEinrichtungen()
  const [tab, setTab] = useState<Tab>('uebersicht')

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-gray-400">Lade…</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-white border-b flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'text-green-800 border-b-2 border-green-700'
                : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-5">
        {tab === 'uebersicht' && <Dashboard ansitze={ansitze} />}

        {tab === 'wetter' && (
          <>
            <h2 className="text-base font-semibold text-gray-800">7-Tage-Wetterplanung</h2>
            <WetterPlanung />
          </>
        )}

        {tab === 'auswertung' && (
          <>
            <div>
              <h2 className="mb-3 text-base font-semibold text-gray-800">Aktivität nach Tageszeit</h2>
              <TagesZeitChart ansitze={ansitze} />
            </div>

            <div>
              <h2 className="mb-3 text-base font-semibold text-gray-800">Erfolg nach Mondphase</h2>
              <MondphasenTabelle ansitze={ansitze} />
            </div>

            <div>
              <h2 className="mb-3 text-base font-semibold text-gray-800">Standort-Rangfolge</h2>
              <StandortRangfolge ansitze={ansitze} einrichtungen={einrichtungen} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
