# JagdPlaner – Implementierungsfortschritt

> Dieses File trackt den Umsetzungsstand des MVP (definiert in MVP.md).
> Beim Fortführen: letzten offenen Task lesen, Kontext aus "Notizen" nehmen, weitermachen.

---

## Status-Legende

- `✅ done` – Task abgeschlossen, Code committed
- `🔄 in-progress` – Aktuell in Arbeit
- `⏳ pending` – Wartet auf Abhängigkeiten
- `🔲 todo` – Noch nicht begonnen

---

## Task-Status

| ID | Titel | Status | Commit |
|---|---|---|---|
| TASK-001 | Projekt-Scaffold | ✅ done | 64c0568 |
| TASK-002 | TypeScript-Typen & Zod-Schemas | ✅ done | 8261924 |
| TASK-003 | Supabase-Datenbankschema | ✅ done | 8261924 |
| TASK-004 | Supabase Client & Auth-Store | ✅ done | fcdf024 |
| TASK-005 | Auth-UI | ✅ done | ff20900 |
| TASK-006 | App-Shell & Navigation | ✅ done | 89d0952 |
| TASK-007 | PWA-Konfiguration | ✅ done | 3309ad9 |
| TASK-008 | Revier-CRUD & Store | ✅ done | c365304 |
| TASK-009 | Mitglieder-Einladung & Rollen | ✅ done | 4a60716 |
| TASK-010 | Wetter-API & Mondphasen | ✅ done | e3c17e1 |
| TASK-011 | IndexedDB Offline-Speicher | ✅ done | 7005ec3 |
| TASK-012 | Leaflet-Revierkarte | ✅ done | 418949d |
| TASK-013 | Ansitzeinrichtungen CRUD | ✅ done | 980e1be |
| TASK-014 | Offline-Karten-Caching | ✅ done | 4976acd |
| TASK-015 | Ansitz-Erfassung Flow | ✅ done | 198df1c |
| TASK-016 | Statistiken & Dashboard | ✅ done | 7c956cc |
| TASK-017 | Deployment & Error-Tracking | ✅ done | – |
| TASK-018 | Rebranding & SEO (AnsitzPlaner) | ✅ done | e3057fd |
| TASK-019 | FTP-Deploy-Script (serverprofis.de) | ✅ done | 9b2541c |
| TASK-020 | Rechtliches: Impressum, Datenschutz, Cookie-Consent | ✅ done | bf5cc73 |
| TASK-021 | Heatmap-Berechnungslogik (statistisch) | ✅ done | – |
| TASK-022 | Heatmap-Overlay auf Karte | ✅ done | – |
| TASK-023 | Vorhersage-Widget & Tages-Empfehlung | ✅ done | – |
| TASK-024 | GPS UserPosition-Button auf Karte | ✅ done | – |
| TASK-025 | 7-Tage-Wetterplanung | 🔲 todo | – |
| TASK-026 | Statistiken Phase 2 | 🔲 todo | – |

---

## MVP vollständig implementiert ✅

Alle 17 MVP-Tasks sind erledigt. TASK-018–020 (Rebranding, Deployment, Rechtliches) sind ebenfalls abgeschlossen. **App ist Go-Live-ready.**

---

## Phase 2 – Heatmap & Intelligente Vorhersage

Die Hauptdifferenzierung gegenüber einfachen Jagdtagebuch-Apps. Hängt von gesammelten Ansitz-Daten ab — je mehr Daten, desto genauer die Vorhersage.

### Architektur-Entscheidung: kein TensorFlow.js in Phase 2a

Phase 2 nutzt **regelbasierte Statistik** (reicht für <200 Ansitze, ist vollständig offline, sofort erklärbar). TensorFlow.js wird in Phase 3 ergänzt sobald >500 Ansitze pro Revier vorliegen.

| ID | Titel | Status | Abhängigkeit |
|---|---|---|---|
| TASK-021 | Heatmap-Berechnungslogik (statistisch) | ✅ done | TASK-015 |
| TASK-022 | Heatmap-Overlay auf Karte | ✅ done | TASK-021 |
| TASK-023 | Vorhersage-Widget & Tages-Empfehlung | ✅ done | TASK-021 |
| TASK-024 | GPS UserPosition-Button auf Karte | ✅ done | – |
| TASK-025 | 7-Tage-Wetterplanung | 🔲 todo | TASK-010 |
| TASK-026 | Statistiken Phase 2 (Tageszeit-Chart, Mond) | 🔲 todo | TASK-016 |

