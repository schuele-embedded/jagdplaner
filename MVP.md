# JagdPlaner – MVP Task-Liste (Implementierungs-Agent)

> Dieses Dokument beschreibt alle Implementierungsaufgaben des MVP als geordnete, atomar ausführbare Tasks.
> Jeder Task enthält Abhängigkeiten, konkrete Anforderungen, zu erstellende Artefakte und Akzeptanzkriterien.
> Tasks ohne Abhängigkeiten können parallel bearbeitet werden.
>
> **Codierungskonvention (→ CLAUDE.md):** Variablen, Funktionen und Kommentare auf **Englisch**. UI-Texte und fachliche Domain-Namen (Revier, Ansitz, Einrichtung, Beobachtung …) bleiben auf **Deutsch**.

---

## Scope des MVP

**Enthalten:**
- Authentifizierung (Registrierung, Login)
- Revierverwaltung mit Multi-User und Rollen
- Interaktive Karte mit Ansitzeinrichtungen
- Ansitz-Erfassung mit Wetter- und Beobachtungsdaten
- Offline-Fähigkeit (IndexedDB + Service Worker)
- Basis-Statistiken / Dashboard

**Explizit ausgeschlossen:**
- Heatmap / ML-Vorhersage
- Export-Funktionen (PDF, CSV)
- Push-Benachrichtigungen
- Wildkamera-Integration
- Bezahlung / Subscription-Management

---

## Technische Entscheidungen

| Thema | Technologie | Begründung |
|---|---|---|
| Framework | React 18 + TypeScript + Vite | Schneller Build, starke Typisierung |
| Backend | Supabase | RLS, Auth, Realtime und Storage out-of-the-box |
| State | Zustand | Minimal-Boilerplate, auch für Offline-State geeignet |
| Formulare | React Hook Form + Zod | Type-safe Validation, gute DX |
| Karte | Leaflet.js / React-Leaflet | OSM-kompatibel, mobile-tauglich |
| Charts | Recharts | React-nativ, kein Canvas-Overhead |
| Offline DB | idb (IndexedDB) | Schlanker Promise-Wrapper |
| Offline Tiles | Service Worker CacheFirst | Kein extra Plugin nötig |
| Icons | Lucide React | Bereits in shadcn/ui enthalten |

---

## Definition of Done

Ein Task gilt als abgeschlossen wenn:
- Kein TypeScript-Fehler (`tsc --noEmit`)
- Kein Lint-Fehler (`eslint`)
- Funktion auf iOS Safari und Android Chrome verifiziert
- Offline-Verhalten getestet (soweit für den Task relevant)

---

## Ziel-Projektstruktur

```
jagdplaner/
├── src/
│   ├── components/
│   │   ├── karte/              # RevierMap, AnsitzMarker, RevierBoundary, UserPosition
│   │   ├── ansitz/             # AnsitzStarten, AnsitzTimer, BeobachtungForm, AbschussForm
│   │   ├── einrichtungen/      # EinrichtungForm, EinrichtungPopup, EinrichtungListe
│   │   ├── revier/             # RevierForm, MitgliederVerwaltung, RevierWechsler
│   │   ├── statistiken/        # Dashboard, AnsitzListe, ErfolgChart
│   │   └── ui/                 # shadcn/ui Basis-Komponenten
│   ├── hooks/                  # useAnsitz, useEinrichtungen, useRevier, useWeatherData, useGeolocation, usePermissions
│   ├── lib/                    # supabase.ts, indexeddb.ts, wetter.ts, mondphase.ts, validierung.ts
│   ├── pages/                  # KartePage, StatistikenPage, AnsitzPage, ListePage, MenuPage
│   ├── store/                  # useRevierStore, useAnsitzStore, useUserStore
│   ├── types/index.ts
│   └── App.tsx
├── supabase/migrations/001_initial_schema.sql
├── public/manifest.json
├── vite.config.ts
└── .env.example
```

---

## Tasks

### TASK-001 – Projekt-Scaffold

**Abhängigkeiten:** keine

**Beschreibung:**
Neues Vite + React + TypeScript Projekt anlegen, alle Abhängigkeiten installieren und Basis-Konfiguration einrichten.

**Schritte:**
1. `npm create vite@latest jagdplaner -- --template react-ts`
2. Abhängigkeiten installieren:
   ```
   react-router-dom zustand @supabase/supabase-js
   react-leaflet leaflet @types/leaflet
   react-hook-form zod @hookform/resolvers
   suncalc @types/suncalc
   recharts idb
   vite-plugin-pwa
   ```
3. shadcn/ui initialisieren: `npx shadcn-ui@latest init` (Tailwind v3, CSS Variables, Dark Mode)
4. Tailwind `tailwind.config.ts` konfigurieren:
   - Primary: Waldgrün `#2d5016` / Dark: `#4a7c2c`
   - Secondary: Erdbraun `#8b4513`
   - Accent: Signal-Orange `#ff6b35`
5. ESLint + Prettier einrichten (`.eslintrc.cjs`, `.prettierrc`)
6. GitHub Actions CI anlegen (`.github/workflows/ci.yml`): `tsc --noEmit` + `eslint` + `vite build`
7. `.env.example` mit `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` anlegen

**Artefakte:**
- Vollständige `package.json` mit allen Abhängigkeiten
- `vite.config.ts` mit `vite-plugin-pwa` eingebunden
- `tailwind.config.ts`
- `.github/workflows/ci.yml`
- `.env.example`

