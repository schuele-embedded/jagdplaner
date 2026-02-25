import { useRevierStore } from '@/store/useRevierStore'

/**
 * Convenience hook – returns the active Revier and common derived state.
 */
export function useRevier() {
  const activeRevier = useRevierStore((s) => s.activeRevier)
  const reviere = useRevierStore((s) => s.reviere)
  const loading = useRevierStore((s) => s.loading)

  return {
    activeRevier,
    reviere,
    loading,
    hasRevier: reviere.length > 0,
    revierId: activeRevier?.id ?? null,
  }
}
