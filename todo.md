# TODO & Issues – Projekt-Review

> Vollständiges Code-Review (Daten-/Sync-Schicht, UI, Konfiguration/Security).
> Erledigte Punkte hier abhaken/streichen und Fix in PROGRESS.md dokumentieren.

## Nutzer-Reports

- [x] **Einladung: neues Revier erst nach Ab-/Anmelden sichtbar** — Fix: `loadReviere()` + `syncPendingOperations()` laufen jetzt auch bei `visibilitychange` (App-Resume) und beim App-Start, nicht mehr nur beim Login.
- [x] **Eingeladener Jäger sieht Reviereinrichtungen nicht** — Ursache bestätigt: `position: {lat,lng}` in `GEOGRAPHY`-Spalte. Fix: `lib/geo.ts` (WKT-Serialisierung + WKB-Hex-Parser), in useEinrichtungen/useAnsitz/useAnsitze eingebunden, Sync-Queue-Altlasten werden beim Sync repariert. **Nachprüfen: Einrichtung anlegen → erscheint sie in Supabase-Tabelle und beim zweiten Mitglied?**
- [ ] **Supabase-E-Mails an AnsitzPlaner anpassen** — Supabase Dashboard → Auth → Email Templates (Absendername, Betreff, deutsche Texte, AnsitzPlaner-Branding); Site-URL/Redirect-URLs auf `https://www.ansitzplaner.de` prüfen.
- [ ] **Wetter über den Tag verteilt (morgens/mittags/abends)** — `fetchWeeklyForecast()` nutzt nur die Daily-API von Open-Meteo. Erweiterung: Hourly-Forecast holen und je Tag in 3 Slots (Früh/Mittag/Abend) mit eigenem Jagd-Score aggregieren; Anzeige in `WetterPlanung.tsx`.

## Kritisch

- [ ] **`.env` mit Supabase-URL und Anon-Key ist im Git committed** (Commit b0b6c30; `.gitignore` deckt nur `.env.local` ab). Fix: Anon-Key im Supabase-Dashboard rotieren, `.env` in `.gitignore` aufnehmen + `git rm --cached .env`, Historie mit `git-filter-repo` bereinigen (Force-Push abstimmen).
- [ ] **Passwort-Reset führt ins Leere** — `PasswortResetPage.tsx:31` setzt `redirectTo: /passwort-neu`, diese Route existiert nicht; Recovery-Link loggt den Nutzer nur ein, Passwort kann nicht geändert werden. Fix: Route `/passwort-neu` mit `supabase.auth.updateUser({ password })` bauen; Redirect-URL im Supabase-Dashboard whitelisten.
- [ ] **Rollen/Berechtigungen werden clientseitig ignoriert** — `usePermissions.ts` gibt jedem Nicht-Eigentümer pauschal das `jaeger`-Preset; die echte Rolle aus `revier_mitglieder` wird nie geladen. Ein „Gast" sieht UI-Funktionen, die RLS dann stumm blockt. Fix: Mitglieds-Datensatz des aktuellen Users je aktivem Revier laden und `rolle`/`berechtigungen` daraus verwenden.
- [ ] **Foto-Aufnahme komplett funktionslos** — `AbschussForm.tsx` (file-input ohne `onChange`), `BeobachtungForm.tsx` (`fotos: []` hardcoded), `EinrichtungForm.tsx` (kein Upload-UI). `fotos` wird nirgends befüllt/hochgeladen. Fix: Foto-Konzept entscheiden (Supabase Storage + Pfade in `fotos`, Offline-Queue) oder Buttons entfernen, solange das Feature fehlt.

## Hoch

