import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnsitzeinrichtungSchema, type AnsitzeinrichtungFormValues } from '@/lib/validierung'
import { useGeolocation } from '@/hooks/useGeolocation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, MapPin } from 'lucide-react'
import type { Ansitzeinrichtung, Windrichtung } from '@/types'

const TYPEN = ['Hochsitz', 'Kanzel', 'Drückjagdbock', 'Ansitzleiter', 'Feldansitz', 'Sonstiges'] as const
const ZUSTÄNDE = ['gut', 'mittel', 'schlecht', 'gesperrt'] as const
const ZUSTAND_LABEL = { gut: 'Gut', mittel: 'Mittel', schlecht: 'Schlecht', gesperrt: 'Gesperrt' }
const WINDRICHTUNGEN: Windrichtung[] = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']

interface EinrichtungFormProps {
  initialPosition?: { lat: number; lng: number }
  editData?: Ansitzeinrichtung
  revierID: string
  onSave: (data: AnsitzeinrichtungFormValues & { revier_id: string }) => Promise<void>
  onCancel: () => void
}

export function EinrichtungForm({
  initialPosition,
  editData,
  revierID,
  onSave,
  onCancel,
}: EinrichtungFormProps) {
  const { position: gpsPosition, loading: gpsLoading } = useGeolocation(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AnsitzeinrichtungFormValues>({
    resolver: zodResolver(AnsitzeinrichtungSchema),
    defaultValues: editData
      ? {
          typ: editData.typ,
          name: editData.name,
          beschreibung: editData.beschreibung ?? '',
          position: editData.position,
          hoehe_meter: editData.hoehe_meter ?? undefined,
          ausrichtung_grad: editData.ausrichtung_grad ?? undefined,
          sichtweite_meter: editData.sichtweite_meter ?? undefined,
          zustand: editData.zustand,
          letzte_wartung: editData.letzte_wartung ?? '',
          notizen: editData.notizen ?? '',
          guenstige_windrichtungen: editData.guenstige_windrichtungen,
        }
      : {
          typ: 'Hochsitz',
          name: '',
          zustand: 'gut',
          position: initialPosition ?? { lat: 0, lng: 0 },
          guenstige_windrichtungen: [],
        },
  })

  // Once initialPosition arrives (map click), apply it
  useEffect(() => {
    if (initialPosition) setValue('position', initialPosition)
  }, [initialPosition, setValue])

  function useCurrentPosition() {
    if (gpsPosition) setValue('position', gpsPosition)
  }

  const currentPosition = watch('position')
  const currentWindrichtungen = watch('guenstige_windrichtungen') ?? []

  function toggleWindrichtung(wr: Windrichtung) {
    const current = currentWindrichtungen.includes(wr)
      ? currentWindrichtungen.filter((w) => w !== wr)
      : [...currentWindrichtungen, wr]
    setValue('guenstige_windrichtungen', current)
  }

  async function onSubmit(data: AnsitzeinrichtungFormValues) {
    await onSave({ ...data, revier_id: revierID })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {editData ? 'Einrichtung bearbeiten' : 'Neue Einrichtung'}
        </h2>
        <button onClick={onCancel} className="rounded-full p-1 hover:bg-gray-100">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Typ */}
        <div className="space-y-1">
          <Label htmlFor="typ">Typ</Label>
          <Controller
            name="typ"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="typ">
                  <SelectValue placeholder="Typ wählen" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  {TYPEN.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Name */}
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="z. B. Hochsitz Nordrand" {...register('name')} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>

        {/* Beschreibung */}
        <div className="space-y-1">
          <Label htmlFor="beschreibung">Beschreibung (optional)</Label>
          <Textarea id="beschreibung" rows={2} {...register('beschreibung')} />
        </div>

        {/* Position */}
        <div className="space-y-1">
          <Label>GPS-Position</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {currentPosition?.lat !== 0 || currentPosition?.lng !== 0
                ? `${currentPosition?.lat?.toFixed(5)}, ${currentPosition?.lng?.toFixed(5)}`
                : 'Nicht gesetzt'}
            </span>
            <button
              type="button"
              onClick={useCurrentPosition}
              disabled={gpsLoading || !gpsPosition}
              className="flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-40"
            >
              <MapPin size={12} />
              Aktueller Standort
            </button>
          </div>
        </div>

        {/* Zustand */}
        <div className="space-y-1">
          <Label htmlFor="zustand">Zustand</Label>
          <Controller
            name="zustand"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="zustand">
                  <SelectValue placeholder="Zustand wählen" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  {ZUSTÄNDE.map((z) => (
                    <SelectItem key={z} value={z}>
                      {ZUSTAND_LABEL[z]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Ausrichtung */}
        <div className="space-y-1">
          <Label htmlFor="ausrichtung_grad">Ausrichtung (°)</Label>
          <Input
            id="ausrichtung_grad"
            type="number"
            min={0}
            max={359}
            placeholder="z. B. 270 (West)"
            {...register('ausrichtung_grad', { valueAsNumber: true })}
          />
        </div>

        {/* Sichtweite */}
        <div className="space-y-1">
          <Label htmlFor="sichtweite_meter">Sichtweite (m)</Label>
          <Input
            id="sichtweite_meter"
            type="number"
            min={0}
            placeholder="z. B. 150"
            {...register('sichtweite_meter', { valueAsNumber: true })}
          />
        </div>

        {/* Höhe */}
        <div className="space-y-1">
          <Label htmlFor="hoehe_meter">Höhe (m)</Label>
          <Input
            id="hoehe_meter"
            type="number"
            min={0}
            placeholder="z. B. 4"
            {...register('hoehe_meter', { valueAsNumber: true })}
          />
        </div>

        {/* Günstige Windrichtungen */}
        <div className="space-y-1">
          <Label>Günstige Windrichtungen</Label>
          <div className="flex flex-wrap gap-2">
            {WINDRICHTUNGEN.map((wr) => {
              const active = currentWindrichtungen.includes(wr)
              return (
                <button
                  key={wr}
                  type="button"
                  onClick={() => toggleWindrichtung(wr)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? 'border-green-700 bg-green-700 text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {wr}
                </button>
              )
            })}
          </div>
        </div>

        {/* Letzte Wartung */}
        <div className="space-y-1">
          <Label htmlFor="letzte_wartung">Letzte Wartung</Label>
          <Input id="letzte_wartung" type="date" {...register('letzte_wartung')} />
        </div>

        {/* Notizen */}
        <div className="space-y-1">
          <Label htmlFor="notizen">Notizen</Label>
          <Textarea id="notizen" rows={2} {...register('notizen')} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Speichern…' : 'Speichern'}
          </Button>
        </div>
      </form>
    </div>
  )
}