**Akzeptanzkriterien:**
- `npm run dev` startet ohne Fehler
- `npm run build` läuft durch
- `tsc --noEmit` und `eslint` ohne Fehler

---

### TASK-002 – TypeScript-Typen & Zod-Schemas

**Abhängigkeiten:** TASK-001

**Beschreibung:**
Alle zentralen TypeScript-Interfaces und zugehörige Zod-Validierungsschemas definieren. Diese Datei ist Grundlage aller weiteren Tasks.

**Zu erstellen:** `src/types/index.ts`, `src/lib/validierung.ts`

**Interfaces in `src/types/index.ts`:**
- `Revier` (id, name, beschreibung, flaeche_ha, grenze_geojson, eigentuemer_id, settings, created_at)
- `RevierSettings` (standard_wildarten, zeitzone, jagdzeiten, heatmap_enabled)
- `Ansitzeinrichtung` (id, revier_id, typ, name, position, hoehe_meter, ausrichtung_grad, sichtweite_meter, zustand, guenstige_windrichtungen, ...)
- `Ansitz` (id, revier_id, ansitzeinrichtung_id, jaeger_id, datum, beginn, ende, bedingungen, erfolg, beobachtungen, abschuss, ...)
- `Beobachtung` (id, ansitz_id, wildart, anzahl, geschlecht, verhalten, position, uhrzeit, ...)
- `RevierMitglied` (id, revier_id, user_id, rolle, berechtigungen)
- `Berechtigungen` (ansitze_erstellen, einrichtungen_verwalten, mitglieder_einladen, statistiken_sehen, revier_bearbeiten)
- `User` (id, email, name, settings)
- `WetterDaten` (temperatur_celsius, windrichtung, windstaerke_bft, niederschlag_mm, bewoelkung_prozent, luftdruck_hpa, mondphase)

**Zod-Schemas in `src/lib/validierung.ts`:**
- `RevierSchema` – Formular-Validierung für Revier anlegen/bearbeiten
- `AnsitzeinrichtungSchema` – Formular-Validierung für Einrichtung
- `AnsitzSchema` – Formular-Validierung für Ansitz starten/beenden
- `BeobachtungSchema` – Formular-Validierung für Beobachtung
- `AbschussSchema` – Formular-Validierung für Abschuss

**Akzeptanzkriterien:**
- Alle Interfaces decken die Felder aus `JagdPlaner.md` Abschnitt 3.1 vollständig ab
- Zod-Schemas exportieren inferierte TypeScript-Typen (`z.infer<typeof Schema>`)
- `tsc --noEmit` ohne Fehler

---

### TASK-003 – Supabase-Datenbankschema

**Abhängigkeiten:** keine (Supabase-Projekt muss manuell angelegt werden)

**Beschreibung:**
Vollständiges SQL-Migrationsskript erstellen, das das gesamte Datenbankschema mit RLS Policies erzeugt.

**Zu erstellen:** `supabase/migrations/001_initial_schema.sql`

**Inhalt:**
1. Extension `uuid-ossp` aktivieren
2. Tabellen anlegen:
   - `reviere` (id UUID PK, name, beschreibung, flaeche_ha, grenze_geojson JSONB, eigentuemer_id UUID→auth.users, settings JSONB, created_at)
   - `ansitzeinrichtungen` (id, revier_id→reviere, typ, name, beschreibung, position GEOGRAPHY(POINT), hoehe_meter, ausrichtung_grad, sichtweite_meter, zustand, letzte_wartung, naechste_wartung, fotos TEXT[], notizen, guenstige_windrichtungen TEXT[], created_at, created_by→auth.users)
   - `ansitze` (id, revier_id, ansitzeinrichtung_id, jaeger_id, datum DATE, beginn TIMESTAMPTZ, ende TIMESTAMPTZ, bedingungen JSONB, erfolg BOOLEAN DEFAULT false, abschuss JSONB, notizen, created_at)
   - `beobachtungen` (id, ansitz_id→ansitze, revier_id, wildart, anzahl, geschlecht, verhalten, position GEOGRAPHY(POINT), uhrzeit TIMESTAMPTZ, entfernung_meter, notizen, fotos TEXT[], created_at)
   - `revier_mitglieder` (id, revier_id, user_id, rolle, berechtigungen JSONB, eingeladen_von, eingeladen_am, aktiv BOOLEAN, UNIQUE(revier_id, user_id))
3. Spatial Index: `CREATE INDEX idx_einrichtungen_position ON ansitzeinrichtungen USING GIST(position)`
4. RLS aktivieren auf allen Tabellen
5. RLS Policies (SELECT, INSERT, UPDATE, DELETE) für jede Tabelle:
   - User sieht/mutiert nur Daten in Revieren, in denen er aktives Mitglied ist
   - Bearbeitungsrechte prüfen via `(berechtigungen->>'einrichtungen_verwalten')::boolean`
   - Eigene Ansitze: zusätzlich `jaeger_id = auth.uid()`

**Akzeptanzkriterien:**
- Skript läuft fehlerfrei in Supabase SQL-Editor durch
- Alle RLS Policies verhindern Zugriff anderer User (mit Supabase Test-Tool verifizieren)

---

### TASK-004 – Supabase Client & Auth-Store

**Abhängigkeiten:** TASK-001, TASK-003