- [ ] **Sync-Queue läuft nur beim `online`-Event** (`registerSyncOnReconnect`), nicht beim App-Start → Queue staut sich, wenn die App online geöffnet wird. Zudem: keine Retry-Begrenzung, nur Konflikt 23505 wird behandelt, fehlerhafte Alt-Payloads (z. B. `beobachtungen`-Feld, `{lat,lng}`-Positionen) hängen für immer, kein Nutzer-Feedback. Fix: `syncPendingOperations()` auch beim Mount aufrufen, Retry-Counter/Dead-Letter, FK-Fehler (23503) behandeln, Payload-Altlasten migrieren oder verwerfen.
- [ ] **Einrichtung löschen mit vorhandenen Ansitzen scheitert unsichtbar** — DB hat `ON DELETE RESTRICT`; `useEinrichtungen.remove()` schluckt den Fehler, lokal verschwindet die Einrichtung, remote bleibt sie. Fix: FK-Fehler erkennen und melden („Einrichtung hat erfasste Ansitze").
- [ ] **Kein Fehlermelde-/Toast-System** — Speichern-Fehler (z. B. `KartePage.handleSave`, `finalize`, Stores) sind für den Nutzer unsichtbar; `error`-States werden teils nie gerendert. Fix: leichtgewichtiges Toast-System (z. B. sonner) einführen und an Save-/Sync-Pfade anschließen.
- [ ] **Persistierter aktiver Ansitz ohne Verfallszeit** — `useAnsitzStore` (localStorage) stellt nach Crash/Tagen einen „laufenden" Ansitz wieder her. Fix: beim App-Start Ansitze älter als ~24 h verwerfen oder Dialog „Ansitz fortsetzen/verwerfen?".

## Mittel

- [ ] **SECURITY-DEFINER-Funktionen ohne `SET search_path`** — `is_revier_member`, `has_revier_permission`, `auto_add_eigentuemer` (001), `get_user_id_by_email` (002), `get_revier_member_profiles` (003) → search-path-Hijack möglich. Fix: Migration 004 mit `SET search_path = public, pg_temp` für alle fünf.
- [ ] **UPDATE-RLS-Policies ohne `WITH CHECK`** (alle Tabellen in 001) — geänderte Zeilen werden nicht gegen die Policy geprüft (z. B. `revier_id` umbiegen). Fix: `WITH CHECK` spiegelnd ergänzen (Migration 004).
- [ ] **Abschuss-Details unstrukturiert** — Entfernung, Waffe, Trefferlage, Nachsuche werden in `AbschussForm.tsx` zu einem `notizen`-String verkettet statt als Felder gespeichert → keine Auswertung möglich. Fix: `Abschuss`-Typ + JSONB um Felder erweitern, Form anpassen.
- [ ] **Zod-Schemas sind toter Code** — `AbschussSchema`/`BeobachtungSchema` in `validierung.ts` werden von den Formularen nicht genutzt (kein react-hook-form/zodResolver in AbschussForm/BeobachtungForm). Fix: anbinden oder entfernen.
- [ ] **PWA-Icons unvollständig** — Manifest nur mit SVG; `apple-touch-icon.png` wird in `vite.config.ts` referenziert, existiert aber nicht in `public/` → iOS-Installation/Homescreen-Icon beeinträchtigt. Fix: 192/512-PNGs + apple-touch-icon generieren.
- [ ] **IndexedDB wird nie aufgeräumt** — beim Revier-Löschen/-Wechsel oder Mitglieds-Entfernung bleiben alte Daten lokal liegen. Fix: `clearRevierCache(revierId)` und Aufruf in `deleteRevier`/beim Entfernen.
- [ ] **User-Settings nicht persistiert** — `useUserStore` hardcodet `settings` (`dark_mode`, `standard_revier_id`, `push_notifications: false`); Änderungen wären nicht gespeichert. Fix: in `user_metadata` oder Profil-Tabelle persistieren — oder Felder aus dem `User`-Typ streichen (jagdAlert nutzt bereits localStorage).
- [ ] **Mitglied erneut einladen** — UNIQUE-Verletzung (revier_id, user_id) wird als generischer Fehler angezeigt. Fix: Fall erkennen → „ist bereits Mitglied" bzw. inaktives Mitglied reaktivieren.

## Niedrig

- [ ] `import { useState }` steht mitten in `AnsitzListe.tsx` (~Zeile 120) — funktioniert (Hoisting), gehört aber an den Dateianfang.
- [ ] Rolle `gaende` ist vermutlich ein Tippfehler (→ `gaeste`/`jagdgast`); UI-Label sagt „Jagdgänger".
- [ ] Bundle ~1,3 MB ohne Code-Splitting — leaflet/recharts via `manualChunks` abspalten.
- [ ] Bottom-Sheets/Listen teils mit zu kleinem `pb` hinter der BottomNav (z. B. Detail-Sheet in `AnsitzListe.tsx` mit `pb-8`); Safe-Area (iOS-Notch) nirgends berücksichtigt.
- [ ] Einladen setzt voraus, dass der Nutzer bereits registriert ist (kein E-Mail-Versand) — Hinweis im Einladen-Formular ergänzen.
- [ ] Service-Worker `registerType: 'autoUpdate'` aktualisiert ohne Nachfrage — bei aktivem Ansitz ggf. störend; `prompt`-Variante erwägen.
- [ ] `grenze_geojson` wird nie validiert (kein Schema-Check vor dem Speichern).