---

## TASK-021 – Heatmap-Berechnungslogik (statistisch, client-side)

**Ziel**: Für jede Ansitzeinrichtung des aktiven Reviers eine Erfolgswahrscheinlichkeit berechnen – basierend auf historischen Ansitz-Daten, Tageszeit, Monat, Wetter und Jagddruck.

**Prüfkriterien**:
- `calculateHeatmapScores()` gibt für jede Einrichtung einen Score 0–100 zurück
- Mit 0 Ansitzen: Fallback-Score 50 (neutral)
- Mit 5 Ansitzen, alle erfolgreich um 18 Uhr: Score für 18 Uhr signifikant > Score für 10 Uhr
- `tsc --noEmit` grün

**Zu erstellen**: `src/lib/heatmap.ts`, `src/hooks/useHeatmap.ts`

### Score-Berechnung (regelbasiert, kein ML)

```
finalScore = baseScore × wetterFaktor × mondFaktor × jagddruckFaktor
```

**baseScore** (aus historischen Daten, 0–100):
- Filtere alle Ansitze an dieser Einrichtung
- Filtere nach aktuellem Monat ± 1 (Saisonalität)
- Filtere nach Tagesstunde ± 1
- `baseScore = (erfolgreicheAnsitze / alleAnsitze) × 100`
- Falls < 5 Datenpunkte: `baseScore = 50` (Unsicherheit → neutral)

**wetterFaktor** (Multiplikator 0.5 – 1.5):
- Windrichtung passt zu günstigen Windrichtungen der Einrichtung: +20%
- Niederschlag > 2mm: −20%
- Temperatur 5–15°C: +10%
- Bewölkung 30–70%: +5% (diffuses Licht, Wild aktiver)

**mondFaktor** (Multiplikator 0.8 – 1.1):
- Neumond: +10% (Wild aktiver in Dunkelheit)
- Vollmond: −15% (Wild tagsüber ruhiger, nachts aktiv aber schwerer bejagbar)
- Zunehmend/Abnehmend: neutral

**jagddruckFaktor** (Multiplikator 0.7 – 1.2):
- Ruhephase: Tage seit letztem Ansitz an dieser Einrichtung
  - ≥ 7 Tage: +20% (Wild hat sich erholt)
  - 3–6 Tage: neutral
  - < 3 Tage: −30% (Wild ist scheu)

### Dateien

`src/lib/heatmap.ts`:
```typescript
export interface HeatmapScore {
  einrichtungId: string
  score: number          // 0–100
  datenpunkte: number    // Anzahl Ansitze als Basis
  faktoren: {
    basis: number
    wetter: number       // Multiplikator
    mond: number
    jagddruck: number
  }
}

export function calculateHeatmapScores(
  einrichtungen: Ansitzeinrichtung[],
  ansitze: Ansitz[],
  params: {
    monat: number        // 1-12 (aktuell)
    stundeVon: number    // Tageszeit-Filter
    stundeBis: number
    wildart: Wildart | 'alle'
    wetter: Partial<WetterDaten>
    mondphase: string
    aktuellesDatum: Date
  }
): HeatmapScore[]
```

`src/hooks/useHeatmap.ts`:
- Lädt Ansitze + Einrichtungen, ruft `calculateHeatmapScores()` auf
- Params: `{ wildart, stundeVon, stundeBis }` — steuerbar aus UI
- Ergebnis gecacht in `useMemo`

---

## TASK-022 – Heatmap-Overlay auf Revierkarte

**Ziel**: Sichtbare Farbdarstellung der Erfolgswahrscheinlichkeit pro Einrichtung auf der Karte. Toggle-Button + Filter. Tap auf Einrichtung zeigt Erklärung.

**Prüfkriterien**:
- Toggle "Heatmap" ein/aus — Marker-Farbe ändert sich ohne Reload
- Filter Wildart + Uhrzeit-Schieberegler funktionieren
- Bei < 5 Datenpunkten: grauer Marker mit "Zu wenig Daten"
- Tipp auf Marker → Popup mit Score-Erklärung (wie unter 4.4 beschrieben)
- Mobile: Filter als Bottom-Sheet

**Zu erstellen/bearbeiten**:
- `src/components/karte/HeatmapOverlay.tsx` — Leaflet CircleMarker je Einrichtung
- `src/components/karte/HeatmapFilterBar.tsx` — Wildart-Select + Uhrzeit-Slider
- `src/pages/KartePage.tsx` — Toggle-Button + Integration

