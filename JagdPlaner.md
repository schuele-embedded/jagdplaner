# JagdPlaner - Technisches Umsetzungskonzept

## 1. Produktvision

### Kernidee
Eine kartenbasierte Progressive Web App für Jäger zur intelligenten Jagdplanung mit Erfolgs-Vorhersage basierend auf historischen Daten, Wetterbedingungen und Wildbiologie.

### Hauptzielgruppe
- Revierpächter und Jagdausübungsberechtigte
- Jagdgemeinschaften (3-15 Personen pro Revier)
- Hobby-Jäger mit eigenem Revier
- Deutschsprachiger Raum (D-A-CH)

### Alleinstellungsmerkmale
- **Intelligente Erfolgs-Heatmap**: KI-gestützte Vorhersage der besten Ansitzzeiten und -orte
- **Revierzentriertes Multi-User-System**: Gemeinsame Datenbasis für alle Reviermitglieder
- **Offline-First**: Volle Funktionalität auch ohne Netzempfang im Revier
- **Privacy-First**: Keine Cloud-Pflicht, sensible Standortdaten bleiben geschützt
- **Mobile-optimiert**: Primär für Smartphone-Nutzung im Gelände konzipiert

### Hauptfunktionen
1. Interaktive Revierkarte mit Ansitzeinrichtungen
2. Erfolgs-Heatmap basierend auf ML-Algorithmus
3. Schnellerfassung von Ansitzen und Beobachtungen
4. Revierverwaltung mit Mehrbenutzer-Zugriff
5. Automatische Wetterintegration
6. Statistiken und Analysen

---

## 2. Technische Architektur

### 2.1 Tech Stack

#### Frontend
- **Framework**: React 18+ mit TypeScript
- **State Management**: Zustand (leichtgewichtig, gut für Offline)
- **Karten-Bibliothek**: Leaflet.js mit React-Leaflet
- **UI-Komponenten**: shadcn/ui (Tailwind-basiert)
- **Formulare**: React Hook Form + Zod Validation
- **Offline**: Workbox (Service Worker)
- **Build**: Vite

#### Backend/Datenbank
- **Primäre Speicherung**: IndexedDB (client-side)
- **Sync-Backend**: Supabase oder PocketBase
  - PostgreSQL für strukturierte Daten
  - Row Level Security für Revierzugriff
  - Realtime-Subscriptions für Multi-User
- **Authentifizierung**: Supabase Auth oder eigene JWT-Lösung
- **File Storage**: Für Fotos (Wildkameras, Dokumentation)

#### Externe Services
- **Wetter-API**: Open-Meteo (kostenlos, DSGVO-konform)
- **Kartenmaterial**: OpenStreetMap (OSM)
- **Geocoding**: Nominatim (OSM)
- **Mond-Phasen**: Eigene Berechnung (SunCalc.js)

#### Machine Learning
- **Bibliothek**: TensorFlow.js (client-side ML)
- **Modell**: Gradient Boosting oder Random Forest
- **Training**: Initial serverseitig, später edge-computing

### 2.2 Deployment-Strategie

#### Progressive Web App (PWA)
- Installierbar auf iOS und Android
- Offline-Funktionalität via Service Worker
- Push-Benachrichtigungen (optional)
- Native Features: GPS, Kamera, Kompass

#### Hosting
- **Frontend**: serverprofis.de (Shared Hosting, Apache) – FTP-Upload nach `npm run build`
- **Domains**: `www.ansitzplaner.de` (primär) · `www.pirschplaner.de` (Weiterleitung auf ansitzplaner.de)
- **Backend**: Supabase (Free Tier für Start, EU-Region Frankfurt)
- **Deploy**: FTP-Script (`scripts/deploy.mjs`), keine CI/CD-Pipeline
- **SPA-Routing**: Apache `.htaccess` mod_rewrite
- **Kosten-Schätzung**: 
  - Start: €15-30/Monat (Serverprofis.de Hosting + Supabase Free Tier + Domains)
  - Skaliert: €50-100/Monat (bei 100+ aktiven Revieren)

---

## 3. Datenmodell

### 3.1 Kernentitäten

```typescript
// Revier
interface Revier {
  id: string;
  name: string;
  beschreibung?: string;
  flaeche_ha?: number;
  grenze_geojson?: GeoJSON; // Polygon der Reviergrenzen
  eigentuemer_id: string; // User der das Revier erstellt hat
  created_at: Date;
  settings: RevierSettings;
}

interface RevierSettings {
  standard_wildarten: string[]; // Welche Wildarten kommen vor
  zeitzone: string; // "Europe/Berlin"
  jagdzeiten: Record<string, {von: string, bis: string}>; // Pro Wildart
  heatmap_enabled: boolean;
  wetter_api_aktiv: boolean;
}

// Ansitzeinrichtung
interface Ansitzeinrichtung {
  id: string;
  revier_id: string;
  typ: 'hochsitz' | 'kanzel' | 'ansitzleiter' | 'bodensitz' | 'sonstige';
  name: string;
  beschreibung?: string;
  position: {
    lat: number;
    lng: number;
  };
  hoehe_meter?: number;
  ausrichtung_grad?: number; // 0-360° (Schussrichtung)
  sichtweite_meter?: number;
  zustand: 'gut' | 'mittel' | 'schlecht' | 'gesperrt';
  letzte_wartung?: Date;
  naechste_wartung?: Date;
  fotos?: string[]; // URLs/Paths
  notizen?: string;
  guenstige_windrichtungen?: string[]; // ['N', 'NE', 'E']
  created_at: Date;
  created_by: string;
}

// Ansitz (Jagd-Session)
interface Ansitz {
  id: string;
  revier_id: string;
  ansitzeinrichtung_id: string;
  jaeger_id: string;
  
  // Zeitdaten
  datum: Date;
  beginn: Date;
  ende: Date;
  
  // Bedingungen
  bedingungen: {
    temperatur_celsius?: number;
    windrichtung?: string; // 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'
    windstaerke_bft?: number; // 0-12 Beaufort
    niederschlag_mm?: number;
    bewoelkung_prozent?: number;
    luftdruck_hpa?: number;
    mondphase?: string; // 'neumond', 'zunehmend', 'vollmond', 'abnehmend'
    sichtverhaeltnisse?: 'sehr_gut' | 'gut' | 'maessig' | 'schlecht';
  };
  
  // Ergebnis
  erfolg: boolean; // Wurde Wild erlegt?
  beobachtungen: Beobachtung[];
  
  // Abschuss (falls erfolg === true)
  abschuss?: {
    wildart: string;
    geschlecht: 'm' | 'w' | 'unbekannt';
    alter_jahre?: number;
    gewicht_kg?: number;
    entfernung_meter?: number;
    uhrzeit: Date;
    waffe_kaliber?: string;
    trefferlage?: string;
    nachsuche_noetig: boolean;
    fotos?: string[];
  };
  
  notizen?: string;
  created_at: Date;
}

// Beobachtung
interface Beobachtung {
  id: string;
  ansitz_id?: string; // Optional, kann auch eigenständig sein
  revier_id: string;
  
  wildart: string;
  anzahl: number;
  geschlecht?: 'm' | 'w' | 'gemischt' | 'unbekannt';
  verhalten: 'aesend' | 'ziehend' | 'fluechtig' | 'ruhend' | 'sonstige';
  
  position?: {
    lat: number;
    lng: number;
  };
  uhrzeit: Date;
  entfernung_meter?: number;
  
  notizen?: string;
  fotos?: string[];
}

// Benutzer-Revier-Zuordnung (Multi-User)
interface RevierMitglied {
  id: string;
  revier_id: string;
  user_id: string;
  rolle: 'eigentuemer' | 'paechter' | 'jagdgast' | 'beobachter';
  berechtigungen: {
    ansitze_erstellen: boolean;
    einrichtungen_verwalten: boolean;
    mitglieder_einladen: boolean;
    statistiken_sehen: boolean;
    revier_bearbeiten: boolean;
  };
  eingeladen_von: string;
  eingeladen_am: Date;
  aktiv: boolean;
}

// User
interface User {
  id: string;
  email: string;
  name: string;
  telefon?: string;
  jagdschein_nummer?: string;
  jagdschein_gueltig_bis?: Date;
  avatar_url?: string;
  settings: UserSettings;
  created_at: Date;
}

interface UserSettings {
  benachrichtigungen_aktiv: boolean;
  standardrevier_id?: string;
  einheiten: 'metrisch' | 'imperial';
  theme: 'light' | 'dark' | 'auto';
}

// Heatmap-Daten (vorberechnet für Performance)
interface HeatmapData {
  id: string;
  revier_id: string;
  ansitzeinrichtung_id: string;
  
  // Zeitbezug
  monat: number; // 1-12
  tageszeit_stunde: number; // 0-23
  wochentag: number; // 0-6 (Sonntag-Samstag)
  
  // Wildart-spezifisch
  wildart: string;
  
  // Metriken
  erfolgsquote_prozent: number; // 0-100
  anzahl_ansitze: number;
  anzahl_erfolge: number;
  durchschnitt_beobachtungen: number;
  
  // Bedingungen (Durchschnitt)
  optimale_temperatur?: number;
  optimale_windrichtung?: string;
  
  last_calculated: Date;
}
```

