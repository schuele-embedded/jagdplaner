import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, User, Users, Map, Download } from 'lucide-react'
import { useUserStore } from '@/store/useUserStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MitgliederVerwaltung } from '@/components/revier/MitgliederVerwaltung'
import { useEinrichtungen } from '@/hooks/useEinrichtungen'
import type { Ansitzeinrichtung } from '@/types'

// ---- Tile pre-loading helpers ------------------------------------------

function tileUrl(z: number, x: number, y: number): string {
  const subdomains = ['a', 'b', 'c']
  const s = subdomains[(x + y) % 3]
  return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`
}

function lon2tile(lon: number, zoom: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom))
}

function lat2tile(lat: number, zoom: number) {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  )
}

function collectTileUrls(
  einrichtungen: Ansitzeinrichtung[],
  zoomLevels = [12, 13, 14, 15, 16],
  bufferDeg = 0.05
): string[] {
  if (einrichtungen.length === 0) return []

  const lats = einrichtungen.map((e) => e.position.lat)
  const lngs = einrichtungen.map((e) => e.position.lng)
  const minLat = Math.min(...lats) - bufferDeg
  const maxLat = Math.max(...lats) + bufferDeg
  const minLng = Math.min(...lngs) - bufferDeg
  const maxLng = Math.max(...lngs) + bufferDeg

  const urls: string[] = []
  for (const z of zoomLevels) {
    const xMin = lon2tile(minLng, z)
    const xMax = lon2tile(maxLng, z)
    const yMin = lat2tile(maxLat, z) // note: lat/tile y is inverted
    const yMax = lat2tile(minLat, z)
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        urls.push(tileUrl(z, x, y))
      }
    }
  }
  return urls
}

// ---- Component ----------------------------------------------------------

export function MenuPage() {
  const { user, signOut } = useUserStore()
  const { einrichtungen } = useEinrichtungen()
  const [preloadProgress, setPreloadProgress] = useState<{ done: number; total: number } | null>(null)
  const [preloadDone, setPreloadDone] = useState(false)

  async function handlePreloadMap() {
    const urls = collectTileUrls(einrichtungen)
    if (urls.length === 0) {
      alert('Keine Einrichtungen vorhanden. Bitte zuerst Einrichtungen auf der Karte anlegen.')
      return
    }
    if (urls.length > 200) {
      const ok = confirm(
        `${urls.length} Kacheln werden geladen (~${Math.round((urls.length * 15) / 1024)} MB). Fortfahren?`
      )
      if (!ok) return
    }

    setPreloadDone(false)
    setPreloadProgress({ done: 0, total: urls.length })

    let done = 0
    // Fetch in batches of 8 to avoid overloading the network
    const BATCH = 8
    for (let i = 0; i < urls.length; i += BATCH) {
      const batch = urls.slice(i, i + BATCH)
      await Promise.allSettled(batch.map((url) => fetch(url, { mode: 'no-cors' })))
      done += batch.length
      setPreloadProgress({ done: Math.min(done, urls.length), total: urls.length })
    }

    setPreloadProgress(null)
    setPreloadDone(true)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-4 space-y-4">
      <h1 className="text-lg font-semibold">Menü</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <Map className="h-4 w-4" />
            Offline-Karte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {preloadProgress ? (
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                {preloadProgress.done} / {preloadProgress.total} Kacheln geladen…
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-green-600 transition-all"
                  style={{ width: `${(preloadProgress.done / preloadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          ) : preloadDone ? (
            <p className="text-sm text-green-700">Karte gespeichert ✓</p>
          ) : (
            <p className="text-sm text-gray-500">
              Kartenausschnitt für alle Ansitzeinrichtungen (Zoom 12–16) im Offline-Speicher ablegen.
            </p>
          )}
          <button
            onClick={handlePreloadMap}
            disabled={!!preloadProgress}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Karte für Offline speichern
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <Users className="h-4 w-4" />
            Reviermitglieder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MitgliederVerwaltung />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/5 transition-colors rounded-xl"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Abmelden</span>
          </button>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-6 py-2 text-xs text-muted-foreground">
        <Link to="/impressum" className="hover:underline">Impressum</Link>
        <Link to="/datenschutz" className="hover:underline">Datenschutz</Link>
      </div>
    </div>
  )
}