### Visualisierung

Jede Einrichtung bekommt einen halb-transparenten `CircleMarker` (Radius 40–80m) zusätzlich zum bestehenden Marker:

| Score | Farbe | Bedeutung |
|---|---|---|
| 75–100 | `#22c55e` Grün | Hohe Erfolgsaussicht |
| 50–74 | `#eab308` Gelb | Mittlere Aussicht |
| 25–49 | `#f97316` Orange | Niedrig |
| 0–24 | `#ef4444` Rot | Ungünstig |
| – | `#9ca3af` Grau | Zu wenig Daten |

Popup-Inhalt beim Tap:
```
📍 Hochsitz Eicheneck
Erfolgswahrscheinlichkeit: 68%
Basierend auf 9 Ansitzen

Faktoren:
✓ Günstige Tageszeit (Dämmerung)   +22%
✓ Windrichtung passt (SW)          +15%
✗ Hoher Jagddruck (2 Tage Ruhe)    −28%
~ Mondphase neutral

Empfehlung: Heute 17:45–19:15 Uhr
```

---

## TASK-023 – Vorhersage-Widget & Tages-Empfehlung

**Ziel**: Auf der Ansitz-Startseite (AnsitzPage) wird vor dem Starten des Ansitzes angezeigt: **welche Einrichtung heute das beste Potenzial hat und zu welcher Uhrzeit.**

**Prüfkriterien**:
- Widget zeigt Top-3-Einrichtungen mit Score für den aktuellen Tag
- Uhrzeit-Empfehlung ("Beste Zeit heute: 17:45–19:15 Uhr") basiert auf Score-Maximum über Stunden
- Wetter-Faktoren werden verständlich erklärt
- Mit 0 Ansitzen: Widget zeigt "Noch zu wenig Daten — nach 10 Ansitzen verfügbar"

**Zu erstellen**: `src/components/ansitz/VorhersageWidget.tsx`

### Aufbau

```
┌─────────────────────────────────────────────┐
│ 🎯 Empfehlung für heute                     │
├─────────────────────────────────────────────┤
│  1. Hochsitz Eicheneck     ████████░░  78%  │
│     Beste Zeit: 17:45–19:15 Uhr             │
│                                             │
│  2. Kanzel Waldrand        ██████░░░░  61%  │
│     Beste Zeit: 06:00–07:30 Uhr             │
│                                             │
│  3. Feldansitz Nord        ████░░░░░░  43%  │
│     Beste Zeit: 18:30–19:45 Uhr             │
├─────────────────────────────────────────────┤
│  Wetter heute: 11°C 💨 SW 2Bft 🌛 Zunehmend │
│  [Details anzeigen]                         │
└─────────────────────────────────────────────┘
```

Logik: Berechnet Scores stündlich 0–23 Uhr, findet das Maximum → "Beste Zeit"-Fenster.

---

## TASK-024 – GPS UserPosition-Button auf Karte

**Ziel**: "Wo bin ich?"-Button auf der Karte, zentriert die Karte auf aktuelle GPS-Position und zeigt blauen Punkt.

**Prüfkriterien**:
- Button rechts unten auf Karte (nicht mit Leaflet-Controls überlappend)
- Tap → GPS-Abfrage → Karte fliegt zur Position (`map.flyTo`)
- Blauer `CircleMarker` an aktueller Position
- Bei "Permission denied": Toast "GPS-Zugriff verweigert"

**Zu erstellen**: `src/components/karte/UserPosition.tsx`

---

## TASK-025 – 7-Tage-Wetterplanung

**Ziel**: Im Menü oder auf der Statistiken-Seite: Vorhersage der kommenden 7 Tage mit Empfehlung der besten Jagdtage.

**Prüfkriterien**:
- 7-Tage-Vorhersage aus Open-Meteo (bereits integriert)
- Jeder Tag bekommt einen "Jagd-Score" (0–100) basierend auf Wetter-Faktoren
- Die 2 besten Tage der Woche sind hervorgehoben

**Zu erstellen**: `src/components/statistiken/WetterPlanung.tsx`

---

## TASK-026 – Statistiken Phase 2

**Ziel**: Erweiterte Auswertungen: Tageszeit-Aktivitätsgrafik, Mond-Phasen-Korrelation, Standort-Vergleich.