### 3.2 Datenbank-Schema (PostgreSQL/Supabase)

```sql
-- Tabellen mit Row Level Security (RLS)

CREATE TABLE reviere (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  beschreibung TEXT,
  flaeche_ha DECIMAL,
  grenze_geojson JSONB,
  eigentuemer_id UUID REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ansitzeinrichtungen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revier_id UUID REFERENCES reviere(id) ON DELETE CASCADE,
  typ TEXT NOT NULL,
  name TEXT NOT NULL,
  beschreibung TEXT,
  position GEOGRAPHY(POINT),
  hoehe_meter DECIMAL,
  ausrichtung_grad INTEGER,
  sichtweite_meter INTEGER,
  zustand TEXT DEFAULT 'gut',
  letzte_wartung DATE,
  naechste_wartung DATE,
  fotos TEXT[],
  notizen TEXT,
  guenstige_windrichtungen TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Spatial Index für performante Geo-Queries
CREATE INDEX idx_ansitzeinrichtungen_position 
  ON ansitzeinrichtungen USING GIST(position);

CREATE TABLE ansitze (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revier_id UUID REFERENCES reviere(id) ON DELETE CASCADE,
  ansitzeinrichtung_id UUID REFERENCES ansitzeinrichtungen(id),
  jaeger_id UUID REFERENCES auth.users(id),
  datum DATE NOT NULL,
  beginn TIMESTAMPTZ NOT NULL,
  ende TIMESTAMPTZ NOT NULL,
  bedingungen JSONB DEFAULT '{}',
  erfolg BOOLEAN DEFAULT false,
  abschuss JSONB,
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE beobachtungen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ansitz_id UUID REFERENCES ansitze(id) ON DELETE CASCADE,
  revier_id UUID REFERENCES reviere(id) ON DELETE CASCADE,
  wildart TEXT NOT NULL,
  anzahl INTEGER NOT NULL DEFAULT 1,
  geschlecht TEXT,
  verhalten TEXT NOT NULL,
  position GEOGRAPHY(POINT),
  uhrzeit TIMESTAMPTZ NOT NULL,
  entfernung_meter INTEGER,
  notizen TEXT,
  fotos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE revier_mitglieder (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revier_id UUID REFERENCES reviere(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rolle TEXT NOT NULL DEFAULT 'jagdgast',
  berechtigungen JSONB DEFAULT '{}',
  eingeladen_von UUID REFERENCES auth.users(id),
  eingeladen_am TIMESTAMPTZ DEFAULT NOW(),
  aktiv BOOLEAN DEFAULT true,
  UNIQUE(revier_id, user_id)
);

CREATE TABLE heatmap_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revier_id UUID REFERENCES reviere(id) ON DELETE CASCADE,
  ansitzeinrichtung_id UUID REFERENCES ansitzeinrichtungen(id) ON DELETE CASCADE,
  monat INTEGER NOT NULL,
  tageszeit_stunde INTEGER NOT NULL,
  wochentag INTEGER NOT NULL,
  wildart TEXT NOT NULL,
  erfolgsquote_prozent DECIMAL NOT NULL,
  anzahl_ansitze INTEGER DEFAULT 0,
  anzahl_erfolge INTEGER DEFAULT 0,
  durchschnitt_beobachtungen DECIMAL DEFAULT 0,
  optimale_bedingungen JSONB,
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ansitzeinrichtung_id, monat, tageszeit_stunde, wildart)
);

-- Row Level Security Policies

ALTER TABLE reviere ENABLE ROW LEVEL SECURITY;
ALTER TABLE ansitzeinrichtungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE ansitze ENABLE ROW LEVEL SECURITY;
ALTER TABLE beobachtungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE revier_mitglieder ENABLE ROW LEVEL SECURITY;

-- Beispiel RLS Policy: User sieht nur Reviere, in denen er Mitglied ist
CREATE POLICY "Users can view reviere they are member of"
  ON reviere FOR SELECT
  USING (
    id IN (
      SELECT revier_id FROM revier_mitglieder 
      WHERE user_id = auth.uid() AND aktiv = true
    )
  );

-- Weitere Policies analog für andere Tabellen...
```

---

## 4. Feature-Spezifikation im Detail

### 4.1 Interaktive Revierkarte