**Beschreibung:**
Supabase Client initialisieren und den globalen Auth-Zustand via Zustand verwalten.

**Zu erstellen:**
- `src/lib/supabase.ts` – Singleton Supabase Client
- `src/store/useUserStore.ts` – Zustand Store für Auth-State

**`src/lib/supabase.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**`src/store/useUserStore.ts`:**
- State: `user: User | null`, `session: Session | null`, `loading: boolean`
- Actions: `initialize()` (liest Session aus Supabase), `signOut()`
- Supabase `onAuthStateChange` Listener registrieren

**Akzeptanzkriterien:**
- `useUserStore` gibt korrekten User nach Login zurück
- Nach Seiten-Reload bleibt Session erhalten
- `signOut()` löscht Session korrekt

---

### TASK-005 – Auth-UI (Login, Registrierung, Passwort-Reset)

**Abhängigkeiten:** TASK-004, TASK-002

**Beschreibung:**
Alle Authentifizierungs-Screens implementieren.

**Zu erstellen:**
- `src/pages/LoginPage.tsx`
- `src/pages/RegistrierungPage.tsx`
- `src/pages/PasswortResetPage.tsx`
- `src/components/ui/AuthGuard.tsx` – Weiterleitung auf Login wenn nicht eingeloggt

**LoginPage:**
- Felder: Email, Passwort
- Link zu Registrierung und Passwort vergessen
- Supabase `signInWithPassword()`
- Fehlerbehandlung: "Ungültige Zugangsdaten"

**RegistrierungPage:**
- Felder: Name, Email, Passwort, Passwort bestätigen
- Zod-Validierung (Passwort min. 8 Zeichen)
- Supabase `signUp()` + User-Profil in `users`-Tabelle anlegen
- Hinweis: "Bestätigungs-E-Mail wurde gesendet"

**PasswortResetPage:**
- Email-Feld
- Supabase `resetPasswordForEmail()`

**AuthGuard:**
- Wrapped alle geschützten Routes
- Redirect auf `/login` wenn kein User im Store
- Zeigt Lade-Spinner während `loading: true`

**Akzeptanzkriterien:**
- Vollständiger Registrierung→Bestätigung→Login-Flow funktioniert
- Falsche Zugangsdaten zeigen verständliche Fehlermeldung auf Deutsch
- Direkt-Aufruf geschützter URL leitet auf Login um

---

### TASK-006 – App-Shell & Navigation

**Abhängigkeiten:** TASK-005

**Beschreibung:**
Grundlegende App-Struktur mit Bottom-Navigation und Routing aufbauen. Dies ist das Rahmenwerk für alle weiteren UI-Tasks.

**Zu erstellen:**
- `src/App.tsx` – Router-Setup
- `src/components/ui/BottomNav.tsx`
- `src/components/ui/OfflineIndicator.tsx`
- `src/pages/KartePage.tsx` (Platzhalter)
- `src/pages/StatistikenPage.tsx` (Platzhalter)
- `src/pages/AnsitzPage.tsx` (Platzhalter)
- `src/pages/ListePage.tsx` (Platzhalter)
- `src/pages/MenuPage.tsx` (Profil, Abmelden, Revier-Einstellungen)

**BottomNav:**
```
[ Karte | Statistiken | [+Ansitz] | Liste | Menü ]
```
- Center-Tab "Ansitz" hervorgehoben (andere Farbe, größeres Icon)
- Aktiver Tab visuell hervorgehoben
- Daumen-erreichbar (position: fixed, bottom: 0)

**OfflineIndicator:**
- Nutzt `navigator.onLine` + `online`/`offline` Events
- Zeigt Toast-Banner wenn offline: "Kein Internet – Offline-Modus aktiv"
- Zeigt Badge wenn pending Sync vorhanden (aus `useAnsitzStore`)

**Routing:**
- `/` → `KartePage`
- `/statistiken` → `StatistikenPage`
- `/ansitz` → `AnsitzPage`
- `/liste` → `ListePage`
- `/menue` → `MenuPage`
- `/login`, `/registrierung`, `/passwort-reset` → Public
- Alle anderen → AuthGuard → KartePage

**Akzeptanzkriterien:**
- Navigation zwischen allen 5 Tabs funktioniert
- Offline-Banner erscheint bei deaktiviertem WLAN
- App funktioniert auf Viewport 375px (iPhone SE) ohne horizontalen Scroll

---

### TASK-007 – PWA-Konfiguration

**Abhängigkeiten:** TASK-006

**Beschreibung:**
App als vollwertige Progressive Web App konfigurieren.

**Zu bearbeiten:** `vite.config.ts`, `public/manifest.json`

**`vite.config.ts`** – `vite-plugin-pwa` konfigurieren:
- `registerType: 'autoUpdate'`
- App Shell cachen: `index.html`, alle JS/CSS Bundles
- Workbox `runtimeCaching`:
  - OSM-Tile-URLs (`tile.openstreetmap.org`): `CacheFirst`, max. 500 Einträge, 30 Tage
  - Open-Meteo API: `NetworkFirst`, Fallback auf Cache
  - Supabase-API-Calls: `NetworkOnly` (nie cachen – sensible Daten)

**`public/manifest.json`:**
```json
{
  "name": "JagdPlaner",
  "short_name": "JagdPlaner",
  "theme_color": "#2d5016",
  "background_color": "#1a1a1a",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "icons": [...]
}
```
- Icons in 192×192 und 512×512 px (Hirsch-Silhouette auf Waldgrün)
- `apple-touch-icon` für iOS

**Akzeptanzkriterien:**
- Lighthouse PWA-Audit: alle Checks grün
- "Zum Homescreen hinzufügen" auf Android Chrome und iOS Safari funktioniert
- App startet ohne Netz (zeigt gecachten App Shell)

---

### TASK-008 – Revier-CRUD & Store

**Abhängigkeiten:** TASK-004, TASK-002, TASK-006

**Beschreibung:**
Reviere anlegen, bearbeiten und löschen. Aktives Revier global im Store verwalten.

**Zu erstellen:**
- `src/store/useRevierStore.ts`
- `src/components/revier/RevierForm.tsx`
- `src/components/revier/RevierWechsler.tsx`
- `src/hooks/useRevier.ts`

**`useRevierStore`:**
- State: `reviere: Revier[]`, `activeRevier: Revier | null`, `loading: boolean`
- Actions: `loadReviere()`, `setActiveRevier(id)`, `createRevier(data)`, `updateRevier(id, data)`, `deleteRevier(id)`
- Persistenz: aktives Revier-ID in `localStorage`

**`RevierForm.tsx`:**
- Felder: Name (Pflicht), Beschreibung, Wildarten (Multi-Select: Rehwild, Schwarzwild, Rotwild, Fuchs, Hase, Fasan, ...), Zeitzone (Default: Europe/Berlin)
- Validierung via `RevierSchema`
- Erstellen und Bearbeiten (gleicher Component mit optionalem `revierId` prop)

**`RevierWechsler.tsx`:**
- Dropdown/Sheet im App-Header
- Listet alle Reviere des Users
- "Neues Revier anlegen" Option
- Zeigt Name und Mitglieder-Anzahl des aktiven Reviers

**Onboarding:**
- Nach erster Registrierung und Login: automatisch Modal "Erstes Revier anlegen" öffnen wenn `reviere.length === 0`

**Akzeptanzkriterien:**
- Revier anlegen, umbenennen, löschen (mit Bestätigungs-Dialog)
- `setActiveRevier()` aktualisiert alle Daten in der App
- Leerer Zustand ("Noch kein Revier") zeigt Onboarding-Aufforderung

---

### TASK-009 – Mitglieder-Einladung & Rollen

**Abhängigkeiten:** TASK-008

**Beschreibung:**
Andere User in ein Revier einladen und Rollen zuweisen.

**Zu erstellen:**
- `src/components/revier/MitgliederVerwaltung.tsx`
- Supabase Edge Function: `invite-member` (oder client-seitige Magic-Link-Logik)

**`MitgliederVerwaltung.tsx`:**
- Liste aller Mitglieder mit Name, Email, Rolle, Status (aktiv/ausstehend)
- Einladen: Email-Eingabe + Rollenwahl (Pächter, Jagdgast, Beobachter)
- Einladungs-Flow:
  1. Supabase `inviteUserByEmail()` mit `redirectTo` → App-URL mit `?revier_id=...`
  2. Neuer User registriert sich und wird automatisch Mitglied
  3. Bestehender User klickt Link → direkt Mitglied
- Rolle ändern: Dropdown direkt in der Zeile
- Mitglied entfernen: mit Bestätigung (Eigentümer kann sich nicht selbst entfernen)

**Rollen und Berechtigungen:**
```typescript
const ROLE_PRESETS = {
  eigentuemer:  { ansitze_erstellen: true, einrichtungen_verwalten: true, mitglieder_einladen: true, statistiken_sehen: true, revier_bearbeiten: true },
  paechter:     { ansitze_erstellen: true, einrichtungen_verwalten: true, mitglieder_einladen: true, statistiken_sehen: true, revier_bearbeiten: true },
  jagdgast:     { ansitze_erstellen: true, einrichtungen_verwalten: false, mitglieder_einladen: false, statistiken_sehen: true, revier_bearbeiten: false },
  beobachter:   { ansitze_erstellen: false, einrichtungen_verwalten: false, mitglieder_einladen: false, statistiken_sehen: true, revier_bearbeiten: false },
}
```

**`src/hooks/usePermissions.ts`:**
- Liest `revier_mitglieder` für aktuellen User + aktives Revier
- Gibt `Berechtigungen`-Objekt zurück
- Exported Hilfsfunktionen: `canCreateAnsitz()`, `canManageEinrichtungen()`, etc.

**Akzeptanzkriterien:**
- Einladungs-Email wird versendet (Supabase Log prüfen)
- Neues Mitglied sieht Revier nach Registrierung
- Jagdgast sieht "Einrichtung bearbeiten" Button nicht (`canManageEinrichtungen()` → false)

---

### TASK-010 – Wetter-API & Mondphasen-Bibliothek

**Abhängigkeiten:** TASK-001

**Beschreibung:**
Utility-Funktionen für Wetterdaten (Open-Meteo) und astronomische Daten (SunCalc).

**Zu erstellen:**
- `src/lib/wetter.ts`
- `src/lib/mondphase.ts`
- `src/hooks/useWeatherData.ts`
- `src/hooks/useGeolocation.ts`

**`src/lib/wetter.ts`:**
```typescript
// Fetch cache: Map<string, { data: WetterDaten, timestamp: number }>
// Cache key: `${lat.toFixed(2)}_${lng.toFixed(2)}_${hourISO}`
// Cache TTL: 15 minutes

