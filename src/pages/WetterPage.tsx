import { useEffect, useState } from 'react'
import { getSunTimes } from '@/lib/mondphase'
import { WetterPlanung } from '@/components/statistiken/WetterPlanung'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatTime(d: Date): string {
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function WetterPage() {
  const [sunTimes, setSunTimes] = useState<ReturnType<typeof getSunTimes> | null>(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSunTimes(getSunTimes(pos.coords.latitude, pos.coords.longitude, new Date()))
      },
      () => {}
    )
  }, [])

  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-4 space-y-4">
      <h1 className="text-lg font-semibold">Jagdwetter</h1>

      {sunTimes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Jagdlicht · {today}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>🌄 Dämmerungsbeginn</span>
              <span className="font-mono font-semibold">{formatTime(sunTimes.dawn)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>🌅 Sonnenaufgang</span>
              <span className="font-mono">{formatTime(sunTimes.sunrise)}</span>
            </div>
            <div className="flex items-center gap-2 py-0.5">
              <div className="flex-1 h-px bg-green-300" />
              <span className="text-xs text-green-700 font-medium whitespace-nowrap">Jagdliche Helligkeit</span>
              <div className="flex-1 h-px bg-green-300" />
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>🌇 Sonnenuntergang</span>
              <span className="font-mono">{formatTime(sunTimes.sunset)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🌆 Dämmerungsende</span>
              <span className="font-mono font-semibold">{formatTime(sunTimes.dusk)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <WetterPlanung />
    </div>
  )
}