#### Funktionalität
- **Basis-Karte**: OpenStreetMap Layer (Offline: gecachte Tiles)
- **Custom Layer für Ansitzeinrichtungen**: Icons je nach Typ
- **Reviergrenzen**: Einzeichenbar als Polygon
- **Zoom & Pan**: Touch-optimiert für Mobile
- **GPS-Position**: "Wo bin ich?" Button
- **Offline-Karten**: Automatisches Caching der Revier-Umgebung

#### Ansitzeinrichtungen auf Karte
**Hinzufügen:**
1. Button "Neue Einrichtung" → Karte in Edit-Modus
2. Tippen auf Karte setzt Marker
3. Formular öffnet sich:
   - Typ auswählen (Hochsitz, Kanzel, etc.)
   - Name vergeben
   - Optional: Ausrichtung (Kompass), Höhe, Sichtweite
   - Foto hochladen
   - Notizen
4. Speichern → Marker erscheint auf Karte

**Anzeige:**
- Icons unterscheiden sich je nach Typ
- Farbe zeigt Zustand (grün=gut, gelb=Wartung fällig, rot=gesperrt)
- Tap auf Icon → Info-Popup:
  - Name, Typ
  - Zustand, letzte Wartung
  - Quick-Actions: "Ansitz starten", "Bearbeiten", "Navigation"

**Bearbeiten:**
- Marker verschiebbar im Edit-Modus
- Formular zum Aktualisieren
- Löschen (mit Bestätigung)

#### Heatmap-Overlay
**Aktivierung:**
- Toggle-Button "Heatmap anzeigen"
- Filter-Optionen:
  - Wildart (Rehwild, Schwarzwild, etc.)
  - Zeitpunkt (Datum + Uhrzeit-Schieberegler)
  - "Jetzt" vs. "Benutzerdefiniert"

**Visualisierung:**
- Transparente Farbschicht über Karte
- Grün (hohe Erfolgschance) → Gelb → Rot (niedrig)
- Radius um jede Ansitzeinrichtung
- Intensität korreliert mit Erfolgswahrscheinlichkeit

**Interaktion:**
- Tippen auf gefärbten Bereich → Detailinfo
  - "73% Erfolgswahrscheinlichkeit für Rehwild"
  - "Basierend auf 12 Ansitzen"
  - Faktoren: Wetter, Zeit, historische Daten
  - Empfehlung: "Beste Zeit heute: 18:30-19:45 Uhr"

### 4.2 Ansitz-Erfassung (Mobile-optimiert)

#### Workflow "Ansitz starten"
**Screen 1: Schnellstart**
```
┌─────────────────────────────┐
│ Ansitz starten              │
├─────────────────────────────┤
│ Wo?                         │
│ [Hochsitz "Eicheneck" ▼]    │
│                             │
│ Wann?                       │
│ [Jetzt ●] [Zeitpunkt wählen]│
│                             │
│ [GPS-Position übernehmen]   │
│                             │
│ ┌─────────────────────────┐ │
│ │   Ansitz starten   ←───┼─┼─→ Großer Tap-Bereich
│ └─────────────────────────┘ │
│                             │
│ [Erweiterte Eingabe...]     │
└─────────────────────────────┘
```

**Screen 2: Während Ansitz (Timer läuft)**
```
┌─────────────────────────────┐
│ Ansitz läuft... ⏱ 01:23:45  │
├─────────────────────────────┤
│ Hochsitz "Eicheneck"        │
│ Beginn: 17:30 Uhr           │
│                             │
│ Wetter: 12°C, Wind SW 2     │
│ Mondphase: ◐ Zunehmend      │
│                             │
│ ┌─────────────────────────┐ │
│ │ Beobachtung erfassen    │ │
│ └─────────────────────────┘ │
│                             │
│ 🦌 2x Rehwild (18:05)       │
│ 🐗 1x Schwarzwild (18:32)   │
│                             │
│ ┌───────────┬─────────────┐ │
│ │  Abschuss │ Beenden     │ │
│ └───────────┴─────────────┘ │
└─────────────────────────────┘
```

**Quick-Action: Beobachtung erfassen**
- Tap auf "Beobachtung erfassen"
- Minimal-Input:
  - Wildart (Dropdown mit Favoriten oben)
  - Anzahl (Stepper: - 1 +)
  - Optional: Geschlecht, Verhalten, Entfernung
- Speichern → zurück zum laufenden Ansitz

**Action: Abschuss erfassen**
- Formular mit allen relevanten Daten
- Foto-Upload (direkt Kamera öffnen)
- GPS-Position automatisch erfasst
- Uhrzeit automatisch

**Ansitz beenden**
- Zusammenfassung anzeigen
- Bewertung: "War der Ansitz erfolgreich?" (für ML wichtig)
- Optionale Notizen
- Speichern

#### Offline-Unterstützung
- Alle Eingaben werden lokal in IndexedDB gespeichert
- Synchronisation bei nächster Netzverbindung
- Indicator: "3 Ansitze warten auf Sync ↑"

### 4.3 Revierverwaltung & Multi-User

#### Revier erstellen
1. "Neues Revier" → Name, Beschreibung
2. Grenzen einzeichnen auf Karte (optional)
3. Standard-Einstellungen:
   - Vorkommende Wildarten
   - Zeitzone
   - Jagdzeiten

#### Mitglieder einladen
**Per E-Mail:**
- Email-Adresse eingeben
- Rolle auswählen:
  - **Eigentümer**: Alle Rechte, kann löschen
  - **Pächter**: Verwalten + Jagen
  - **Jagdgast**: Nur Jagen + Beobachten
  - **Beobachter**: Nur Lesen
- Berechtigungen individuell anpassen
- Einladungslink per Mail (Magic Link)

**Per QR-Code:**
- QR-Code generieren → scannen → automatisch beitreten

#### Berechtigungssystem
```typescript
const rollenVorlagen = {
  eigentuemer: {
    ansitze_erstellen: true,
    einrichtungen_verwalten: true,
    mitglieder_einladen: true,
    statistiken_sehen: true,
    revier_bearbeiten: true,
    revier_loeschen: true,
  },
  paechter: {
    ansitze_erstellen: true,
    einrichtungen_verwalten: true,
    mitglieder_einladen: true,
    statistiken_sehen: true,
    revier_bearbeiten: true,
    revier_loeschen: false,
  },
  jagdgast: {
    ansitze_erstellen: true,
    einrichtungen_verwalten: false,
    mitglieder_einladen: false,
    statistiken_sehen: true,
    revier_bearbeiten: false,
    revier_loeschen: false,
  },
  beobachter: {
    ansitze_erstellen: false,
    einrichtungen_verwalten: false,
    mitglieder_einladen: false,
    statistiken_sehen: true,
    revier_bearbeiten: false,
    revier_loeschen: false,
  },
};
```

#### Echtzeit-Sync (Multi-User)
- **Supabase Realtime** für Live-Updates
- Wenn User A Ansitzeinrichtung hinzufügt → erscheint sofort bei User B
- Konflikte vermeiden durch optimistic UI updates
- "User XY hat gerade einen Ansitz auf Hochsitz 3 gestartet" (optional)

