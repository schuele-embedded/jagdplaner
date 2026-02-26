import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { saveAnsitz, addToSyncQueue } from '@/lib/indexeddb'
import { useAnsitzStore } from '@/store/useAnsitzStore'
import { useUserStore } from '@/store/useUserStore'
import { useRevier } from '@/hooks/useRevier'
import type { Ansitz, Beobachtung } from '@/types'

export function useAnsitz() {
  const store = useAnsitzStore()
  const { user } = useUserStore()
  const { revierId } = useRevier()
  const navigate = useNavigate()

  const start = useCallback(
    (ansitz: Omit<Ansitz, 'id' | 'jaeger_id' | 'revier_id' | 'created_at' | 'beobachtungen' | 'abschuss' | 'ende' | 'erfolg'>) => {
      if (!user || !revierId) return
      const newAnsitz: Ansitz = {
        ...ansitz,
        id: crypto.randomUUID(),
        jaeger_id: user.id,
        revier_id: revierId,
        beobachtungen: [],
        abschuss: null,
        ende: null,
        erfolg: false,
        created_at: new Date().toISOString(),
      }
      store.startAnsitz(newAnsitz)
    },
    [store, user, revierId]
  )

  const addObservation = useCallback(
    (b: Omit<Beobachtung, 'id' | 'created_at' | 'ansitz_id' | 'revier_id'>) => {
      if (!store.activeAnsitz || !revierId) return
      const obs: Beobachtung = {
        ...b,
        id: crypto.randomUUID(),
        ansitz_id: store.activeAnsitz.id,
        revier_id: revierId,
        created_at: new Date().toISOString(),
      }
      store.addObservation(obs)
    },
    [store, revierId]
  )

  const finalize = useCallback(
    async (ende: string, erfolg: boolean, notizen?: string) => {
      if (!store.activeAnsitz) return
      store.endAnsitz({ ende, erfolg, notizen })

      const finished: Ansitz = {
        ...store.activeAnsitz,
        ende,
        erfolg,
        notizen: notizen ?? null,
        beobachtungen: store.observations,
      }

      try {
        const { error } = await supabase.from('ansitze').insert(finished)
        if (error) throw error
        // Also upsert observations
        if (finished.beobachtungen.length > 0) {
          await supabase.from('beobachtungen').insert(finished.beobachtungen)
        }
      } catch {
        await saveAnsitz(finished)
        await addToSyncQueue({
          table: 'ansitze',
          operation: 'INSERT',
          payload: finished as unknown as Record<string, unknown>,
        })
        for (const obs of finished.beobachtungen) {
          await addToSyncQueue({
            table: 'beobachtungen',
            operation: 'INSERT',
            payload: obs as unknown as Record<string, unknown>,
          })
        }
      }

      store.reset()
      navigate('/liste')
    },
    [store, navigate]
  )

  return {
    activeAnsitz: store.activeAnsitz,
    observations: store.observations,
    isActive: store.activeAnsitz !== null && store.activeAnsitz.ende === null,
    start,
    addObservation,
    setAbschuss: store.setAbschuss,
    finalize,
  }
}
