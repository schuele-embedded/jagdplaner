import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { RevierForm } from '@/components/revier/RevierForm'
import { useRevierStore } from '@/store/useRevierStore'
import type { RevierFormValues } from '@/lib/validierung'

interface OnboardingModalProps {
  open: boolean
}

export function OnboardingModal({ open }: OnboardingModalProps) {
  const createRevier = useRevierStore((s) => s.createRevier)
  const [done, setDone] = useState(false)

  async function handleSubmit(data: RevierFormValues) {
    await createRevier(data)
    setDone(true)
  }

  return (
    <Dialog open={open && !done}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>🦌 Willkommen bei JagdPlaner!</DialogTitle>
          <DialogDescription>
            Lege jetzt dein erstes Revier an, um loszulegen.
          </DialogDescription>
        </DialogHeader>
        <RevierForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  )
}
