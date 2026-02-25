import { useState } from 'react'
import { ChevronDown, Plus, Check, MapPin } from 'lucide-react'
import { useRevierStore } from '@/store/useRevierStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RevierForm } from '@/components/revier/RevierForm'
import { cn } from '@/lib/utils'
import type { RevierFormValues } from '@/lib/validierung'

export function RevierWechsler() {
  const { reviere, activeRevier, setActiveRevier, createRevier } = useRevierStore()
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  async function handleCreate(data: RevierFormValues) {
    await createRevier(data)
    setShowCreate(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors max-w-[180px]"
      >
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate">{activeRevier?.name ?? 'Kein Revier'}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>

      {/* Revier-Auswahl */}
      <Dialog open={open && !showCreate} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revier wechseln</DialogTitle>
          </DialogHeader>

          <div className="space-y-1">
            {reviere.map((r) => (
              <button
                key={r.id}
                onClick={() => { setActiveRevier(r.id); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-accent transition-colors',
                  r.id === activeRevier?.id && 'bg-accent'
                )}
              >
                <Check className={cn('h-4 w-4 shrink-0', r.id === activeRevier?.id ? 'text-primary' : 'opacity-0')} />
                <span className="flex-1 text-left font-medium">{r.name}</span>
              </button>
            ))}

            <button
              onClick={() => { setShowCreate(true) }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors border border-dashed border-primary/30 mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>Neues Revier anlegen</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Neues Revier */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Revier anlegen</DialogTitle>
          </DialogHeader>
          <RevierForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
