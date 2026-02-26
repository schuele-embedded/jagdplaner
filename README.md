# AnsitzPlaner

Kartenbasierte Progressive Web App für Jäger – intelligente Jagdplanung mit KI-gestützter Erfolgsvorhersage.

**Live**: [www.ansitzplaner.de](https://www.ansitzplaner.de) · [www.pirschplaner.de](https://www.pirschplaner.de)

---

## Lokales Setup

### Voraussetzungen

- Node.js 20+
- Ein kostenloses [Supabase](https://supabase.com)-Konto

---

### 1. Repository klonen & Abhängigkeiten installieren

```bash
git clone https://github.com/schuele-embedded/jagdplaner.git
cd jagdplaner
npm install
```

---

### 2. Supabase-Projekt anlegen

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Region: `West EU (Ireland)` empfohlen
3. Projekt-Credentials kopieren: **Settings → API**
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public** Key → `VITE_SUPABASE_ANON_KEY`

---

### 3. Umgebungsvariablen setzen

```bash
cp .env.example .env
```

`.env` öffnen und ausfüllen:

```env
VITE_SUPABASE_URL=https://DEIN-PROJEKT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

### 4. Datenbankschema initialisieren

Im Supabase Dashboard: **SQL Editor → New query**, Inhalt der Migrationsskripte nacheinander einfügen und jeweils mit **Run** ausführen:

1. [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) – Tabellen, Indizes, RLS-Policies, Trigger
2. [`supabase/migrations/002_helper_functions.sql`](supabase/migrations/002_helper_functions.sql) – Hilfsfunktionen (E-Mail-Lookup für Mitglieder-Einladung)

---

### 4. Dev-Server starten

```bash
./dev.sh
```

→ App läuft auf [http://localhost:5173](http://localhost:5173)

---

## Verfügbare Skripte

| Befehl | Beschreibung |
|---|---|
| `./dev.sh` | Dev-Server starten (prüft .env und node_modules) |
| `npm run dev` | Dev-Server direkt starten |
| `npm run build` | Produktions-Build erstellen |
| `npm run preview` | Produktions-Build lokal vorschauen |
| `npm run typecheck` | TypeScript-Fehler prüfen |
| `npm run lint` | ESLint ausführen |
| `npm run deploy` | Build + FTP-Upload zu serverprofis.de (via `./deploy-ftp.sh`) |

---

## Deployment

### Voraussetzung: `lftp` installieren

```bash
# Ubuntu/Debian
sudo apt-get install lftp

# macOS
brew install lftp
```

### FTP-Zugangsdaten konfigurieren

In `deploy-ftp.sh` die drei Variablen oben anpassen:

```bash
FTP_SERVER="ftp.serverprofis.de"   # aus Hosting-Panel
FTP_USER="user@ansitzplaner.de"    # FTP-Benutzername
REMOTE_DIR="/ansitzplaner.de"      # Zielverzeichnis auf dem Server
```

### Deploy ausführen

```bash
./deploy-ftp.sh
# oder:
npm run deploy
```

Das Script:
1. Löscht den alten Build
2. Führt `npm run build` aus (TypeScript-Check + Vite-Build)
3. Fragt das FTP-Passwort **interaktiv** ab (kein Klartext im Repository)
4. Lädt `dist/` via `lftp mirror --reverse --delete` hoch

---

## Tech Stack

| Schicht | Technologie |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| State | Zustand |
| Karte | Leaflet.js / React-Leaflet |
| Offline | Workbox (Service Worker) + IndexedDB |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Wetter | Open-Meteo API |