### 4.4 Erfolgs-Heatmap & Vorhersage-Algorithmus

#### Datensammlung für ML-Modell
**Mindestdaten für sinnvolle Vorhersage:**
- Pro Ansitzeinrichtung: mindestens 10-15 Ansitze
- Idealerweise über mehrere Monate verteilt
- Mix aus erfolgreichen und nicht-erfolgreichen Ansitzen

**Features (Input für ML):**
1. **Zeitliche Features:**
   - Monat (1-12)
   - Wochentag (0-6)
   - Tageszeit (Stunde 0-23)
   - Minuten seit Sonnenauf-/untergang
   - Dämmerung ja/nein

2. **Wetter-Features:**
   - Temperatur
   - Windrichtung (als Vektor)
   - Windstärke
   - Niederschlag
   - Luftdruck
   - Bewölkung

3. **Mond-Features:**
   - Mondphase (0-1, Neumond bis Vollmond)
   - Mond sichtbar ja/nein

4. **Standort-Features:**
   - Ansitzeinrichtungs-ID (one-hot encoded)
   - Historische Erfolgsquote am Standort
   - Tage seit letztem Ansitz an diesem Standort

5. **Saisonale Features:**
   - Brunftzeit aktiv? (für jeweilige Wildart)
   - Jagdzeit aktiv? (legal)
   - Äsungsverfügbarkeit (Eichelmast, Mais, etc.)

**Label (Output):**
- Erfolg ja/nein (binär)
- Optional: Anzahl Beobachtungen (Regression)

#### ML-Algorithmus

**Variante 1: Logistische Regression (einfach, interpretierbar)**
```python
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# Training
X_train, X_test, y_train, y_test = train_test_split(features, labels)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

model = LogisticRegression()
model.fit(X_train_scaled, y_train)

# Vorhersage
def predict_success(conditions):
    conditions_scaled = scaler.transform([conditions])
    probability = model.predict_proba(conditions_scaled)[0][1]
    return probability * 100  # Prozent
```

**Variante 2: Random Forest (genauer, weniger interpretierbar)**
```python
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=100, max_depth=10)
model.fit(X_train, y_train)

# Feature Importance
importances = model.feature_importances_
# → Zeigt welche Faktoren am wichtigsten sind
```

**Variante 3: TensorFlow.js (im Browser)**
```javascript
import * as tf from '@tensorflow/tfjs';

// Modell laden (vortrainiert auf Server, dann heruntergeladen)
const model = await tf.loadLayersModel('/models/jagd-vorhersage/model.json');

// Vorhersage
function predictSuccess(features) {
  const input = tf.tensor2d([features]);
  const prediction = model.predict(input);
  const probability = prediction.dataSync()[0];
  return probability * 100;
}
```

#### Heatmap-Berechnung

**Vorberechnung (nightly job):**
- Für jede Ansitzeinrichtung
- Für jede Wildart
- Für jede Kombination aus Monat × Tageszeit (12 × 24 = 288 Datenpunkte)
- Berechne Erfolgswahrscheinlichkeit
- Speichere in `heatmap_cache` Tabelle

**Echtzeit-Anpassung:**
- Wenn User Heatmap anfordert
- Hole vorberechnete Werte aus Cache
- Passe an aktuelle Bedingungen an:
  ```javascript
  const baseScore = getCachedHeatmapScore(einrichtung, monat, stunde, wildart);
  const wetterBonus = calculateWeatherBonus(aktuellesWetter);
  const jagddruckBonus = calculateHuntingPressureBonus(tageSeitLetztemAnsitz);
  
  const finalScore = baseScore * (1 + wetterBonus + jagddruckBonus);
  return Math.min(100, Math.max(0, finalScore));
  ```

**Visualisierung als Farbcode:**
```javascript
function scoreToColor(score) {
  if (score >= 75) return '#22c55e'; // Grün
  if (score >= 50) return '#eab308'; // Gelb
  if (score >= 25) return '#f97316'; // Orange
  return '#ef4444'; // Rot
}
```

#### Erklärbarkeit für User
```
Erfolgswahrscheinlichkeit: 73%

Faktoren:
✓ Ideale Tageszeit (Dämmerung)      +25%
✓ Optimale Temperatur (10-15°C)     +15%
✓ Kein Jagddruck (5 Tage Ruhe)      +20%
✓ Günstige Windrichtung (SW)        +10%
~ Bewölkung mittel                   0%
✗ Vollmond (Wild unruhig)           -10%

Basis-Erfolgsquote (historisch):    23%

Empfehlung:
Beste Zeit heute: 18:15 - 19:30 Uhr
Alternative Standorte: "Waldrand Süd" (81%)
```

### 4.5 Statistiken & Analysen

#### Dashboard
**Übersicht aktueller Monat:**
- Anzahl Ansitze
- Erfolgsquote
- Beobachtungen nach Wildart
- Meiste Aktivität: Wochentag, Uhrzeit
- Beste Ansitzeinrichtung

**Langzeit-Trends:**
- Erfolgskurve über Monate (Line Chart)
- Wildart-Verteilung (Pie Chart)
- Tageszeit-Heatmap (24h x 7 Tage)
- Mond-Phasen-Korrelation

**Standort-Vergleich:**
- Welcher Hochsitz ist am erfolgreichsten?
- Beste Zeiten pro Standort
- Wartungsbedarf

#### Export-Funktionen
- PDF-Bericht generieren (für Hegering, Behörden)
- CSV-Export (für Excel)
- Abschussliste nach Wildarten
- Fotogalerie

### 4.6 Wetter-Integration

#### Automatische Erfassung
- Bei "Ansitz starten": Wetter-API abfragen
- GPS-Position → nächste Wetterstation
- Daten cachen (max. 15min alt)

#### Wetter-API (Open-Meteo)
```javascript
async function fetchWeatherData(lat, lon, datetime) {
  const url = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,` +
    `precipitation,cloud_cover,pressure_msl` +
    `&timezone=Europe/Berlin`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  // Finde nächste Stunde
  const hourIndex = findNearestHourIndex(data.hourly.time, datetime);
  
  return {
    temperatur_celsius: data.hourly.temperature_2m[hourIndex],
    windrichtung: windDegreeToCardinal(data.hourly.wind_direction_10m[hourIndex]),
    windstaerke_bft: windSpeedToBeaufort(data.hourly.wind_speed_10m[hourIndex]),
    niederschlag_mm: data.hourly.precipitation[hourIndex],
    bewoelkung_prozent: data.hourly.cloud_cover[hourIndex],
    luftdruck_hpa: data.hourly.pressure_msl[hourIndex],
  };
}

