import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnsitz } from '@/hooks/useAnsitz'
import { useEinrichtungen } from '@/hooks/useEinrichtungen'
import { useWeatherData } from '@/hooks/useWeatherData'
import { useGeolocation } from '@/hooks/useGeolocation'
import { getMoonPhase, getMoonIllumination, getSunTimes } from '@/lib/mondphase'
import { niederschlagFromMm } from '@/lib/wetter'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { VorhersageWidget } from '@/components/ansitz/VorhersageWidget'
import type { Bedingungen } from '@/types'

function formatTime(d: Date): string {
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function AnsitzStarten() {
  const navigate = useNavigate()
  const { start, isActive } = useAnsitz()
  const { einrichtungen } = useEinrichtungen()
  const { position } = useGeolocation(false)
  const [selectedEinrichtungId, setSelectedEinrichtungId] = useState<string>('')
  const [startzeit, setStartzeit] = useState(() => {
    const now = new Date()
    now.setSeconds(0, 0)
    return now.toISOString().slice(0, 16)
  })

  const selectedEinrichtung = einrichtungen.find((e) => e.id === selectedEinrichtungId)
  const weatherPos = selectedEinrichtung?.position ?? position
  const { wetter, loading: wetterLoading } = useWeatherData(
    weatherPos?.lat ?? null,
    weatherPos?.lng ?? null
  )

  if (isActive) {
    navigate('/ansitz/aktiv', { replace: true })
    return null
  }

  function buildBedingungen(): Bedingungen {
    if (wetter) {
      return {
        temperatur_celsius: wetter.temperatur_celsius,
        windrichtung: wetter.windrichtung,
        windstaerke_bft: wetter.windstaerke_bft,
        niederschlag: niederschlagFromMm(wetter.niederschlag_mm),
        bewoelkung_prozent: wetter.bewoelkung_prozent,
        luftdruck_hpa: wetter.luftdruck_hpa,
        mondphase: getMoonPhase(new Date()),
        sichtweite: null,
      }
    }
    return {
      temperatur_celsius: null, windrichtung: null, windstaerke_bft: null,
      niederschlag: 'kein', bewoelkung_prozent: null, luftdruck_hpa: null,
      mondphase: getMoonPhase(new Date()), sichtweite: null,
    }
  }

  function handleStart() {
    if (!selectedEinrichtungId) return
    start({
      ansitzeinrichtung_id: selectedEinrichtungId,
      datum: startzeit.slice(0, 10),
      beginn: new Date(startzeit).toISOString(),
      bedingungen: buildBedingungen(),
      notizen: null,
    })
    navigate('/ansitz/aktiv')
  }

  const moonPhase = getMoonPhase(new Date())
  const moonPct = getMoonIllumination(new Date())
  const sunTimes = weatherPos ? getSunTimes(weatherPos.lat, weatherPos.lng, new Date()) : null

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4 pb-8 space-y-5">
      <h1 className="text-lg font-semibold">Ansitz starten</h1>

      {/* Einrichtung auswählen */}
      <div className="space-y-1">
        <Label>Ansitzeinrichtung</Label>
        <Select onValueChange={setSelectedEinrichtungId} value={selectedEinrichtungId}>
          <SelectTrigger>
            <SelectValue placeholder="Einrichtung auswählen…" />
          </SelectTrigger>
          <SelectContent>
            {einrichtungen.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} – {e.typ}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {einrichtungen.length === 0 && (
          <p className="text-xs text-gray-500">
            Keine Einrichtungen vorhanden. Bitte zuerst auf der Karte anlegen.
          </p>
        )}
      </div>

      {/* Startzeit */}
      <div className="space-y-1">
        <Label>Startzeit</Label>
        <Input
          type="datetime-local"
          value={startzeit}
          onChange={(e) => setStartzeit(e.target.value)}
        />
      </div>

      {/* Wetter & Mondphase */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bedingungen</p>
        {wetterLoading ? (
          <p className="text-sm text-gray-400">Wetterdaten werden geladen…</p>
        ) : wetter ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span>🌡 {wetter.temperatur_celsius?.toFixed(1)} °C</span>
            <span>💨 {wetter.windstaerke_bft} Bft</span>
            <span>☁️ {wetter.bewoelkung_prozent} %</span>
            <span>🌛 {moonPhase} ({moonPct}%)</span>
            {sunTimes && (
              <>
                <span>🌅 {formatTime(sunTimes.sunrise)}</span>
                <span>🌇 {formatTime(sunTimes.sunset)}</span>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            {weatherPos ? 'Wetterdaten nicht verfügbar' : 'Einrichtung auswählen für Wetterdaten'}
          </p>
        )}
      </div>

      {/* Vorhersage-Widget */}
      <VorhersageWidget />

      {/* Start button */}
      <Button
        className="h-16 text-base"
        onClick={handleStart}
        disabled={!selectedEinrichtungId}
      >
        Ansitz starten
      </Button>
    </div>
  )
}
