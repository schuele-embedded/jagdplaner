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
| TASK-005 | Auth-UI | 🔲 todo | – |
| TASK-006 | App-Shell & Navigation | 🔲 todo | – |
| TASK-007 | PWA-Konfiguration | ⏳ pending | – |
| TASK-008 | Revier-CRUD & Store | ⏳ pending | – |
| TASK-009 | Mitglieder-Einladung & Rollen | ⏳ pending | – |
| TASK-010 | Wetter-API & Mondphasen | ⏳ pending | – |
| TASK-011 | IndexedDB Offline-Speicher | ⏳ pending | – |
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
- Nächster Task: **TASK-005** (Auth-UI) und **TASK-006** (App-Shell)

### Supabase
- Projekt noch nicht angelegt (manueller Schritt)
- Sobald angelegt: `.env` mit `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` befüllen

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