function windDegreeToCardinal(deg) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}
```

#### Manuelle Eingabe (Offline-Modus)
- Wenn keine Netzverbindung: Formular zur manuellen Eingabe
- Vorausgefüllt mit letzten bekannten Werten
- Grobe Schätzung ausreichend

#### Wetter-Vorhersage für Planung
- 7-Tage-Vorhersage anzeigen
- "Beste Tage diese Woche" Empfehlung
- Push-Benachrichtigung: "Morgen ideale Bedingungen für Rehwild!"

---

## 5. UI/UX Design

### 5.1 Design-Prinzipien

1. **Mobile-First**: Alle Interaktionen primär für Touchscreen optimiert
2. **One-Hand-Usage**: Wichtige Buttons im Daumen-Bereich (unteres Drittel)
3. **Dark Mode**: Standard für Nachtjagd, helle Displays stören Wild
4. **Große Touch-Targets**: Minimum 44x44px (Apple HIG)
5. **Offline-Indicator**: Immer sichtbar wenn offline
6. **Schnellzugriff**: Häufigste Aktionen max. 2 Taps entfernt

### 5.2 Farbschema

**Light Mode:**
- Primary: Waldgrün #2d5016
- Secondary: Erdbraun #8b4513
- Accent: Signal-Orange #ff6b35
- Background: Weiß #ffffff
- Surface: Hellgrau #f5f5f5

**Dark Mode:**
- Primary: Gedämpftes Grün #4a7c2c
- Secondary: Warmbraun #a0663c
- Accent: Gedämpftes Orange #cc5529
- Background: Dunkelgrau #1a1a1a
- Surface: Mitteldunkel #2d2d2d

### 5.3 Navigation

**Bottom Navigation (Mobile)**
```
┌─────────────────────────────┐
│                             │
│     Haupt-Content           │
│                             │
│                             │
├─────────────────────────────┤
│ 🗺️    📊    ➕    📋    ⚙️ │
│ Karte Stats Ansitz Liste Menu│
└─────────────────────────────┘
```

**Tab-Struktur:**
1. **Karte**: Hauptscreen, Revierkarte mit allen Einrichtungen
2. **Statistiken**: Dashboard, Charts, Analysen
3. **Ansitz** (Center, hervorgehoben): Quick-Action "Ansitz starten"
4. **Liste**: Alle Ansitze, Beobachtungen, Historie
5. **Menü**: Einstellungen, Revierwechsel, Profil

### 5.4 Screen-Flows

#### Hauptflow: Ansitz starten
```
Karte → Tap auf Hochsitz → Info-Popup 
  → "Ansitz starten" Button → Schnellstart-Screen
  → Timer läuft → Beobachtungen erfassen
  → Ansitz beenden → Zusammenfassung → Speichern
```

#### Alternative: Quick-Ansitz
```
Bottom Nav → Center-Button "➕"
  → Modal: Standort auswählen
  → Sofort starten (mit Defaults)
