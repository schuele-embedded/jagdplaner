import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { saveEinrichtungen, getEinrichtungen, addToSyncQueue } from '@/lib/indexeddb'
import { useRevier } from '@/hooks/useRevier'
import type { Ansitzeinrichtung } from '@/types'

interface UseEinrichtungenState {
  einrichtungen: Ansitzeinrichtung[]
  loading: boolean
  error: string | null
}

interface UseEinrichtungenResult extends UseEinrichtungenState {
  reload: () => Promise<void>
  create: (data: Omit<Ansitzeinrichtung, 'id' | 'created_at'>) => Promise<Ansitzeinrichtung>
  update: (id: string, data: Partial<Omit<Ansitzeinrichtung, 'id' | 'created_at'>>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export function useEinrichtungen(): UseEinrichtungenResult {
  const { revierId } = useRevier()
  const [state, setState] = useState<UseEinrichtungenState>({
    einrichtungen: [],
    loading: false,
    error: null,
  })

  const load = useCallback(async () => {
    if (!revierId) {
      setState({ einrichtungen: [], loading: false, error: null })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const { data, error } = await supabase
        .from('ansitzeinrichtungen')
        .select('*')
        .eq('revier_id', revierId)
        .order('name')
      if (error) throw error
      const items = data as Ansitzeinrichtung[]
      await saveEinrichtungen(items)
      setState({ einrichtungen: items, loading: false, error: null })
    } catch {
      try {
        const cached = await getEinrichtungen(revierId)
        setState({ einrichtungen: cached, loading: false, error: null })
      } catch {
        setState((s) => ({ ...s, loading: false, error: 'Einrichtungen konnten nicht geladen werden.' }))
      }
    }
  }, [revierId])

  useEffect(() => {
    load()
  }, [load])

  async function create(
    data: Omit<Ansitzeinrichtung, 'id' | 'created_at'>
  ): Promise<Ansitzeinrichtung> {
    const now = new Date().toISOString()
    const optimistic: Ansitzeinrichtung = { ...data, id: crypto.randomUUID(), created_at: now }
    setState((s) => ({ ...s, einrichtungen: [...s.einrichtungen, optimistic] }))

    try {
      const { data: inserted, error } = await supabase
        .from('ansitzeinrichtungen')
        .insert({ ...data })
        .select()
        .single()
      if (error) throw error
      const created = inserted as Ansitzeinrichtung
      setState((s) => {
        const updated = s.einrichtungen.map((e) => (e.id === optimistic.id ? created : e))
        saveEinrichtungen(updated)
        return { ...s, einrichtungen: updated }
      })
      return created
    } catch {
      await addToSyncQueue({
        table: 'ansitzeinrichtungen',
        operation: 'INSERT',
        payload: optimistic as unknown as Record<string, unknown>,
      })
      setState((s) => { saveEinrichtungen(s.einrichtungen); return s })
      return optimistic
    }
  }

  async function update(
    id: string,
    data: Partial<Omit<Ansitzeinrichtung, 'id' | 'created_at'>>
  ): Promise<void> {
    setState((s) => {
      const updated = s.einrichtungen.map((e) => (e.id === id ? { ...e, ...data } : e))
      saveEinrichtungen(updated)
      return { ...s, einrichtungen: updated }
    })

    try {
      const { error } = await supabase.from('ansitzeinrichtungen').update(data).eq('id', id)
      if (error) throw error
    } catch {
      await addToSyncQueue({
        table: 'ansitzeinrichtungen',
        operation: 'UPDATE',
        payload: { id, ...data } as Record<string, unknown>,
      })
    }
  }

  async function remove(id: string): Promise<void> {
    setState((s) => {
      const updated = s.einrichtungen.filter((e) => e.id !== id)
      saveEinrichtungen(updated)
      return { ...s, einrichtungen: updated }
    })

    try {
      const { error } = await supabase.from('ansitzeinrichtungen').delete().eq('id', id)
      if (error) throw error
    } catch {
      await addToSyncQueue({ table: 'ansitzeinrichtungen', operation: 'DELETE', payload: { id } })
    }
  }

  return { ...state, reload: load, create, update, remove }
}
