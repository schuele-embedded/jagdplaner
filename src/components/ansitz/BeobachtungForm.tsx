import { useState } from 'react'
import { useAnsitz } from '@/hooks/useAnsitz'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { WILDART_OPTIONS } from '@/lib/constants'
import type { Beobachtung, Wildart, Geschlecht, Verhalten } from '@/types'

const FAVORITEN: Wildart[] = ['Rehwild', 'Schwarzwild', 'Rotwild', 'Fuchs', 'Feldhase', 'Fasan']

interface BeobachtungFormProps {
  onSave: (b: Beobachtung) => void
  onCancel: () => void
}

export function BeobachtungForm({ onSave, onCancel }: BeobachtungFormProps) {
  const { addObservation } = useAnsitz()
  const [wildart, setWildart] = useState<Wildart>('Rehwild')
  const [anzahl, setAnzahl] = useState(1)
  const [geschlecht, setGeschlecht] = useState<Geschlecht>('unbekannt')
  const [verhalten, setVerhalten] = useState<Verhalten>('aesend')
  const [entfernung, setEntfernung] = useState<string>('')
  const [notiz, setNotiz] = useState('')
  const [uhrzeit, setUhrzeit] = useState(() => {
    const now = new Date()
    now.setSeconds(0, 0)
    return now.toISOString().slice(0, 16)
  })

  // Favoriten first, then rest
  const sortedWildarten: Wildart[] = [
    ...FAVORITEN,
    ...WILDART_OPTIONS.filter((w) => !FAVORITEN.includes(w)),
  ]

  function handleSave() {
    const obs = {
      wildart,
      anzahl,
      geschlecht,
      verhalten,
      entfernung_meter: entfernung ? parseInt(entfernung) : null,
      notizen: notiz || null,
      uhrzeit: new Date(uhrzeit).toISOString(),
      position: null,
      fotos: [],
    }
    addObservation(obs)
    onSave({
      ...obs,
      id: crypto.randomUUID(),
      ansitz_id: '',
      revier_id: '',
      created_at: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Beobachtung erfassen</h2>

      {/* Wildart – Favoriten als Chips */}
      <div className="space-y-2">
        <Label>Wildart</Label>
        <div className="flex flex-wrap gap-2">
          {FAVORITEN.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWildart(w)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                wildart === w
                  ? 'border-green-700 bg-green-700 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
        <Select onValueChange={(v) => setWildart(v as Wildart)} value={wildart}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            {sortedWildarten.map((w) => (
              <SelectItem key={w} value={w}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Anzahl stepper */}
      <div className="space-y-1">
        <Label>Anzahl</Label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setAnzahl((n) => Math.max(1, n - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-lg text-gray-700 hover:bg-gray-50"
          >
            –
          </button>
          <span className="text-xl font-semibold w-8 text-center">{anzahl}</span>
          <button
            type="button"
            onClick={() => setAnzahl((n) => n + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-lg text-gray-700 hover:bg-gray-50"
          >
            +
          </button>
        </div>
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
                    ? 'border-green-700 bg-green-700 text-white'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Verhalten */}
      <div className="space-y-1">
        <Label>Verhalten</Label>
        <Select onValueChange={(v) => setVerhalten(v as Verhalten)} value={verhalten}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            <SelectItem value="aesend">Äsend</SelectItem>
            <SelectItem value="ziehend">Ziehend</SelectItem>
            <SelectItem value="fliehend">Fliehend</SelectItem>
            <SelectItem value="ruhend">Ruhend</SelectItem>
            <SelectItem value="kaempfend">Kämpfend</SelectItem>
            <SelectItem value="sonstiges">Sonstiges</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entfernung */}
      <div className="space-y-1">
        <Label htmlFor="entfernung">Entfernung (m, optional)</Label>
        <Input
          id="entfernung"
          type="number"
          min={0}
          placeholder="z. B. 80"
          value={entfernung}
          onChange={(e) => setEntfernung(e.target.value)}
        />
      </div>

      {/* Uhrzeit */}
      <div className="space-y-1">
        <Label htmlFor="uhrzeit">Uhrzeit</Label>
        <Input
          id="uhrzeit"
          type="datetime-local"
          value={uhrzeit}
          onChange={(e) => setUhrzeit(e.target.value)}
        />
      </div>

      {/* Notiz */}
      <div className="space-y-1">
        <Label htmlFor="notiz">Notiz (optional)</Label>
        <Textarea id="notiz" rows={2} value={notiz} onChange={(e) => setNotiz(e.target.value)} />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="button" className="flex-1" onClick={handleSave}>
          Erfassen
        </Button>
      </div>
    </div>
  )
}
