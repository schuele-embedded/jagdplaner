import { useState, useRef } from 'react'
import { useAnsitz } from '@/hooks/useAnsitz'
import { useGeolocation } from '@/hooks/useGeolocation'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { WILDART_OPTIONS } from '@/lib/constants'
import type { Abschuss, Wildart, Geschlecht } from '@/types'

interface AbschussFormProps {
  onSave: () => void
  onCancel: () => void
}

export function AbschussForm({ onSave, onCancel }: AbschussFormProps) {
  const { setAbschuss } = useAnsitz()
  const { position } = useGeolocation(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [wildart, setWildart] = useState<Wildart>('Rehwild')
  const [geschlecht, setGeschlecht] = useState<Geschlecht>('unbekannt')
  const [alter, setAlter] = useState(1)
  const [gewicht, setGewicht] = useState('')
  const [entfernung, setEntfernung] = useState('')
  const [waffe, setWaffe] = useState('')
  const [trefferlage, setTrefferlage] = useState('')
  const [nachsuche, setNachsuche] = useState(false)
  const [notizen, setNotizen] = useState('')

  function handleSave() {
    const abschuss: Abschuss = {
      wildart,
      anzahl: 1,
      geschlecht,
      alter_jahre: alter,
      gewicht_kg: gewicht ? parseFloat(gewicht) : null,
      notizen: [
        waffe && `Waffe: ${waffe}`,
        trefferlage && `Trefferlage: ${trefferlage}`,
        entfernung && `Entfernung: ${entfernung} m`,
        nachsuche && 'Nachsuche nötig',
        notizen,
      ]
        .filter(Boolean)
        .join(' · ') || null,
    }
    setAbschuss(abschuss)
    onSave()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-red-700">Abschuss erfassen</h2>

      {/* Wildart */}
      <div className="space-y-1">
        <Label>Wildart</Label>
        <Select onValueChange={(v) => setWildart(v as Wildart)} value={wildart}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {WILDART_OPTIONS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Geschlecht */}
      <div className="space-y-1">
        <Label>Geschlecht</Label>
        <div className="flex gap-2">
          {(['maennlich', 'weiblich', 'unbekannt'] as Geschlecht[]).map((g) => {
            const label = { maennlich: 'Männlich', weiblich: 'Weiblich', unbekannt: 'Unbekannt' }[g]
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGeschlecht(g)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  geschlecht === g
                    ? 'border-red-600 bg-red-600 text-white'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Alter */}
      <div className="space-y-1">
        <Label>Alter (Jahre, geschätzt)</Label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setAlter((n) => Math.max(0, n - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-lg hover:bg-gray-50"
          >–</button>
          <span className="w-8 text-center text-xl font-semibold">{alter}</span>
          <button
            type="button"
            onClick={() => setAlter((n) => n + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-lg hover:bg-gray-50"
          >+</button>
        </div>
      </div>

      {/* Gewicht */}
      <div className="space-y-1">
        <Label htmlFor="gewicht">Gewicht (kg, optional)</Label>
        <Input id="gewicht" type="number" min={0} step={0.5} placeholder="z. B. 22.5"
          value={gewicht} onChange={(e) => setGewicht(e.target.value)} />
      </div>

      {/* Entfernung */}
      <div className="space-y-1">
        <Label htmlFor="entfernung">Entfernung (m)</Label>
        <Input id="entfernung" type="number" min={0} placeholder="z. B. 60"
          value={entfernung} onChange={(e) => setEntfernung(e.target.value)} />
      </div>

      {/* Waffe/Kaliber */}
      <div className="space-y-1">
        <Label htmlFor="waffe">Waffe / Kaliber</Label>
        <Input id="waffe" placeholder="z. B. Blaser R8 .308 Win"
          value={waffe} onChange={(e) => setWaffe(e.target.value)} />
      </div>

      {/* Trefferlage */}
      <div className="space-y-1">
        <Label htmlFor="trefferlage">Trefferlage</Label>
        <Input id="trefferlage" placeholder="z. B. Blattschuss"
          value={trefferlage} onChange={(e) => setTrefferlage(e.target.value)} />
      </div>

      {/* Nachsuche */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={nachsuche}
          onClick={() => setNachsuche((v) => !v)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            nachsuche ? 'bg-orange-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              nachsuche ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <Label>Nachsuche nötig</Label>
      </div>

      {/* GPS location (automatic) */}
      {position && (
        <p className="text-xs text-gray-400">
          GPS: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </p>
      )}

      {/* Foto */}
      <div className="space-y-1">
        <Label>Foto (optional)</Label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:bg-gray-50"
        >
          📷 Foto aufnehmen
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
        />
      </div>

      {/* Notizen */}
      <div className="space-y-1">
        <Label htmlFor="notizen">Notizen</Label>
        <Textarea id="notizen" rows={2} value={notizen} onChange={(e) => setNotizen(e.target.value)} />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Abbrechen</Button>
        <Button type="button" className="flex-1 bg-red-700 hover:bg-red-800" onClick={handleSave}>
          Abschuss speichern
        </Button>
      </div>
    </div>
  )
}