```

### 5.5 Komponenten-Bibliothek

**Karten-Komponenten:**
- `<RevierMap>`: Basis-Karte mit OSM
- `<AnsitzMarker>`: Clickable Marker für Einrichtungen
- `<HeatmapLayer>`: Farboverlay für Erfolgswahrscheinlichkeit
- `<RevierBoundary>`: Polygon für Reviergrenzen
- `<UserPosition>`: GPS-Marker "Du bist hier"

**Formulare:**
- `<AnsitzForm>`: Vollständiges Formular für Ansitz
- `<QuickObservationForm>`: Minimal-Input für Beobachtung
- `<EinrichtungForm>`: Ansitzeinrichtung erstellen/bearbeiten

**Listen:**
- `<AnsitzListItem>`: Card für einen Ansitz in Liste
- `<BeobachtungChip>`: Kleines Pill für "2x Rehwild"

**Charts:**
- `<SuccessTrendChart>`: Line-Chart für Erfolgsquote
- `<WildartPieChart>`: Verteilung Wildarten
- `<HeatmapCalendar>`: 24x7 Heatmap Tageszeiten

---

## 6. Implementierungsplan

### Phase 1: MVP (8-10 Wochen)

**Woche 1-2: Setup & Infrastruktur**
- [ ] Projekt aufsetzen (Vite + React + TypeScript)
- [ ] Supabase Projekt erstellen, Datenbank-Schema deployen
- [ ] Authentication einrichten (Email/Password)
- [ ] Basis-Routing mit React Router
- [ ] Design-System aufsetzen (shadcn/ui + Tailwind)
- [ ] PWA-Manifest und Service Worker (basic)

**Woche 3-4: Revierverwaltung & Multi-User**
- [ ] Revier erstellen/bearbeiten
- [ ] Mitglieder einladen (Email-Flow)
- [ ] Berechtigungssystem implementieren
- [ ] RLS Policies testen
- [ ] Revierwechsel-Funktion

**Woche 5-6: Karte & Ansitzeinrichtungen**
- [ ] Leaflet.js Integration
- [ ] OSM Kartenmaterial einbinden
- [ ] Ansitzeinrichtungen anlegen auf Karte
- [ ] Marker-Icons & Popups
- [ ] CRUD für Einrichtungen
- [ ] Offline-Karten-Caching (basic)

**Woche 7-8: Ansitz-Erfassung**
- [ ] "Ansitz starten" Flow
- [ ] Timer-Funktion
- [ ] Beobachtungen während Ansitz erfassen
- [ ] Abschuss-Formular
- [ ] Wetter-API Integration (Open-Meteo)
- [ ] GPS-Position erfassen
- [ ] IndexedDB für Offline-Speicherung

**Woche 9-10: Basis-Statistiken & Testing**
- [ ] Einfaches Dashboard (Anzahl Ansitze, Erfolgsquote)
- [ ] Liste aller Ansitze
- [ ] Basic Charts (Erfolg über Zeit)
- [ ] Umfangreiches Testing (User-Flows)
- [ ] Bug-Fixes
- [ ] Deployment (Beta-Version)

**Deliverable Phase 1:**
- Funktionale PWA mit Kernnfunktionen
- Revier anlegen, Mitglieder einladen
- Ansitze erfassen und tracken
- Basis-Statistiken
- Offline-Funktionalität (basic)

### Phase 2: Heatmap & ML (6-8 Wochen)

**Woche 11-12: Daten-Aggregation**
- [ ] Heatmap-Cache-System implementieren
- [ ] Cron-Job für nächtliche Neuberechnung
- [ ] Historische Daten analysieren (min. 50 Ansitze als Test-Daten)

**Woche 13-15: ML-Modell entwickeln**
- [ ] Feature-Engineering (Zeitvariablen, Wetter, etc.)
- [ ] Modell trainieren (Python/Scikit-Learn oder TF)
- [ ] Modell evaluieren (Accuracy, Precision, Recall)
- [ ] Modell exportieren (ONNX oder TF.js Format)
- [ ] Modell in Frontend integrieren

**Woche 16-17: Heatmap-Visualisierung**
- [ ] Heatmap-Layer auf Karte
- [ ] Echtzeit-Anpassung basierend auf aktuellen Bedingungen
- [ ] Filter (Wildart, Zeitpunkt)
- [ ] Detailansicht "Warum diese Vorhersage?"
- [ ] Performance-Optimierung (große Reviere)

**Woche 18: Feinschliff & Testing**
- [ ] User-Testing mit Beta-Usern
- [ ] Feedback einarbeiten
- [ ] Edge-Cases behandeln (zu wenig Daten, etc.)

**Deliverable Phase 2:**
- Funktionierende Heatmap mit ML-Vorhersage
- User können optimale Ansitzzeiten finden
- Erklärbare Vorhersagen

### Phase 3: Advanced Features (4-6 Wochen)

**Woche 19-20: Erweiterte Statistiken**
- [ ] Detaillierte Charts (Tageszeit-Heatmap, Mondphasen-Korrelation)
- [ ] Standort-Vergleich
- [ ] Export-Funktionen (PDF, CSV)
- [ ] Jahresbericht generieren

**Woche 21-22: Premium-Features**
- [ ] Wildkamera-Bilder organisieren
- [ ] Foto-Upload & Galerie
- [ ] Push-Benachrichtigungen ("Ideale Bedingungen!")
- [ ] Erweiterte Offline-Funktionalität (komplette Revier-Karte cachen)

**Woche 23-24: Polish & Launch**
- [ ] Onboarding-Flow für neue User
- [ ] Tutorial/Guided Tour
- [ ] Performance-Optimierung
- [ ] A11y-Verbesserungen
- [ ] Öffentlicher Launch

---

## 7. Datenschutz & Compliance (DSGVO)

### 7.1 Datenschutz-Strategie

**Privacy-by-Design Prinzipien:**
1. **Datenminimierung**: Nur essenzielle Daten erfassen
2. **Zweckbindung**: Daten nur für Jagdplanung nutzen
3. **Transparenz**: Klare Datenschutzerklärung
4. **Nutzer-Kontrolle**: Daten jederzeit exportierbar/löschbar
5. **Keine Weitergabe**: Keine Daten an Dritte (außer Wetter-API)

### 7.2 Sensible Datentypen

**Besonders schützenswert:**
- GPS-Koordinaten von Ansitzeinrichtungen (Wilderei-Gefahr!)
- Persönliche Jagdschein-Daten
- Fotos (können Gesichter enthalten)
- Revier-Grenzen (Grundstücksinformationen)

**Maßnahmen:**
- **Verschlüsselung**: HTTPS, Datenbank-Encryption-at-Rest
- **Zugriffsbeschränkung**: RLS auf DB-Ebene
- **Anonymisierung**: Bei Community-Features grobe Rasterung
- **Opt-In**: Sensitive Features nur nach expliziter Zustimmung

### 7.3 Nutzerrechte (DSGVO Art. 15-21)

**Implementiert:**
- **Auskunftsrecht**: Kompletter Datenexport (JSON/ZIP)
- **Berichtigungsrecht**: Alle Daten bearbeitbar
- **Löschrecht**: Account-Löschung → alle Daten gelöscht (Ausnahme: Revier-Daten wenn andere Mitglieder existieren)
- **Widerspruchsrecht**: Analytics opt-out, Push-Benachrichtigungen deaktivierbar
- **Datenübertragbarkeit**: Export in standardisierten Formaten

### 7.4 Einwilligungen

**Bei Registrierung:**
- [ ] Nutzungsbedingungen akzeptieren
- [ ] Datenschutzerklärung akzeptieren
- [ ] Optional: Analytics erlauben (Matomo/Plausible, DSGVO-konform)

**Bei Features:**
- [ ] GPS-Zugriff (für Ansitz-Position)
- [ ] Kamera-Zugriff (für Fotos)
- [ ] Push-Benachrichtigungen

### 7.5 Datenverarbeiter (AVV)

**Externe Services:**
1. **Supabase** (Hosting & Datenbank)
   - Standort: EU (Frankfurt oder London)
   - AVV vorhanden: Ja
   - Datenübermittlung in Drittland: Nein

2. **Open-Meteo** (Wetter-API)
   - Standort: EU
   - Personenbezug: Nein (nur GPS-Koordinaten, keine User-ID)
   - AVV nötig: Nein (öffentliche API, keine persönlichen Daten)

3. **OpenStreetMap** (Karten)
   - Standort: Global (CDN)
   - Personenbezug: Nein
   - AVV nötig: Nein

### 7.6 Datenschutzerklärung (Template)

**Auszug:**
```
Welche Daten speichern wir?
- Accountdaten: Email, Name
- Jagddaten: Ansitze, Beobachtungen, GPS-Positionen
- Technische Daten: IP-Adresse (nur Log, 7 Tage)
- Fotos: Freiwillige Uploads

Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)

Speicherdauer: 
- Account-Daten: Bis zur Löschung
- Jagddaten: Bis zur Löschung durch Nutzer
- Logs: 7 Tage

Ihre Rechte:
- Auskunft, Berichtigung, Löschung, Einschränkung
- Widerspruch, Datenübertragbarkeit
- Beschwerde bei Aufsichtsbehörde

