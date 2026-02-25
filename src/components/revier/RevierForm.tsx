import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RevierSchema, type RevierFormValues } from '@/lib/validierung'
import { WILDART_OPTIONS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import type { Revier } from '@/types'

interface RevierFormProps {
  revier?: Revier
  onSubmit: (data: RevierFormValues) => Promise<void>
  onCancel?: () => void
}

export function RevierForm({ revier, onSubmit, onCancel }: RevierFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RevierFormValues>({
    resolver: zodResolver(RevierSchema),
    defaultValues: revier
      ? {
          name: revier.name,
          beschreibung: revier.beschreibung ?? '',
          flaeche_ha: revier.flaeche_ha ?? undefined,
          settings: revier.settings,
        }
      : {
          name: '',
          beschreibung: '',
          settings: {
            standard_wildarten: ['Rehwild', 'Schwarzwild'],
            zeitzone: 'Europe/Berlin',
            jagdzeiten: {},
            heatmap_enabled: true,
          },
        },
  })

  useEffect(() => {
    if (revier) reset({ name: revier.name, beschreibung: revier.beschreibung ?? '', settings: revier.settings })
  }, [revier, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" placeholder="Revier Mustertal" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="beschreibung">Beschreibung</Label>
        <Textarea id="beschreibung" placeholder="Kurze Beschreibung…" rows={3} {...register('beschreibung')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="flaeche_ha">Fläche (ha)</Label>
        <Input
          id="flaeche_ha"
          type="number"
          step="0.1"
          placeholder="z. B. 250"
          {...register('flaeche_ha', { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-2">
        <Label>Wildarten</Label>
        <Controller
          name="settings.standard_wildarten"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2">
              {WILDART_OPTIONS.map((wildart) => {
                const checked = field.value.includes(wildart)
                return (
                  <label key={wildart} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => {
                        if (c) field.onChange([...field.value, wildart])
                        else field.onChange(field.value.filter((w) => w !== wildart))
                      }}
                    />
                    {wildart}
                  </label>
                )
              })}
            </div>
          )}
        />
        {errors.settings?.standard_wildarten && (
          <p className="text-xs text-destructive">{errors.settings.standard_wildarten.message}</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Speichern…' : revier ? 'Speichern' : 'Revier anlegen'}
        </Button>
      </div>
    </form>
  )
}