export async function fetchCurrentWeather(lat: number, lng: number): Promise<WetterDaten>
// Open-Meteo URL:
// https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}
// &hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover,pressure_msl
// &timezone=Europe/Berlin&forecast_days=1
// Helpers:
// windDegToCardinal(deg): 'N'|'NE'|'E'|'SE'|'S'|'SW'|'W'|'NW'
// windSpeedToBeaufort(kmh): 0-12

export function getManualFallbackData(): Partial<WetterDaten>
// Returns empty object – UI then shows manual input fields
```

**`src/lib/mondphase.ts`:**
```typescript
import SunCalc from 'suncalc'

export function getMoonPhase(date: Date): 'neumond' | 'zunehmend' | 'vollmond' | 'abnehmend'
// SunCalc.getMoonIllumination(date).phase → 0-1
// 0-0.1: neumond, 0.1-0.5: zunehmend, 0.5-0.6: vollmond, 0.6-1: abnehmend

export function getSunTimes(lat: number, lng: number, date: Date): {
  sunrise: Date, sunset: Date, dawn: Date, dusk: Date
}
// SunCalc.getTimes(date, lat, lng)
```

**`src/hooks/useGeolocation.ts`:**
- `navigator.geolocation.getCurrentPosition()` mit Promise-Wrapper
- State: `position: {lat, lng} | null`, `loading`, `error`
- Watch-Mode optional für Live-Tracking

**Akzeptanzkriterien:**
- `fetchCurrentWeather(48.1, 11.5)` gibt valide `WetterDaten` zurück
- Zweiter Aufruf innerhalb 15 Min liefert gecachtes Ergebnis (kein API-Call)
- `getMoonPhase(new Date())` gibt einen der 4 Werte zurück

---

### TASK-011 – IndexedDB Offline-Speicher

**Abhängigkeiten:** TASK-002

**Beschreibung:**
Lokale Datenbank für Offline-Betrieb und Sync-Queue implementieren.

**Zu erstellen:** `src/lib/indexeddb.ts`

**Datenbankschema (via `idb`):**
- DB-Name: `jagdplaner-db`, Version: 1
- Object Stores:
  - `ansitze` (keyPath: `id`) – laufende und abgeschlossene Ansitze
  - `beobachtungen` (keyPath: `id`, index: `ansitz_id`)
  - `einrichtungen` (keyPath: `id`, index: `revier_id`)
  - `sync_queue` (keyPath: `id`) – ausstehende Schreiboperationen

**Exportierte Funktionen:**
```typescript
// Ansitze
saveAnsitz(ansitz: Ansitz): Promise<void>
getAnsitz(id: string): Promise<Ansitz | undefined>
getAllAnsitze(revierId: string): Promise<Ansitz[]>
deleteAnsitz(id: string): Promise<void>

