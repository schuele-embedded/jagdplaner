import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getAllAnsitze } from '@/lib/indexeddb'
import { useRevier } from '@/hooks/useRevier'
import type { Ansitz } from '@/types'

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
      setState({ ansitze: data as Ansitz[], loading: false, error: null })
    } catch {
      const cached = await getAllAnsitze(revierId).catch(() => [])
      setState({ ansitze: cached, loading: false, error: null })
    }
  }, [revierId])

  useEffect(() => { load() }, [load])

  return state
}
