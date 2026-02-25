import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

interface UserState {
  user: User | null
  session: Session | null
  loading: boolean
}

interface UserActions {
  initialize: () => Promise<void>
  signOut: () => Promise<void>
}

export const useUserStore = create<UserState & UserActions>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({
      session,
      user: session ? mapSupabaseUser(session.user) : null,
      loading: false,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session ? mapSupabaseUser(session.user) : null,
        loading: false,
      })
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))

function mapSupabaseUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name: (supabaseUser.user_metadata?.name as string | undefined) ?? supabaseUser.email ?? '',
    settings: {
      standard_revier_id: null,
      push_notifications: false,
      dark_mode: false,
    },
  }
}