// Beobachtungen
saveBeobachtung(b: Beobachtung): Promise<void>
getObservationsForAnsitz(ansitzId: string): Promise<Beobachtung[]>

// Einrichtungen (read cache)
saveEinrichtungen(list: Ansitzeinrichtung[]): Promise<void>
getEinrichtungen(revierId: string): Promise<Ansitzeinrichtung[]>

// Sync queue
addToSyncQueue(operation: SyncOperation): Promise<void>
getPendingSyncOperations(): Promise<SyncOperation[]>
removeSyncOperation(id: string): Promise<void>
```

**Sync-Logik (in `syncPendingOperations()`):**
- Iterates over pending sync queue
- Führt die jeweilige Supabase-Operation aus
- Bei Erfolg: aus Queue löschen
- Bei 409 Conflict: Last-Write-Wins + User-Toast "Daten wurden aktualisiert"
- Wird aufgerufen wenn `navigator.onLine` → `true`

**Akzeptanzkriterien:**
- Ansitz im Offline-Modus speichern → nach Reconnect in Supabase sichtbar
- IndexedDB-Inhalt überlebt App-Neustart
- Sync-Queue zeigt 0 Einträge nach erfolgreicher Synchronisation

---

### TASK-012 – Leaflet-Revierkarte

**Abhängigkeiten:** TASK-006, TASK-002

**Beschreibung:**
Interaktive Karte als Kern-Component der App mit OSM-Tiles und GPS-Ortung.

**Zu erstellen:**
- `src/components/karte/RevierMap.tsx`
- `src/components/karte/UserPosition.tsx`
- `src/components/karte/RevierBoundary.tsx`
- `src/pages/KartePage.tsx` (vollständig)

**`RevierMap.tsx`:**
- `MapContainer` mit OSM TileLayer (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
- Default-Center: Deutschland-Mitte (51.1, 10.4), Zoom 13
- Touch-Gesten aktiviert (pinch-to-zoom, tap)
- Props: `children` (Marker etc.), `onMapClick?: (latlng) => void` (für Einrichtung hinzufügen)

**`UserPosition.tsx`:**
- Floating-Button unten rechts: "GPS"
- Bei Tap: `useGeolocation()` aufrufen → Karte zur Position fliegen
- Zeigt blauen Punkt am Standort (Leaflet `CircleMarker`)

**`RevierBoundary.tsx`:**
- Stellt GeoJSON-Polygon des Reviers dar (falls `aktives_revier.grenze_geojson` gesetzt)
- Gestrichelter Waldgrün-Rand, leicht transparente Füllung
- Read-Only im MVP (kein Einzeichnen nötig – kann als Freitext-GeoJSON in RevierForm eingegeben werden)

**`KartePage.tsx`:**
- Rendert `<RevierMap>` mit allen bekannten Einrichtungen als Marker (aus TASK-013)
- FAB (Floating Action Button) "Einrichtung hinzufügen" – aktiviert Map-Click-Modus
- Wenn kein Revier: leere State mit CTA "Revier anlegen"

**Akzeptanzkriterien:**
- Karte lädt und zeigt OSM-Tiles
- GPS-Button zentriert auf aktuelle Position
- Map-Click im Add-Modus emittiert Koordinaten korrekt

---

### TASK-013 – Ansitzeinrichtungen CRUD

**Abhängigkeiten:** TASK-012, TASK-008, TASK-009, TASK-011

**Beschreibung:**
Ansitzeinrichtungen auf der Karte anlegen, anzeigen, bearbeiten und löschen.

**Zu erstellen:**
- `src/components/karte/AnsitzMarker.tsx`
- `src/components/einrichtungen/EinrichtungForm.tsx`
- `src/components/einrichtungen/EinrichtungPopup.tsx`
- `src/hooks/useEinrichtungen.ts`

**`useEinrichtungen.ts`:**
- Lädt Einrichtungen für aktives Revier aus Supabase
- Cacht in IndexedDB (`saveEinrichtungen`)
- Offline: lädt aus IndexedDB
- CRUD-Operationen: `create()`, `update()`, `remove()`

**`AnsitzMarker.tsx`:**
- Leaflet `Marker` mit Custom SVG-Icon je nach `typ`:
  - `hochsitz`: Turm-Icon
  - `kanzel`: Zelt-Icon
  - `ansitzleiter`: Leiter-Icon
  - `bodensitz` / `sonstige`: Punkt-Icon
- Icon-Randfarbe nach `zustand`:
  - `gut`: `#22c55e` (Grün)
  - `mittel`: `#eab308` (Gelb)
  - `schlecht`: `#f97316` (Orange)
  - `gesperrt`: `#ef4444` (Rot)
