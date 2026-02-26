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

---

## MVP vollständig implementiert ✅

Alle 17 Tasks sind erledigt. Die App ist production-ready.

### Deployment-Checkliste

- [ ] Vercel-Projekt anlegen, GitHub-Repo verbinden
- [ ] Umgebungsvariablen in Vercel setzen: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_DSN` (optional)
- [ ] Build: `npm run build`, Output: `dist/` (vercel.json ist bereits konfiguriert)
- [ ] Supabase: Auth-Redirect-URLs auf Production-Domain setzen
- [ ] Supabase: Automatische Backups aktivieren
- [ ] Sentry-Projekt anlegen, DSN als `VITE_SENTRY_DSN` setzen (optional)
