import { useMemo } from 'react'
import { useRevierStore } from '@/store/useRevierStore'
import { useUserStore } from '@/store/useUserStore'
import type { Berechtigungen } from '@/types'
import { ROLE_PRESETS } from '@/types'

const NO_PERMISSIONS: Berechtigungen = {
  ansitze_erstellen: false,
  einrichtungen_verwalten: false,
  mitglieder_einladen: false,
  statistiken_sehen: false,
  revier_bearbeiten: false,
}

/**
 * Returns the current user's permissions for the active Revier.
 * Falls back to NO_PERMISSIONS when not a member / not loaded yet.
 */
export function usePermissions(): Berechtigungen & {
  canCreateAnsitz: () => boolean
  canManageEinrichtungen: () => boolean
  canInviteMembers: () => boolean
  canSeeStatistiken: () => boolean
  canEditRevier: () => boolean
} {
  const activeRevier = useRevierStore((s) => s.activeRevier)
  const user = useUserStore((s) => s.user)

  const permissions = useMemo<Berechtigungen>(() => {
    if (!activeRevier || !user) return NO_PERMISSIONS
    // Eigentümer immer voll berechtigt
    if (activeRevier.eigentuemer_id === user.id) return ROLE_PRESETS.eigentuemer
    // Für andere Mitglieder: Supabase gibt revier_mitglieder zurück,
    // aber wir haben sie nicht im Store – daher Fallback auf jaeger preset.
    // Nach TASK-009 wird ein dedizierter Mitglieder-Store diesen Wert liefern.
    return ROLE_PRESETS.jaeger
  }, [activeRevier, user])

  return {
    ...permissions,
    canCreateAnsitz: () => permissions.ansitze_erstellen,
    canManageEinrichtungen: () => permissions.einrichtungen_verwalten,
    canInviteMembers: () => permissions.mitglieder_einladen,
    canSeeStatistiken: () => permissions.statistiken_sehen,
    canEditRevier: () => permissions.revier_bearbeiten,
  }
}