- Bei Tap: öffnet `EinrichtungPopup`

**`EinrichtungForm.tsx`:**
- Felder: Typ (Select), Name (Text), Beschreibung (Textarea), GPS-Position (wird vom Map-Click befüllt, alternativ "aktuelle Position"), Ausrichtung (0–360°, Slider), Sichtweite (m), Höhe (m), Günstige Windrichtungen (Multi-Select: N, NE, E, SE, S, SW, W, NW), Zustand (Select), Notizen
- Validierung via `AnsitzeinrichtungSchema`
- Öffnet als Bottom-Sheet (Mobile) oder Dialog (Desktop)
- Marker auf Karte ist im Edit-Modus verschiebbar → Koordinaten aktualisieren sich

**`EinrichtungPopup.tsx`:**
- Leaflet Popup oder Bottom-Sheet
- Zeigt: Name, Typ, Zustand, letzte Wartung, Notizen
- Quick-Actions:
  - "Ansitz starten" → navigiert zu `/ansitz?einrichtung_id=...`
  - "Bearbeiten" → öffnet `EinrichtungForm` (nur wenn `canManageEinrichtungen()`)
  - "Navigation" → `geo:`-URI / Apple Maps / Google Maps Deep-Link
  - "Löschen" → Bestätigungs-Dialog (nur Eigentümer/Pächter)

**Akzeptanzkriterien:**
- Karten-Tap im Add-Modus öffnet Formular mit vorausgefüllten Koordinaten
- Nach Speichern erscheint Marker sofort auf der Karte
- Marker verschieben aktualisiert Koordinaten in DB
- Offline angelegte Einrichtung wird nach Reconnect synchronisiert

---

### TASK-014 – Offline-Karten-Caching

**Abhängigkeiten:** TASK-007, TASK-012

**Beschreibung:**
OSM-Kartenausschnitt rund um alle Ansitzeinrichtungen des aktiven Reviers für den Offline-Betrieb vorcachen.

**Zu bearbeiten:** `vite.config.ts` (Workbox-Konfiguration), `src/pages/MenuPage.tsx`

**Workbox Tile-Caching:**
- Bereits in TASK-007 konfiguriert (CacheFirst für `tile.openstreetmap.org`)
- Zusätzlich: Strategie `StaleWhileRevalidate` für Zoom-Level < 14 (Überblicks-Kacheln)

**"Karte vorausladen" Funktion in `MenuPage.tsx`:**
```typescript
async function preloadMap(einrichtungen: Ansitzeinrichtung[]) {
  // Calculate bounding box of all Einrichtungen + 5km buffer
  // Calculate all tile URLs for zoom levels 12–16
  // fetch() each URL → cached automatically by service worker
  // Progress: "47 / 234 Kacheln geladen"
}
```
- Button: "Karte für Offline speichern" mit Fortschritts-Anzeige
- Warnung wenn > 200 Tiles (Speicherverbrauch-Hinweis)

**Akzeptanzkriterien:**
- Nach "Karte vorausladen" im Flugmodus: Karte zeigt Tiles für das Revier
- Zoom-Level 14–16 im Revier sind offline verfügbar

---

### TASK-015 – Ansitz-Erfassung Flow

