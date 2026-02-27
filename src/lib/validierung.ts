import { z } from 'zod'

// -----------------------------------------------------------------------
// AnsitzPlaner – Zod Validation Schemas
// Inferred TypeScript types are re-exported for form usage.
// -----------------------------------------------------------------------

// ---- Shared enums ------------------------------------------------------

const wildartEnum = z.enum([
  'Rotwild', 'Rehwild', 'Schwarzwild', 'Damwild', 'Muffelwild', 'Gamswild',
  'Feldhase', 'Wildkaninchen', 'Fuchs', 'Dachs', 'Marder', 'Waschbaer',
  'Nutria', 'Fasan', 'Rebhuhn', 'Wildente', 'Wildgans', 'Tauben', 'Sonstiges',
])

const einrichtungTypEnum = z.enum([
  'Hochsitz', 'Kanzel', 'Drückjagdbock', 'Ansitzleiter', 'Feldansitz', 'Sonstiges',
])

const einrichtungZustandEnum = z.enum(['gut', 'mittel', 'schlecht', 'gesperrt'])

const rolleEnum = z.enum(['eigentuemer', 'jaeger', 'gaende', 'gast'])

const geschlechtEnum = z.enum(['maennlich', 'weiblich', 'unbekannt'])

const verhaltenEnum = z.enum(['aesend', 'ziehend', 'fliehend', 'ruhend', 'kaempfend', 'sonstiges'])

const windrichtungEnum = z.enum(['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'])

const niederschlagEnum = z.enum(['kein', 'leicht', 'mittel', 'stark'])

const mondphaseEnum = z.enum([
  'Neumond', 'zunehmend', 'Halbmond_zunehmend', 'Vollmond', 'abnehmend', 'Halbmond_abnehmend',
])

const gpsPositionSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

// ---- Revier ------------------------------------------------------------

export const RevierSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  beschreibung: z.string().max(1000).nullable().optional(),
  flaeche_ha: z.number().positive('Fläche muss positiv sein').nullable().optional(),
  grenze_geojson: z.any().nullable().optional(),
  settings: z.object({
    standard_wildarten: z.array(wildartEnum).min(1, 'Mindestens eine Wildart auswählen'),
    zeitzone: z.string().default('Europe/Berlin'),
    jagdzeiten: z.record(
      z.object({ von: z.string(), bis: z.string() }).nullable()
    ).optional().default({}),
    heatmap_enabled: z.boolean().default(true),
  }),
})

export type RevierFormValues = z.infer<typeof RevierSchema>

// ---- Ansitzeinrichtung -------------------------------------------------

export const AnsitzeinrichtungSchema = z.object({
  typ: einrichtungTypEnum,
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  beschreibung: z.string().max(500).nullable().optional(),
  position: gpsPositionSchema,
  hoehe_meter: z.preprocess(
    (v) => (v === '' || v === null || (typeof v === 'number' && isNaN(v)) ? null : Number(v)),
    z.number().min(0).max(50).nullable().optional()
  ),
  ausrichtung_grad: z.preprocess(
    (v) => (v === '' || v === null || (typeof v === 'number' && isNaN(v)) ? null : Number(v)),
    z.number().min(0).max(359).nullable().optional()
  ),
  sichtweite_meter: z.preprocess(
    (v) => (v === '' || v === null || (typeof v === 'number' && isNaN(v)) ? null : Number(v)),
    z.number().min(0).max(5000).nullable().optional()
  ),
  zustand: einrichtungZustandEnum.default('gut'),
  letzte_wartung: z.string().nullable().optional(),
  naechste_wartung: z.string().nullable().optional(),
  notizen: z.string().max(1000).nullable().optional(),
  guenstige_windrichtungen: z.array(windrichtungEnum).default([]),
})

export type AnsitzeinrichtungFormValues = z.infer<typeof AnsitzeinrichtungSchema>

// ---- Ansitz ------------------------------------------------------------

const bedingungenSchema = z.object({
  temperatur_celsius: z.number().min(-40).max(50).nullable().optional(),
  windrichtung: windrichtungEnum.nullable().optional(),
  windstaerke_bft: z.number().min(0).max(12).nullable().optional(),
  niederschlag: niederschlagEnum.default('kein'),
  bewoelkung_prozent: z.number().min(0).max(100).nullable().optional(),
  luftdruck_hpa: z.number().min(900).max(1100).nullable().optional(),
  mondphase: mondphaseEnum.nullable().optional(),
  sichtweite: z.enum(['gut', 'mittel', 'schlecht']).nullable().optional(),
})

export const AnsitzSchema = z.object({
  ansitzeinrichtung_id: z.string().uuid('Ungültige Einrichtungs-ID'),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  beginn: z.string().datetime({ message: 'Ungültige Uhrzeit' }),
  ende: z.string().datetime({ message: 'Ungültige Uhrzeit' }).nullable().optional(),
  bedingungen: bedingungenSchema,
  notizen: z.string().max(2000).nullable().optional(),
})

export type AnsitzFormValues = z.infer<typeof AnsitzSchema>

// ---- Beobachtung -------------------------------------------------------

export const BeobachtungSchema = z.object({
  wildart: wildartEnum,
  anzahl: z.number().int().min(1, 'Mindestens 1').max(999),
  geschlecht: geschlechtEnum.default('unbekannt'),
  verhalten: verhaltenEnum,
  position: gpsPositionSchema.nullable().optional(),
  uhrzeit: z.string().datetime({ message: 'Ungültige Uhrzeit' }),
  entfernung_meter: z.number().min(0).max(5000).nullable().optional(),
  notizen: z.string().max(1000).nullable().optional(),
})

export type BeobachtungFormValues = z.infer<typeof BeobachtungSchema>

// ---- Abschuss ----------------------------------------------------------

export const AbschussSchema = z.object({
  wildart: wildartEnum,
  anzahl: z.number().int().min(1).max(99),
  geschlecht: geschlechtEnum,
  gewicht_kg: z.number().min(0).max(500).nullable().optional(),
  alter_jahre: z.number().min(0).max(30).nullable().optional(),
  notizen: z.string().max(1000).nullable().optional(),
})

export type AbschussFormValues = z.infer<typeof AbschussSchema>

// ---- RevierMitglied (Einladung) ----------------------------------------

export const EinladungSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  rolle: rolleEnum,
  berechtigungen: z.object({
    ansitze_erstellen: z.boolean(),
    einrichtungen_verwalten: z.boolean(),
    mitglieder_einladen: z.boolean(),
    statistiken_sehen: z.boolean(),
    revier_bearbeiten: z.boolean(),
  }),
})

export type EinladungFormValues = z.infer<typeof EinladungSchema>
