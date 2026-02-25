# JagdPlaner

Kartenbasierte Progressive Web App für Jäger – intelligente Jagdplanung mit KI-gestützter Erfolgsvorhersage.

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