**Prüfkriterien**:
- Tageszeit-Balkendiagramm (0–23 Uhr, Beobachtungen je Stunde)
- Mondphasen-Erfolgsquoten-Tabelle
- Standort-Rangfolge nach Erfolgsquote

**Zu bearbeiten**: `src/pages/StatistikenPage.tsx`, neue Chart-Komponenten

---



### Hosting

- **Provider**: serverprofis.de (Shared Hosting, Apache)
- **Domains**: `www.ansitzplaner.de` (primär) · `www.pirschplaner.de` (Weiterleitung)
- **Deployment**: FTP-Upload von `dist/` nach jedem Build
- **SPA-Routing**: über `.htaccess` (mod_rewrite)
- **Kein Vercel / Netlify**: manuelles Deploy-Skript statt CI/CD-Pipeline

### Deployment-Checkliste (Go-Live)

- [x] TASK-018 abschließen (Rebranding, SEO-Meta-Tags)
- [x] TASK-019 abschließen (.htaccess, FTP-Script, `./deploy-ftp.sh`)
- [x] TASK-020 abschließen (Impressum, Datenschutz, Cookie-Consent)
- [ ] `.env` mit `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` für Build setzen
- [ ] `npm run build` → `dist/` bauen
- [ ] `./deploy-ftp.sh` → interaktiv FTP-Passwort eingeben, Upload zu serverprofis.de
- [ ] Supabase: Auth-Redirect-URLs auf `https://www.ansitzplaner.de` setzen
- [ ] Supabase: Automatische Backups aktivieren
- [ ] DNS: ansitzplaner.de + pirschplaner.de auf serverprofis.de-IP zeigen lassen
- [ ] SSL: Let's Encrypt / Serverprofis-SSL aktivieren
- [ ] Sentry-Projekt anlegen, DSN als `VITE_SENTRY_DSN` setzen (optional)

---

## TASK-018 – Rebranding & SEO

**Ziel**: App von "JagdPlaner" auf "AnsitzPlaner" umbenennen, Domain `ansitzplaner.de` als kanonische URL verwenden, SEO-Grundlage legen.

**Prüfkriterium**: `npm run typecheck` grün, Meta-Tags in DevTools sichtbar, Lighthouse SEO ≥ 90.

### Schritte

1. **Umbenennen** (überall `JagdPlaner` → `AnsitzPlaner`)
   - `package.json` → `"name": "ansitzplaner"`
   - `index.html` → `<title>AnsitzPlaner</title>` + alle Meta-Tags
   - `vite.config.ts` → PWA manifest `name`, `short_name`
   - `public/manifest.json` → `name`, `short_name`
   - `CLAUDE.md`, `README.md` → Projektnamen aktualisieren

2. **Meta-Tags in `index.html`**
   ```html
   <meta name="description" content="AnsitzPlaner – Jagdplanung mit interaktiver Revierkarte, Wetterintegration und KI-Erfolgsvorhersage. Kostenlos für Jäger in D-A-CH.">
   <meta name="keywords" content="Jagdplaner, Ansitzplaner, Pirschplaner, Jagd App, Revierkarte, Ansitz, Drückjagd">
   <link rel="canonical" href="https://www.ansitzplaner.de/">
   <!-- Open Graph -->
   <meta property="og:title" content="AnsitzPlaner">
   <meta property="og:description" content="Kartenbasierte Jagdplanung für Jäger">
   <meta property="og:url" content="https://www.ansitzplaner.de/">
   <meta property="og:type" content="website">
   <!-- Twitter Card -->
   <meta name="twitter:card" content="summary">
   ```

3. **`public/robots.txt`** anlegen
   ```
   User-agent: *
   Allow: /
   Disallow: /api/
   Sitemap: https://www.ansitzplaner.de/sitemap.xml
   ```

4. **`public/sitemap.xml`** anlegen (statisch, nur öffentliche Seiten)

5. **JSON-LD** Structured Data im `<head>` (SoftwareApplication Schema)

6. **`vercel.json` löschen** (wird durch `.htaccess` in TASK-019 ersetzt)

---

## TASK-019 – FTP-Deploy-Script (serverprofis.de)

**Ziel**: Reproduzierbarer Deploy-Prozess per `./deploy-ftp.sh` — baut die App und lädt `dist/` per `lftp` auf serverprofis.de hoch. Orientiert an bestehendem `deploy-ftp.sh` aus dem ElektroGrundriss-Projekt.