**Abhängigkeiten:** TASK-013, TASK-010, TASK-011

**Beschreibung:**
Vollständiger Ansitz-Workflow: starten, Beobachtungen erfassen, Abschuss eintragen, beenden.

**Zu erstellen:**
- `src/store/useAnsitzStore.ts`
- `src/components/ansitz/AnsitzStarten.tsx`
- `src/components/ansitz/AnsitzTimer.tsx`
- `src/components/ansitz/BeobachtungForm.tsx`
- `src/components/ansitz/AbschussForm.tsx`
- `src/hooks/useAnsitz.ts`
- `src/pages/AnsitzPage.tsx`

**`useAnsitzStore`:**
- State: `activeAnsitz: Ansitz | null`, `observations: Beobachtung[]`
- Persistiert in IndexedDB (überlebt App-Neustart/Absturz)
- Actions: `startAnsitz()`, `endAnsitz()`, `addObservation()`, `setAbschuss()`

**`AnsitzStarten.tsx`:**
- Einrichtung auswählen: Dropdown, sortiert nach "zuletzt genutzt"
- Startzeit: Jetzt (Default) oder manuell wählbar
- Wetterdaten: automatisch abrufen (via `useWeatherData`) – bei Fehler: manuelle Eingabefelder anzeigen
- Mondphase und Sonnenuntergang automatisch berechnen (`getMoonPhase()`, `getSunTimes()`)
- Großflächiger "Ansitz starten" Button (min. 64px Höhe)

**`AnsitzTimer.tsx`:**
- Zeigt laufende Dauer (HH:MM:SS)
- Kompakte Wetter-Anzeige (Temperatur, Wind, Mondphase)
- Liste der bisherigen Beobachtungen (als Chips: "🦌 2x Rehwild 18:05")
- Buttons: "Beobachtung erfassen" (öffnet `BeobachtungForm`), "Abschuss" (öffnet `AbschussForm`), "Ansitz beenden"

**`BeobachtungForm.tsx`:**
- Pflichtfelder: Wildart (Dropdown mit Favoriten oben: Rehwild, Schwarzwild, Rotwild, Fuchs, Hase, Fasan, Sonstige), Anzahl (Stepper –/+)
- Optionalfelder: Geschlecht (m/w/gemischt), Verhalten (äsend/ziehend/flüchtig/ruhend), Entfernung (m), Notiz
- Uhrzeit: automatisch (aktuelle Zeit), bearbeitbar
- Bottom-Sheet, mit einer Hand bedienbar

**`AbschussForm.tsx`:**
- Wildart, Geschlecht, Alter (Jahre, Stepper), Gewicht (kg)
- Entfernung (m), Waffe/Kaliber (Text), Trefferlage (Text)
- Uhrzeit: automatisch
- GPS-Position: automatisch (`useGeolocation`)
- Foto: `<input type="file" accept="image/*" capture="environment">` (öffnet Kamera direkt)
- Nachsuche nötig: Toggle

**Ansitz beenden:**
- Zusammenfassung: Dauer, Anzahl Beobachtungen, Abschuss ja/nein
- Bewertung: "War der Ansitz erfolgreich?" (Ja/Nein – wichtig für künftiges ML)
- Optionale Schluss-Notiz
- Speichern → Supabase (oder IndexedDB wenn offline)

**Akzeptanzkriterien:**
- Kompletter Flow Starten → Beobachtung → Abschuss → Beenden funktioniert
- Laufender Ansitz übersteht App-Neustart (Daten aus IndexedDB wiederhergestellt)
- Offline-Ansitz wird nach Reconnect zu Supabase synchronisiert
- Formular komplett mit einer Hand auf Smartphone bedienbar (alle Tap-Targets ≥ 44px)

---

### TASK-016 – Statistiken & Dashboard

**Abhängigkeiten:** TASK-015, TASK-008

**Beschreibung:**
Basis-Auswertungen und Charts für das aktive Revier.

**Zu erstellen:**
- `src/components/statistiken/Dashboard.tsx`
- `src/components/statistiken/AnsitzListe.tsx`
- `src/components/statistiken/ErfolgChart.tsx`
- `src/pages/StatistikenPage.tsx`
- `src/pages/ListePage.tsx`

**`Dashboard.tsx`:**
- KPI-Karten (aktueller Monat): Anzahl Ansitze, Erfolgsquote (%), Total Beobachtungen, Anzahl Abschüsse
- Letzte 5 Ansitze: kompakte Zeilen (Datum, Einrichtung, Dauer, Erfolg-Icon)
- Balkendiagramm (Recharts `BarChart`): Beobachtungen nach Wildart, aktueller Monat
- Beste Uhrzeit: "Die meisten Beobachtungen waren um 18–19 Uhr" (berechnet aus `beobachtungen.uhrzeit`)

**`ErfolgChart.tsx`:**
- Recharts `LineChart`: Erfolgsquote (%) der letzten 12 Monate
- X-Achse: Monatskürzel (Jan–Dez), Y-Achse: 0–100%
- Tooltip: "März: 3 von 7 Ansitzen erfolgreich (43%)"

**`AnsitzListe.tsx`:**
- Chronologische Liste (neueste zuerst)
- Jede Card zeigt: Datum + Uhrzeit, Einrichtungsname, Dauer, Erfolg-Badge (grün/grau), Wildart-Chips aus Beobachtungen
- Filter-Bar: Einrichtung (Dropdown), Monat (Month-Picker), Nur Erfolge (Toggle)
- Tap auf Card → Detailansicht (alle Felder, Wetterdaten, Abschuss-Details)