Kontakt Datenschutzbeauftragter: [Email]
```

---

## 8. Monetarisierung & Geschäftsmodell

### 8.1 Freemium-Modell

**Free Tier (kostenlos):**
- 1 Revier
- Bis zu 3 Mitglieder
- 50 Ansitzeinrichtungen
- Basis-Statistiken
- Heatmap mit Tages-Vorhersage
- Werbefrei

**Pro Tier (€4,99/Monat oder €49/Jahr):**
- Unbegrenzte Reviere
- Unbegrenzte Mitglieder
- Unbegrenzte Ansitzeinrichtungen
- Erweiterte Statistiken & Export
- 7-Tage Wettervorhersage
- Premium-Support
- Früher Zugang zu neuen Features

**Team Tier (€14,99/Monat):**
- Alle Pro Features
- Für Jagdgemeinschaften (bis 15 Personen)
- Gemeinsame Abschussplanung
- Erweiterte Rechteverwaltung
- Prioritäts-Support

### 8.2 Alternative Einnahmequellen

**White-Label für Verbände:**
- Landesjagdverbände/Hegering
- Individuelles Branding
- Einmalige Setup-Gebühr + jährliche Lizenz
- €2.000 Setup + €500/Jahr pro Verband

**Affiliate-Partnerschaften:**
- Jagdausrüstung (Optiken, Kleidung)
- Wildbret-Vermarktungs-Plattformen
- Jagdschul-Kooperationen

### 8.3 Kostenstruktur

**Fixkosten (monatlich):**
- Hosting (serverprofis.de): €8-15 (Shared Hosting inkl. SSL)
- Supabase: €25 (Pro Plan für bessere Limits)
- Domains ansitzplaner.de + pirschplaner.de: €2-3
- E-Mail-Service (Transaktional): €5
- Gesamt: ~€40-50/Monat

**Variable Kosten:**
- Storage (Fotos): ~€0.023/GB
- Bandwidth: ~€0.12/GB
- Wetter-API: €0 (Free Tier reicht)

**Break-Even:**
- Bei €50 Fixkosten → 10 Pro-Abos oder 4 Team-Abos
- Realistisch erreichbar nach 3-6 Monaten

---

## 9. Risiken & Herausforderungen

### 9.1 Technische Risiken

**Offline-Synchronisation:**
- **Problem**: Konflikte wenn mehrere User offline arbeiten
- **Lösung**: Last-Write-Wins mit Konflikt-Detection, User wird informiert

**Performance bei großen Revieren:**
- **Problem**: 500+ Ansitzeinrichtungen könnten Karte verlangsamen
- **Lösung**: Clustering (Marker gruppieren), Lazy-Loading, Viewport-basiertes Rendering

**ML-Modell Genauigkeit:**
- **Problem**: Zu wenig Daten → schlechte Vorhersagen
- **Lösung**: Min. 30 Ansitze pro Einrichtung empfehlen, Pre-Training mit synthetischen Daten

**Kartenmaterial Offline:**
- **Problem**: Offline-Karten können groß sein (mehrere MB)
- **Lösung**: Nur Revier-Umgebung cachen (~5km Radius), User kann Zoom-Level wählen

### 9.2 Rechtliche Risiken

**Wilderei-Missbrauch:**
- **Problem**: GPS-Daten könnten von Wilderern genutzt werden
- **Mitigation**: 
  - Keine öffentlichen Karten
  - 2FA für sensible Reviere
  - Sicherheitshinweise für User
  - Monitoring verdächtiger Aktivitäten

**Datenschutzverletzung:**
- **Problem**: Leak von sensiblen Jägerdaten
- **Mitigation**:
  - Regelmäßige Security-Audits
  - Penetration-Tests
  - Bug-Bounty-Programm (später)
  - Incident-Response-Plan

**Haftung bei Jagdunfall:**
- **Problem**: Könnten wir haftbar sein?
- **Mitigation**:
  - Klare Disclaimer: "Tool ersetzt keine Sicherheitsmaßnahmen"
  - Keine Echtzeit-Koordination von Schützen (Unfallgefahr)
  - AGB mit Haftungsausschluss

### 9.3 Markt-Risiken

**Konkurrenz:**
- **Bestehende Tools**: Hegehilfe, Jagdrevierplaner
- **Differenzierung**: ML-Heatmap ist Unique, modernes UX

**Nutzerakzeptanz:**
- **Problem**: Traditionelle Jäger nutzen ungern Apps
- **Lösung**: Einfaches Onboarding, klarer Mehrwert, Testimonials von Verbänden

**Skalierung:**
- **Problem**: Zu schnelles Wachstum → Performance-Probleme
- **Lösung**: Cloud-native Architektur, kann horizontal skalieren

---

## 10. Success Metrics & KPIs

### 10.1 Produkt-KPIs

**Engagement:**
- DAU/MAU (Daily/Monthly Active Users)
- Durchschnittliche Anzahl Ansitze pro User/Monat
- Retention (D1, D7, D30)
- Heatmap-Nutzung (% der User die Feature nutzen)

**Qualität:**
- ML-Modell Accuracy (Ziel: >70%)
- Fehlerrate bei Offline-Sync (<1%)
- App-Ladezeit (<2 Sekunden)
- Crash-Rate (<0.5%)

**Wachstum:**
- Neue Registrierungen/Woche
- Conversion Free → Pro (Ziel: 15%)
- Invite-Rate (neue User durch Einladungen)

### 10.2 Business-KPIs

- **MRR** (Monthly Recurring Revenue): Ziel €1.000 nach 6 Monaten
- **Churn-Rate**: <5% monatlich
- **Customer Acquisition Cost (CAC)**: <€20
- **Lifetime Value (LTV)**: >€100 (LTV/CAC > 5)

### 10.3 Meilensteine

**Monat 3:** 
- 50 aktive User
- 500 Ansitze erfasst
- 5 zahlende Kunden

**Monat 6:**
- 200 aktive User
- 3.000 Ansitze
- 30 zahlende Kunden (€150 MRR)

**Monat 12:**
- 1.000 aktive User
- 15.000 Ansitze
- 150 zahlende Kunden (€750 MRR)
- Erste Verbandspartnerschaft

---

## 11. Nächste Schritte

### Sofort (Woche 1)
1. **Technische Entscheidung treffen:**
   - Supabase vs. PocketBase vs. eigenes Backend?
   - Empfehlung: Supabase (schneller Start, skalierbar)

2. **Design-Mockups erstellen:**
   - Figma/Sketch für Haupt-Screens
   - User-Flow visualisieren
   - Mit potenziellen Usern validieren

3. **Projekt-Setup:**
   - GitHub Repository
   - Entwicklungsumgebung
   - CI/CD Pipeline (GitHub Actions)

### Kurzfristig (Monat 1)
4. **MVP-Entwicklung starten:**
   - Fokus auf Kern-Features (Karte, Ansitz-Erfassung)
   - Wöchentliche Sprints
   - Erste Testnutzer gewinnen (3-5 Jäger)

5. **Community aufbauen:**
   - Beta-Tester rekrutieren (Jagdforum, Facebook-Gruppen)
   - Feedback-Loop etablieren
   - Early-Adopter-Programm

### Mittelfristig (Monat 3-6)
6. **Beta-Launch:**
   - Öffentliche Beta (Free Tier)
   - Marketing-Push (Jagd-Zeitschriften, Online)
   - Erste zahlende Kunden

7. **ML-System entwickeln:**
   - Genug Daten sammeln (>1.000 Ansitze)
   - Modell trainieren & deployen
   - Heatmap-Feature launchen

### Langfristig (Jahr 1)
8. **Skalierung:**
   - Team erweitern (1-2 Entwickler)
   - Verbands-Partnerschaften
   - Internationalisierung (AT, CH)

---

## 12. FAQ für Entwicklung

**F: Warum Supabase statt eigenes Backend?**
A: Schnellerer Start, weniger Boilerplate, integrierte Auth + RLS, kosteneffizient für MVP. Kann später migriert werden falls nötig.

**F: Wie funktioniert Offline-Sync genau?**
A: IndexedDB als lokale DB, Service Worker cached Assets. Bei Online-Zustand: Delta-Sync mit Supabase. Konflikte werden erkannt und User informiert.

**F: Ist ML im Browser nicht zu langsam?**
A: Modell-Inferenz (Vorhersage) ist schnell genug (<100ms). Training bleibt serverseitig. TensorFlow.js kann WebGL nutzen für Beschleunigung.

**F: Wie skaliert die Heatmap bei 1000+ Revieren?**
A: Pre-Computation (Caching), nur sichtbare Tiles werden geladen, CDN für statische Assets. Supabase PostgreSQL skaliert gut.

**F: Was wenn User die App deinstalliert?**
A: Daten bleiben auf Server (Supabase), bei Neuinstallation/Login werden sie wiederhergestellt. User kann Account komplett löschen.

---

## Anhang: Code-Beispiele

### A1: Ansitz-Erfassung Hook (React)

```typescript
// hooks/useAnsitz.ts
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWeatherData } from './useWeatherData';
import { useGeolocation } from './useGeolocation';