**Voraussetzung**: `lftp` muss installiert sein (`sudo apt-get install lftp` / `brew install lftp`).

**Prüfkriterium**: `./deploy-ftp.sh` lädt alle Dateien hoch; App ist unter `https://www.ansitzplaner.de` erreichbar und SPA-Routing funktioniert (kein 404 bei Reload).

### Schritte

1. **`public/.htaccess`** anlegen (wird beim Build nach `dist/` kopiert):
   ```apache
   Options -Indexes

   # SPA: alle Requests auf index.html umleiten
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>

   # Caching: gehashte Assets → 1 Jahr
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType text/html "access plus 0 seconds"
     ExpiresByType application/javascript "access plus 1 year"
     ExpiresByType text/css "access plus 1 year"
     ExpiresByType image/svg+xml "access plus 1 year"
   </IfModule>

   # Service Worker: kein Cache
   <Files "service-worker.js">
     Header set Cache-Control "no-cache, no-store, must-revalidate"
   </Files>

   # Gzip
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
   </IfModule>
   ```

2. **`deploy-ftp.sh`** anpassen (existiert bereits im Repo, bisher für ElektroGrundriss):
   - `FTP_SERVER` → FTP-Host von serverprofis.de (aus Hosting-Panel ablesen)
   - `FTP_USER` → FTP-Benutzername von serverprofis.de
   - `REMOTE_DIR` → Remote-Zielverzeichnis (z. B. `/ansitzplaner.de` oder `/www/`)
   - Titelzeilen und URL-Ausgabe auf **AnsitzPlaner** / `https://www.ansitzplaner.de` ändern
   - Passwort wird **interaktiv abgefragt** (kein Klartext im Script), `lftp mirror --reverse --delete`

   Kern-Upload-Befehl (bereits bewährt):
   ```bash
   lftp -e "
   set ftp:ssl-allow no;
   set ftp:passive-mode on;
   open -u $FTP_USER,$FTP_PASSWORD -p $FTP_PORT $FTP_SERVER;
   cd $REMOTE_DIR || mkdir -p $REMOTE_DIR;
   mirror --reverse --delete --verbose --exclude-glob .git* --exclude-glob .DS_Store dist/ ./;
   bye
   "
   ```

3. **`vercel.json` löschen** (wird nicht mehr benötigt, Apache-Hosting übernimmt Routing via `.htaccess`)

4. **`package.json`** — `deploy`-Script ergänzen:
   ```json
   "deploy": "bash deploy-ftp.sh"
   ```

5. **`README.md`** — Deploy-Abschnitt ergänzen: `lftp` installieren, `./deploy-ftp.sh` ausführen

---

## TASK-020 – Rechtliches: Impressum, Datenschutz, Cookie-Consent

**Ziel**: App ist DSGVO-konform und TMG-konform, bevor sie unter `ansitzplaner.de` öffentlich erreichbar ist.

**Prüfkriterium**: Impressum unter `/impressum` + Datenschutz unter `/datenschutz` erreichbar; Cookie-Consent-Banner erscheint beim ersten Aufruf; keine Drittanbieter-Cookies ohne Einwilligung.

### Rechtliche Analyse (Stand D-A-CH, 2025)

| Pflicht | Rechtsgrundlage | Umfang |
|---|---|---|
| Impressum | §5 TMG / §25 MedienG (AT) | Name, Anschrift, E-Mail, USt-ID (falls vorhanden) |
| Datenschutzerklärung | DSGVO Art. 13/14 | Verantwortlicher, Zwecke, Rechtsgrundlagen, Drittanbieter |
| Cookie-Banner | DSGVO + ePrivacy | Nur bei nicht-essentiellen Cookies / Tracking nötig |
| Jugendschutz | JuSchG | Jagd-App: keine beson. Altersfreigabe nötig (kein Gewaltbezug) |

**Cookies/Tracking in der App** (Bestandsaufnahme):
- Supabase Auth → `sb-*` Cookies: essenziell (kein Banner nötig, aber erklären)
- Sentry: Fehler-Tracking ohne personenbezogene Daten → erklären, keine Einwilligung nötig (wenn anonymisiert)
- Open-Meteo: kein Tracking, DSGVO-konform
- OpenStreetMap-Tiles: Tile-Server kennt IP → erklären
- **Kein Google Analytics, keine Werbe-Cookies** → kein klassischer Cookie-Banner nötig
- LocalStorage / IndexedDB: technisch notwendig → essenziell

