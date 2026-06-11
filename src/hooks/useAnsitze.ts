import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getAllAnsitze } from '@/lib/indexeddb'
import { parsePosition } from '@/lib/geo'
import { useRevier } from '@/hooks/useRevier'
import type { Ansitz, Beobachtung } from '@/types'

interface UseAnsitzeState {
  ansitze: Ansitz[]
  loading: boolean
  error: string | null
}

export function useAnsitze(): UseAnsitzeState {
  const { revierId } = useRevier()
  const [state, setState] = useState<UseAnsitzeState>({ ansitze: [], loading: false, error: null })

  const load = useCallback(async () => {
    if (!revierId) { setState({ ansitze: [], loading: false, error: null }); return }
    setState((s) => ({ ...s, loading: true }))
    try {
      const { data, error } = await supabase
        .from('ansitze')
        .select('*')
        .eq('revier_id', revierId)
        .order('beginn', { ascending: false })
      if (error) throw error
      // ansitze table has no beobachtungen column – attach them from their own table
      const { data: obsData } = await supabase
        .from('beobachtungen')
        .select('*')
        .eq('revier_id', revierId)
      const obsByAnsitz = new Map<string, Beobachtung[]>()
      for (const raw of (obsData ?? []) as Beobachtung[]) {
        const obs = { ...raw, position: parsePosition(raw.position) }
        const list = obsByAnsitz.get(obs.ansitz_id) ?? []
        list.push(obs)
        obsByAnsitz.set(obs.ansitz_id, list)
      }
      const remoteItems = (data as Ansitz[]).map((a) => ({
        ...a,
        beobachtungen: obsByAnsitz.get(a.id) ?? [],
      }))
      // Merge: keep local-only items (id not in remote) that haven't synced yet
      const cached = await getAllAnsitze(revierId).catch(() => [] as Ansitz[])
      const remoteIds = new Set(remoteItems.map((a) => a.id))
      const localOnly = cached.filter((a) => !remoteIds.has(a.id))
      const merged = [...remoteItems, ...localOnly].sort(
        (a, b) => (a.beginn < b.beginn ? 1 : -1)
      )
      setState({ ansitze: merged, loading: false, error: null })
    } catch {
      const cached = await getAllAnsitze(revierId).catch(() => [])
      setState({ ansitze: cached, loading: false, error: null })
    }
  }, [revierId])

  useEffect(() => { load() }, [load])

  return state
}
