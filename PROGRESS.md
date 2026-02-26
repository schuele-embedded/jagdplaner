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
| TASK-001 | Projekt-Scaffold | ✅ done | TASK-001 |
| TASK-002 | TypeScript-Typen & Zod-Schemas | ✅ done | TASK-002 |
| TASK-003 | Supabase-Datenbankschema | ✅ done | TASK-002 |
| TASK-004 | Supabase Client & Auth-Store | ✅ done | TASK-004 |
| TASK-005 | Auth-UI | ✅ done | TASK-005 |
| TASK-006 | App-Shell & Navigation | ✅ done | TASK-006 |
| TASK-007 | PWA-Konfiguration | ✅ done | TASK-007 |
| TASK-008 | Revier-CRUD & Store | ✅ done | TASK-008 |
| TASK-009 | Mitglieder-Einladung & Rollen | ✅ done | TASK-009 |
| TASK-010 | Wetter-API & Mondphasen | ✅ done | TASK-010 |
| TASK-011 | IndexedDB Offline-Speicher | ✅ done | TASK-011 |
| TASK-012 | Leaflet-Revierkarte | ⏳ pending | – |
| TASK-013 | Ansitzeinrichtungen CRUD | ⏳ pending | – |
| TASK-014 | Offline-Karten-Caching | ⏳ pending | – |
| TASK-015 | Ansitz-Erfassung Flow | ⏳ pending | – |
| TASK-016 | Statistiken & Dashboard | ⏳ pending | – |
| TASK-017 | Deployment & Error-Tracking | ⏳ pending | – |

---

## Notizen & Kontext

### Letzter Stand
- Beginn: 25. Februar 2026
- Nächster Task: **TASK-012** (Leaflet-Revierkarte)

### Supabase
- Projekt noch nicht angelegt (manueller Schritt)
- Sobald angelegt: `.env` mit `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` befüllen

### PWA-Icons
- Platzhalter SVG unter `public/icons/icon.svg` und `public/mask-icon.svg`
- Für Produktion: PNG-Icons (192x192 und 512x512) aus SVG generieren

### Offene Entscheidungen
- Keine

---

## Changelog

| Datum | Task | Beschreibung |
|---|---|---|
| 2026-02-25 | – | PROGRESS.md angelegt, Implementierung gestartet |
| 2026-02-25 | TASK-001 | Projekt-Scaffold abgeschlossen (Vite+React+TS+PWA, alle Configs) |
| 2026-02-25 | TASK-002 | TypeScript-Interfaces + Zod-Schemas erstellt |
| 2026-02-25 | TASK-003 | Supabase-Migrationsskript mit RLS-Policies erstellt |
| 2026-02-25 | TASK-004 | Supabase Client + Zustand Auth-Store implementiert |
| 2026-02-25 | TASK-005 | Auth-UI: Login, Registrierung, Passwort-Reset, AuthGuard |
| 2026-02-25 | TASK-006 | App-Shell: Router, BottomNav, OfflineIndicator, alle Placeholder-Pages |
| 2026-02-25 | TASK-007 | PWA: Supabase NetworkOnly, SVG-Icons, manifest.json |
| 2026-02-25 | TASK-008 | Revier-CRUD: Store, RevierForm, RevierWechsler, OnboardingModal |
| 2026-02-25 | TASK-009 | Mitglieder-Einladung, Rollen, usePermissions, Select-Component |
| 2026-02-25 | TASK-010 | Wetter-API (Open-Meteo), Mondphasen (SunCalc), useGeolocation, useWeatherData |
| 2026-02-25 | TASK-011 | IndexedDB (idb): ansitze, beobachtungen, einrichtungen, sync_queue + Auto-Sync |