**Ergebnis**: Kein Opt-In-Cookie-Banner zwingend nötig, aber ein einfaches "Diese App verwendet essentielle Cookies" Info-Banner (einmalig) ist Best Practice und rechtlich sicher.

### Schritte

1. **Route `/impressum`** anlegen (`src/pages/ImpressumPage.tsx`)
   - Inhalt: Platzhalter mit allen TMG-Pflichtfeldern, Kommentar "AUSFÜLLEN"
   - Felder: Name/Firma, Straße, PLZ/Ort, E-Mail, ggf. USt-ID, Streitschlichtung EU-Link

2. **Route `/datenschutz`** anlegen (`src/pages/DatenschutzPage.tsx`)
   - Verantwortlicher (Impressumsdaten)
   - Verarbeitete Daten: Standortdaten (nur lokal), Jagddaten (lokal + Supabase optional)
   - Supabase: Daten in EU (Frankfurt), Auftragsverarbeitungsvertrag (DPA) vorhanden
   - Open-Meteo: kein Tracking, Server in Österreich
   - OSM-Tiles: IP-Übermittlung, Open Data
   - Sentry: anonymisiertes Fehler-Tracking (kein Name/E-Mail)
   - Betroffenenrechte: Auskunft, Löschung, Widerspruch (Art. 15-21 DSGVO)

3. **Cookie-Info-Banner** (`src/components/CookieNotice.tsx`)
   - Einmalig beim ersten Aufruf (localStorage Flag)
   - Text: "AnsitzPlaner verwendet ausschließlich technisch notwendige Cookies und lokalen Speicher. Kein Tracking, keine Werbung."
   - Buttons: "Verstanden" (schließt Banner permanent)
   - Kein Opt-In/Opt-Out nötig, da keine nicht-essentiellen Cookies

4. **Footer-Links** in die App-Shell (`src/components/layout/AppShell.tsx` o.ä.)
   - Links zu `/impressum` und `/datenschutz` im Menü / Footer

5. **`App.tsx`** – Routen für `/impressum` und `/datenschutz` ergänzen

# BUGS
- ✅ Auf der Karte ist nichts zu sehen. ich hätte gerne satelliten bild und topographie umschaltbar → Layer-Switcher mit Karte/Satellit/Topographie implementiert (Esri WorldImagery, OpenTopoMap)
- ✅ wird ansitz einreichtung hinzufügen ausgewählt und auf die karte geklickt, erscheint nichts → Stale-Closure-Bug in MapClickHandler gefixt (useRef), Form-Sheet auf `fixed` umgestellt
- ✅ Ausrichtung und Höhe sind Pflichtfelder, sollen aber optional sein → `valueAsNumber: true` liefert bei leerem Input `NaN`; Zod-Schema auf `z.preprocess()` umgestellt, sodass leere / NaN-Werte zu `null` werden
- ✅ Typ-Dropdown (Hochsitz) öffnet nicht → Radix UI `SelectContent` rendert per Portal; z-index war niedriger als das Modal (`z-[2000]`); Fix: `className="z-[9999]"` auf `SelectContent`
- ✅ Einrichtung verschwindet nach Reload → Supabase-Insert schlägt ohne Auth fehl; `load()` hat IndexedDB-Cache überschrieben. Fix: beim Laden werden remote- und lokal-only Einrichtungen gemergt – lokale Items bleiben erhalten bis der Sync nachgeholt wird
- ✅ Beobachtung/Abschuss erfassen: Sheet geht über ganze Breite, Speichern-Button durch Nav-Bar verborgen → `pb-24` statt `pb-8` im Bottom-Sheet; Desktop: zentriertes Modal (`sm:items-center sm:max-w-lg`); Drag-Handle auf Desktop ausgeblendet
- ✅ Wildart-/Verhalten-Dropdown in Beobachtung & Abschuss öffnet nicht → `SelectContent className="z-[9999]"` in BeobachtungForm und AbschussForm
- ✅ Gewählter Kartenlayer (Satellit/Topographie) wird nach Tab-Wechsel nicht gespeichert → `baselayerchange`-Event schreibt Layer-Name in `localStorage` (`ansitzplaner-map-layer`); `checked`-Prop auf `LayersControl.BaseLayer` wird beim Rendern aus localStorage gelesen