# CLAUDE.md – AnsitzPlaner

Verhaltensregeln zur Vermeidung typischer LLM-Programmierfehler. Bei trivialen Aufgaben nach Ermessen handeln.

## 1. Denken vor dem Coden

**Nicht raten. Unklarheiten benennen. Alternativen aufzeigen.**

- Annahmen explizit machen. Im Zweifel fragen.
- Bei mehreren Interpretationen: alle zeigen, nicht still entscheiden.
- Einfachere Lösung? Ansprechen. Rückfragen sind erwünscht.

## 2. Einfachheit zuerst

**Minimaler Code, der das Problem löst. Nichts Spekulatives.**

- Keine Features über die Anforderung hinaus.
- Keine Abstraktionen für einmaligen Code.
- Keine unnötige Fehlerbehandlung.
- 200 Zeilen, die auch 50 sein könnten → umschreiben.

## 3. Chirurgische Änderungen

**Nur anfassen, was nötig ist. Nur eigenen Müll aufräumen.**

- Bestehenden Code nicht "verbessern" oder umformatieren.
- Bestehenden Stil übernehmen.
- Nur Imports/Variablen entfernen, die durch eigene Änderungen verwaist sind.

## 4. Zielgetriebene Umsetzung

**Erfolgskriterien definieren. Prüfen bis verifiziert.**

Aufgaben in prüfbare Ziele übersetzen:
- "Validierung hinzufügen" → Tests für ungültige Eingaben, dann bestehen lassen
- "Bug fixen" → Test der den Bug reproduziert, dann fixen

Mehrstufige Aufgaben als Plan:
```
1. [Schritt] → prüfen: [Check]
2. [Schritt] → prüfen: [Check]
```

## Projektübersicht

**AnsitzPlaner** (ehemals JagdPlaner) ist eine kartenbasierte Progressive Web App (PWA) für Jäger im deutschsprachigen Raum (D-A-CH).  
Ziel ist die intelligente Jagdplanung mit KI-gestützter Erfolgsvorhersage basierend auf historischen Daten, Wetterbedingungen und Wildbiologie.  
Erreichbar unter `www.ansitzplaner.de` · `www.pirschplaner.de`.

---

## Tech Stack

| Schicht | Technologie |
|---|---|
| Frontend-Framework | React 18+ mit TypeScript |
| State Management | Zustand |
| Karte | Leaflet.js / React-Leaflet |
| UI | shadcn/ui (Tailwind CSS) |
| Formulare | React Hook Form + Zod |
| Offline | Workbox (Service Worker) |
| Build | Vite |
| Datenbank (lokal) | IndexedDB |
| Backend/Sync | Supabase (PostgreSQL, RLS, Realtime) |
| Authentifizierung | Supabase Auth |
| Wetter | Open-Meteo API (kostenlos, DSGVO-konform) |
| Karten-Tiles | OpenStreetMap / Nominatim |
| Mondphasen | SunCalc.js |
| ML | TensorFlow.js (client-side) |

---

## Kernfunktionen

1. **Interaktive Revierkarte** – Ansitzeinrichtungen auf OSM-Karte verwalten
2. **Erfolgs-Heatmap** – ML-gestützte Vorhersage der besten Ansitzzeiten/-orte
3. **Schnellerfassung** – Ansitze, Beobachtungen und Abschüsse mobil erfassen
4. **Revierverwaltung** – Multi-User-Zugriff mit Rollenmodell
5. **Wetterintegration** – Automatische Wetterdaten pro Standort
6. **Statistiken & Analysen** – Auswertungen pro Wildart, Einrichtung, Zeitraum

---

## Architektur-Prinzipien

- **Offline-First**: Alle Kernfunktionen ohne Netzempfang nutzbar (IndexedDB + Service Worker)
- **Privacy-First**: Keine Cloud-Pflicht; sensible Standortdaten bleiben lokal
- **Mobile-First**: Primär für Smartphone-Nutzung im Gelände konzipiert
- **PWA**: Installierbar auf iOS und Android, native Features (GPS, Kamera, Kompass)

---

## Wichtige Datenstrukturen (TypeScript)

- `Revier` – Revierdaten inkl. GeoJSON-Grenze und Einstellungen
- `Ansitzeinrichtung` – Hochsitz/Kanzel/etc. mit GPS-Position und Eigenschaften
- `Ansitz` – Jagd-Session mit Bedingungen, Beobachtungen und Abschuss
- `Beobachtung` – Wildbeobachtung (Art, Anzahl, Verhalten, Position)
- `RevierMitglied` – Benutzer-Revier-Zuordnung mit Rollen und Berechtigungen
- `HeatmapData` – Vorberechnete Erfolgsquoten pro Einrichtung/Zeitslot/Wildart

---

## Datenbank (Supabase / PostgreSQL)

- Row Level Security (RLS) für revierbezogenen Datenschutz
- Spatial Index (`GEOGRAPHY(POINT)`) für Geo-Queries
- Realtime-Subscriptions für Multi-User-Synchronisierung

---

## Deployment

| Umgebung | Dienst |
|---|---|
| Frontend | serverprofis.de (Shared Hosting, Apache, FTP-Deploy) |
| Domains | www.ansitzplaner.de (primär) · www.pirschplaner.de (Alias) |
| Backend | Supabase (Free Tier / self-hosted, Region EU Frankfurt) |
| Deploy | FTP-Script `npm run deploy`, kein CI/CD |
| Kosten | ~€15–30/Monat (Start), ~€50–100/Monat (Skalierung) |

---

## Zielgruppe

- Revierpächter und Jagdausübungsberechtigte
- Jagdgemeinschaften (3–15 Personen)
- Hobby-Jäger mit eigenem Revier
- Deutschsprachiger Raum (D-A-CH)

---

## Entwicklungshinweise

- Sprache UI: **Deutsch** (UI-Texte, Fachbegriffe wie Revier, Ansitz, Einrichtung)
- Sprache Code: **Englisch** (Variablen, Funktionen, Kommentare)
- Jagdzeiten und Wildarten sind revierspezifisch konfigurierbar
- ML-Modell: initial serverseitig trainiert, später edge-computing via TensorFlow.js
- Mondphasen und Sonnenauf-/-untergang sind für die Jagdplanung relevant
