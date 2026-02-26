import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Ansitz, Beobachtung, Abschuss } from '@/types'

interface AnsitzState {
  activeAnsitz: Ansitz | null
  observations: Beobachtung[]
}

interface AnsitzActions {
  startAnsitz: (ansitz: Ansitz) => void
  endAnsitz: (payload: { ende: string; erfolg: boolean; notizen?: string }) => void
  addObservation: (b: Beobachtung) => void
  setAbschuss: (abschuss: Abschuss) => void
  reset: () => void
}

const initialState: AnsitzState = {
  activeAnsitz: null,
  observations: [],
}

export const useAnsitzStore = create<AnsitzState & AnsitzActions>()(
  persist(
    (set) => ({
      ...initialState,

      startAnsitz(ansitz) {
        set({ activeAnsitz: ansitz, observations: [] })
      },

      endAnsitz({ ende, erfolg, notizen }) {
        set((s) => ({
          activeAnsitz: s.activeAnsitz
            ? { ...s.activeAnsitz, ende, erfolg, notizen: notizen ?? null, beobachtungen: s.observations }
            : null,
        }))
      },

      addObservation(b) {
        set((s) => ({ observations: [...s.observations, b] }))
      },

      setAbschuss(abschuss) {
        set((s) => ({
          activeAnsitz: s.activeAnsitz ? { ...s.activeAnsitz, abschuss } : null,
        }))
      },

      reset() {
        set(initialState)
      },
    }),
    { name: 'jagdplaner-active-ansitz' }
  )
)
