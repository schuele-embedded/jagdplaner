import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Revier } from '@/types'
import type { RevierFormValues } from '@/lib/validierung'

const ACTIVE_REVIER_KEY = 'ansitzplaner_active_revier_id'

interface RevierState {
  reviere: Revier[]
  activeRevier: Revier | null
  loading: boolean
  error: string | null
}

interface RevierActions {
  loadReviere: () => Promise<void>
  setActiveRevier: (id: string) => void
  createRevier: (data: RevierFormValues) => Promise<Revier>
  updateRevier: (id: string, data: Partial<RevierFormValues>) => Promise<void>
  deleteRevier: (id: string) => Promise<void>
}

export const useRevierStore = create<RevierState & RevierActions>((set, get) => ({
  reviere: [],
  activeRevier: null,
  loading: false,
  error: null,

  loadReviere: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('reviere')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      set({ loading: false, error: error.message })
      return
    }

    const reviere = (data ?? []) as Revier[]
    const savedId = localStorage.getItem(ACTIVE_REVIER_KEY)
    const activeRevier =
      reviere.find((r) => r.id === savedId) ?? reviere[0] ?? null

    set({ reviere, activeRevier, loading: false })
  },

  setActiveRevier: (id) => {
    const revier = get().reviere.find((r) => r.id === id) ?? null
    localStorage.setItem(ACTIVE_REVIER_KEY, id)
    set({ activeRevier: revier })
  },

  createRevier: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht angemeldet')

    const { data: revier, error } = await supabase
      .from('reviere')
      .insert({
        name: data.name,
        beschreibung: data.beschreibung ?? null,
        flaeche_ha: data.flaeche_ha ?? null,
        grenze_geojson: data.grenze_geojson ?? null,
        eigentuemer_id: user.id,
        settings: data.settings,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    const newRevier = revier as Revier
    set((state) => ({
      reviere: [...state.reviere, newRevier],
      activeRevier: state.activeRevier ?? newRevier,
    }))
    localStorage.setItem(ACTIVE_REVIER_KEY, newRevier.id)
    return newRevier
  },

  updateRevier: async (id, data) => {
    const { error } = await supabase
      .from('reviere')
      .update(data)
      .eq('id', id)

    if (error) throw new Error(error.message)

    set((state) => {
      const reviere = state.reviere.map((r) =>
        r.id === id ? { ...r, ...data } : r
      )
      const activeRevier =
        state.activeRevier?.id === id
          ? { ...state.activeRevier, ...data }
          : state.activeRevier
      return { reviere, activeRevier }
    })
  },

  deleteRevier: async (id) => {
    const { error } = await supabase.from('reviere').delete().eq('id', id)
    if (error) throw new Error(error.message)

    set((state) => {
      const reviere = state.reviere.filter((r) => r.id !== id)
      const activeRevier =
        state.activeRevier?.id === id ? (reviere[0] ?? null) : state.activeRevier
      if (activeRevier) localStorage.setItem(ACTIVE_REVIER_KEY, activeRevier.id)
      else localStorage.removeItem(ACTIVE_REVIER_KEY)
      return { reviere, activeRevier }
    })
  },
}))