interface AnsitzFormData {
  ansitzeinrichtung_id: string;
  beginn: Date;
  ende?: Date;
}

export function useAnsitz(revierId: string) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentAnsitz, setCurrentAnsitz] = useState<any>(null);
  const { position } = useGeolocation();
  const { fetchWeather } = useWeatherData();

  const startAnsitz = async (data: AnsitzFormData) => {
    // Wetter abrufen
    const wetter = position 
      ? await fetchWeather(position.lat, position.lng, data.beginn)
      : {};

    // Ansitz in DB erstellen
    const { data: ansitz, error } = await supabase
      .from('ansitze')
      .insert({
        revier_id: revierId,
        ansitzeinrichtung_id: data.ansitzeinrichtung_id,
        jaeger_id: (await supabase.auth.getUser()).data.user?.id,
        datum: data.beginn.toISOString().split('T')[0],
        beginn: data.beginn.toISOString(),
        bedingungen: wetter,
        erfolg: false,
      })
      .select()
      .single();

    if (error) throw error;

    setCurrentAnsitz(ansitz);
    setIsRunning(true);
    
    // Auch lokal speichern (Offline-Support)
    await saveToIndexedDB('current_ansitz', ansitz);
    
    return ansitz;
  };

  const addBeobachtung = async (beobachtung: any) => {
    const { error } = await supabase
      .from('beobachtungen')
      .insert({
        ansitz_id: currentAnsitz.id,
        revier_id: revierId,
        ...beobachtung,
        uhrzeit: new Date().toISOString(),
      });

    if (error) throw error;
  };

  const endAnsitz = async (erfolg: boolean, abschuss?: any) => {
    const ende = new Date();
    
    const { error } = await supabase
      .from('ansitze')
      .update({
        ende: ende.toISOString(),
        erfolg,
        abschuss,
      })
      .eq('id', currentAnsitz.id);

    if (error) throw error;

    setIsRunning(false);
    setCurrentAnsitz(null);
    
    await deleteFromIndexedDB('current_ansitz');
  };

  return {
    isRunning,
    currentAnsitz,
    startAnsitz,
    addBeobachtung,
    endAnsitz,
  };
}
```

### A2: Heatmap-Berechnung

```typescript
// lib/heatmap.ts
interface HeatmapParams {
  revierId: string;
  wildart: string;
  datetime: Date;
  currentWeather?: WeatherData;
}

export async function calculateHeatmapScores(params: HeatmapParams) {
  const { revierId, wildart, datetime, currentWeather } = params;
  
  // Hole alle Ansitzeinrichtungen
  const { data: einrichtungen } = await supabase
    .from('ansitzeinrichtungen')
    .select('*')
    .eq('revier_id', revierId);

  const scores = await Promise.all(
    einrichtungen.map(async (einrichtung) => {
      // Hole vorberechneten Cache-Wert
      const baseScore = await getCachedScore(
        einrichtung.id,
        datetime.getMonth() + 1,
        datetime.getHours(),
        wildart
      );

      // Passe an aktuelle Bedingungen an
      let adjustedScore = baseScore;

      if (currentWeather) {
        // Wetter-Bonus/Malus
        const weatherModifier = calculateWeatherModifier(
          currentWeather,
          einrichtung
        );
        adjustedScore *= (1 + weatherModifier);
      }

      // Jagddruck berücksichtigen
      const daysSinceLastHunt = await getDaysSinceLastHunt(einrichtung.id);
      const pressureModifier = Math.min(daysSinceLastHunt * 0.05, 0.3);
      adjustedScore *= (1 + pressureModifier);

      return {
        einrichtung_id: einrichtung.id,
        position: einrichtung.position,
        score: Math.min(100, Math.max(0, adjustedScore)),
      };
    })
  );

  return scores;
}

function calculateWeatherModifier(
  weather: WeatherData,
  einrichtung: any
): number {
  let modifier = 0;

  // Temperatur (ideal: 8-15°C)
  if (weather.temperatur_celsius >= 8 && weather.temperatur_celsius <= 15) {
    modifier += 0.15;
  } else if (
    weather.temperatur_celsius < 0 || 
    weather.temperatur_celsius > 25
  ) {
    modifier -= 0.1;
  }

  // Windrichtung
  if (
    einrichtung.guenstige_windrichtungen?.includes(weather.windrichtung)
  ) {
    modifier += 0.1;
  }

  // Starker Wind negativ
  if (weather.windstaerke_bft > 5) {
    modifier -= 0.15;
  }

  // Regen negativ
  if (weather.niederschlag_mm > 5) {
    modifier -= 0.2;
  }

  return modifier;
}
```

### A3: Supabase RLS Policy Beispiel

```sql
-- Policy: User kann nur Ansitze in seinen Revieren sehen
CREATE POLICY "Users can view ansitze in their reviere"
  ON ansitze
  FOR SELECT
  USING (
    revier_id IN (
      SELECT revier_id 
      FROM revier_mitglieder 
      WHERE user_id = auth.uid() 
        AND aktiv = true
    )
  );

-- Policy: User kann nur Ansitze in Revieren erstellen, 
-- wo er die Berechtigung hat
CREATE POLICY "Users can create ansitze in permitted reviere"
  ON ansitze
  FOR INSERT
  WITH CHECK (
    revier_id IN (
      SELECT revier_id 
      FROM revier_mitglieder 
      WHERE user_id = auth.uid() 
        AND aktiv = true
        AND (berechtigungen->>'ansitze_erstellen')::boolean = true
    )
  );

-- Policy: User kann nur eigene Ansitze bearbeiten
CREATE POLICY "Users can update own ansitze"
  ON ansitze
  FOR UPDATE
  USING (jaeger_id = auth.uid());
```

---

**Ende des Dokuments**

Dieses Konzept ist bewusst umfangreich gehalten, um alle wichtigen Aspekte abzudecken. Für die Umsetzung empfehle ich einen iterativen Ansatz: Start mit MVP (Phase 1), dann schrittweise erweitern basierend auf User-Feedback.

Bei Fragen zur Implementierung einzelner Features oder technischen Details stehe ich gerne zur Verfügung!
