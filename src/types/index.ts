// -----------------------------------------------------------------------
// JagdPlaner – Central TypeScript Types
// Naming: English identifiers, German domain values (Wildart, Rolle etc.)
// -----------------------------------------------------------------------

// ---- Enums & literal unions ------------------------------------------

export type Wildart =
  | 'Rotwild'
  | 'Rehwild'
  | 'Schwarzwild'
  | 'Damwild'
  | 'Muffelwild'
  | 'Gamswild'
  | 'Feldhase'
  | 'Wildkaninchen'
  | 'Fuchs'
  | 'Dachs'
  | 'Marder'
  | 'Waschbaer'
  | 'Nutria'
  | 'Fasan'
  | 'Rebhuhn'
  | 'Wildente'
  | 'Wildgans'
  | 'Tauben'
  | 'Sonstiges'

export type EinrichtungTyp =
  | 'Hochsitz'
  | 'Kanzel'
  | 'Drückjagdbock'
  | 'Ansitzleiter'
  | 'Feldansitz'
  | 'Sonstiges'

export type EinrichtungZustand = 'gut' | 'mittel' | 'schlecht' | 'gesperrt'

export type Rolle = 'eigentuemer' | 'jaeger' | 'gaende' | 'gast'

export type Geschlecht = 'maennlich' | 'weiblich' | 'unbekannt'

export type Verhalten =
  | 'aesend'
  | 'ziehend'
  | 'fliehend'
  | 'ruhend'
  | 'kaempfend'
  | 'sonstiges'

export type Windrichtung = 'N' | 'NO' | 'O' | 'SO' | 'S' | 'SW' | 'W' | 'NW'

export type Niederschlag = 'kein' | 'leicht' | 'mittel' | 'stark'

export type Mondphase =
  | 'Neumond'
  | 'zunehmend'
  | 'Halbmond_zunehmend'
  | 'Vollmond'
  | 'abnehmend'
  | 'Halbmond_abnehmend'

// ---- Core models -------------------------------------------------------

export interface RevierSettings {
  standard_wildarten: Wildart[]
  zeitzone: string
  jagdzeiten: Record<Wildart, { von: string; bis: string } | null>
  heatmap_enabled: boolean
}

export interface Revier {
  id: string
  name: string
  beschreibung: string | null
  flaeche_ha: number | null
  grenze_geojson: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  eigentuemer_id: string
  settings: RevierSettings
  created_at: string
}

export interface GpsPosition {
  lat: number
  lng: number
}

export interface Ansitzeinrichtung {
  id: string
  revier_id: string
  typ: EinrichtungTyp
  name: string
  beschreibung: string | null
  position: GpsPosition
  hoehe_meter: number | null
  ausrichtung_grad: number | null    // 0–359
  sichtweite_meter: number | null
  zustand: EinrichtungZustand
  letzte_wartung: string | null      // ISO date
  naechste_wartung: string | null    // ISO date
  fotos: string[]
  notizen: string | null
  guenstige_windrichtungen: Windrichtung[]
  created_at: string
  created_by: string
}

export interface Beobachtung {
  id: string
  ansitz_id: string
  revier_id: string
  wildart: Wildart
  anzahl: number
  geschlecht: Geschlecht
  verhalten: Verhalten
  position: GpsPosition | null
  uhrzeit: string                    // ISO datetime
  entfernung_meter: number | null
  notizen: string | null
  fotos: string[]
  created_at: string
}

export interface Abschuss {
  wildart: Wildart
  anzahl: number
  geschlecht: Geschlecht
  gewicht_kg: number | null
  alter_jahre: number | null
  notizen: string | null
}

export interface Bedingungen {
  temperatur_celsius: number | null
  windrichtung: Windrichtung | null
  windstaerke_bft: number | null     // 0–12
  niederschlag: Niederschlag
  bewoelkung_prozent: number | null  // 0–100
  luftdruck_hpa: number | null
  mondphase: Mondphase | null
  sichtweite: 'gut' | 'mittel' | 'schlecht' | null
}

export interface Ansitz {
  id: string
  revier_id: string
  ansitzeinrichtung_id: string
  jaeger_id: string
  datum: string                      // ISO date YYYY-MM-DD
  beginn: string                     // ISO datetime
  ende: string | null                // ISO datetime
  bedingungen: Bedingungen
  erfolg: boolean
  abschuss: Abschuss | null
  beobachtungen: Beobachtung[]
  notizen: string | null
  created_at: string
}

export interface Berechtigungen {
  ansitze_erstellen: boolean
  einrichtungen_verwalten: boolean
  mitglieder_einladen: boolean
  statistiken_sehen: boolean
  revier_bearbeiten: boolean
}

export const ROLE_PRESETS: Record<Rolle, Berechtigungen> = {
  eigentuemer: {
    ansitze_erstellen: true,
    einrichtungen_verwalten: true,
    mitglieder_einladen: true,
    statistiken_sehen: true,
    revier_bearbeiten: true,
  },
  jaeger: {
    ansitze_erstellen: true,
    einrichtungen_verwalten: false,
    mitglieder_einladen: false,
    statistiken_sehen: true,
    revier_bearbeiten: false,
  },
  gaende: {
    ansitze_erstellen: true,
    einrichtungen_verwalten: false,
    mitglieder_einladen: false,
    statistiken_sehen: false,
    revier_bearbeiten: false,
  },
  gast: {
    ansitze_erstellen: false,
    einrichtungen_verwalten: false,
    mitglieder_einladen: false,
    statistiken_sehen: false,
    revier_bearbeiten: false,
  },
}

export interface RevierMitglied {
  id: string
  revier_id: string
  user_id: string
  rolle: Rolle
  berechtigungen: Berechtigungen
  eingeladen_von: string | null
  eingeladen_am: string | null
  aktiv: boolean
}

export interface User {
  id: string
  email: string
  name: string
  settings: {
    standard_revier_id: string | null
    push_notifications: boolean
    dark_mode: boolean
  }
}

export interface WetterDaten {
  temperatur_celsius: number
  windrichtung: Windrichtung
  windstaerke_bft: number
  niederschlag_mm: number
  bewoelkung_prozent: number
  luftdruck_hpa: number
  mondphase: Mondphase
  sonnenaufgang: string              // HH:mm
  sonnenuntergang: string            // HH:mm
  fetched_at: string                 // ISO datetime
}

// ---- Heatmap -----------------------------------------------------------

export interface HeatmapData {
  einrichtung_id: string
  revier_id: string
  wildart: Wildart
  zeitslot: 'frueh' | 'morgen' | 'mittag' | 'abend' | 'naechts'
  erfolgsquote: number               // 0–1
  anzahl_ansitze: number
  zuletzt_berechnet: string          // ISO datetime
}