**`StatistikenPage.tsx`:** rendert `Dashboard` + `ErfolgChart`
**`ListePage.tsx`:** rendert `AnsitzListe`

**Akzeptanzkriterien:**
- Dashboard zeigt korrekte KPIs (mit 0 Ansitzen: leerer State mit Hinweis)
- Filter in AnsitzListe funktionieren kombinierbar
- Charts rendern auf Mobile ohne Überlauf

---

### TASK-017 – Deployment & Error-Tracking

**Abhängigkeiten:** TASK-007, TASK-016

**Beschreibung:**
App auf Vercel deployen und Error-Tracking einrichten.

**Schritte:**

**Vercel:**
1. GitHub-Repository mit Vercel verbinden
2. Build-Kommando: `npm run build`, Output-Verzeichnis: `dist`
3. Umgebungsvariablen setzen: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Preview-Deployments für alle Branches aktivieren
5. Production-Domain konfigurieren

**Supabase Production:**
1. Automatische Backups aktivieren (täglich)
2. Connection Pooling aktivieren
3. Auth: Redirect-URLs auf Production-Domain setzen

**Sentry:**
1. `@sentry/react` installieren
2. `Sentry.init()` in `main.tsx` (nur wenn `import.meta.env.PROD`)
3. `VITE_SENTRY_DSN` als Umgebungsvariable
4. `Sentry.ErrorBoundary` um `<App>` wrappen

**Lighthouse-Audit:**
- PWA Score ≥ 90
- Performance ≥ 80
- Accessibility ≥ 90

**Akzeptanzkriterien:**
- App unter `https://jagdplaner.app` (oder Subdomain) erreichbar
- Push auf `main` deployt automatisch
- JavaScript-Fehler in Sentry sichtbar
- Lighthouse PWA Score ≥ 90

---

## Task-Abhängigkeiten (Ausführungsreihenfolge)

```
TASK-001 (Scaffold) ──┬──▶ TASK-002 (Typen)
                      │
                      ├──▶ TASK-004 (Supabase Client) ◀── TASK-003 (DB-Schema)
                      │         │
                      │         ▼
                      │    TASK-005 (Auth-UI)
                      │         │
                      │         ▼
                      │    TASK-006 (App-Shell)
                      │         │
                      ├──────── ▼
                      │    TASK-007 (PWA) ────────────────────────────────┐
                      │         │                                         │
                      │    TASK-008 (Revier-CRUD) ◀── TASK-004, 002, 006 │
                      │         │                                         │
                      │    TASK-009 (Mitglieder) ◀── TASK-008            │
                      │         │                                         │
                      │    TASK-010 (Wetter/Mond) ◀── TASK-001           │
                      │                                                   │
                      │    TASK-011 (IndexedDB) ◀── TASK-002             │
                      │                                                   │
                      │    TASK-012 (Karte) ◀── TASK-006, 002            │
                      │         │                                         │
                      │    TASK-013 (Einrichtungen) ◀─ 012,008,009,011   │
                      │         │                                         │
                      │    TASK-014 (Offline Tiles) ◀── TASK-007, 012 ◀──┘
                      │
                      │    TASK-015 (Ansitz-Flow) ◀── TASK-013, 010, 011
                      │         │
                      │    TASK-016 (Statistiken) ◀── TASK-015, 008
                      │         │
                      └────▶ TASK-017 (Deployment) ◀── TASK-007, 016
```

**Parallel ausführbar (keine gegenseitigen Abhängigkeiten):**
- TASK-002 und TASK-003 (beide starten nach TASK-001)
- TASK-010 (Wetter/Mond) parallel zu TASK-008/009/012
- TASK-011 (IndexedDB) parallel zu TASK-008/009/012

## Task-Übersicht

| ID | Titel | Abhängigkeiten | Kritischer Pfad |
|---|---|---|---|
| TASK-001 | Projekt-Scaffold | – | ✓ |
| TASK-002 | TypeScript-Typen & Zod-Schemas | 001 | ✓ |
| TASK-003 | Supabase-Datenbankschema | – | ✓ |
| TASK-004 | Supabase Client & Auth-Store | 001, 003 | ✓ |
| TASK-005 | Auth-UI | 004, 002 | ✓ |
| TASK-006 | App-Shell & Navigation | 005 | ✓ |
| TASK-007 | PWA-Konfiguration | 006 | ✓ |
| TASK-008 | Revier-CRUD & Store | 004, 002, 006 | ✓ |
| TASK-009 | Mitglieder-Einladung & Rollen | 008 | – |
| TASK-010 | Wetter-API & Mondphasen | 001 | – |
| TASK-011 | IndexedDB Offline-Speicher | 002 | – |
| TASK-012 | Leaflet-Revierkarte | 006, 002 | ✓ |
| TASK-013 | Ansitzeinrichtungen CRUD | 012, 008, 009, 011 | ✓ |
| TASK-014 | Offline-Karten-Caching | 007, 012 | – |
| TASK-015 | Ansitz-Erfassung Flow | 013, 010, 011 | ✓ |
| TASK-016 | Statistiken & Dashboard | 015, 008 | ✓ |
| TASK-017 | Deployment & Error-Tracking | 007, 016 | ✓ |
