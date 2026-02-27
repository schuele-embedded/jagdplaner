import type { Ansitzeinrichtung, Ansitz, Wildart, Windrichtung, Mondphase } from '@/types'

// ---- Types ----------------------------------------------------------------

export interface HeatmapParams {
  monat: number           // 1–12
  stundeVon: number       // 0–23
  stundeBis: number       // 0–23
  wildart: Wildart | 'alle'
  wetter: {
    windrichtung?: Windrichtung | null
    niederschlag_mm?: number | null
    temperatur_celsius?: number | null
    bewoelkung_prozent?: number | null
  }
  mondphase: Mondphase | null
  aktuellesDatum: Date
}

export interface HeatmapScore {
  einrichtungId: string
  score: number           // 0–100, clamped
  datenpunkte: number     // number of Ansitze used as basis
  faktoren: {
    basis: number         // 0–100, historical success rate
    wetter: number        // multiplier (e.g. 1.2 = +20%)
    mond: number          // multiplier
    jagddruck: number     // multiplier
  }
}

// ---- Helper factors -------------------------------------------------------

function calcWetterFaktor(
  einrichtung: Ansitzeinrichtung,
  wetter: HeatmapParams['wetter']
): number {
  let f = 1.0

  // Wind direction: favorable = +20%, unfavorable = -15%
  if (wetter.windrichtung && einrichtung.guenstige_windrichtungen.length > 0) {
    if (einrichtung.guenstige_windrichtungen.includes(wetter.windrichtung)) {
      f += 0.2
    } else {
      f -= 0.15
    }
  }

  // Rain > 2 mm: unfavorable
  if (wetter.niederschlag_mm != null && wetter.niederschlag_mm > 2) {
    f -= 0.2
  }

  // Temperature 5–15 °C: favorable
  if (wetter.temperatur_celsius != null) {
    if (wetter.temperatur_celsius >= 5 && wetter.temperatur_celsius <= 15) {
      f += 0.1
    } else if (wetter.temperatur_celsius > 25 || wetter.temperatur_celsius < -5) {
      f -= 0.1
    }
  }

  // Cloud cover 30–70%: diffuse light, wildlife more active
  if (wetter.bewoelkung_prozent != null) {
    if (wetter.bewoelkung_prozent >= 30 && wetter.bewoelkung_prozent <= 70) {
      f += 0.05
    }
  }

  return Math.max(0.5, Math.min(1.5, f))
}

function calcMondFaktor(mondphase: Mondphase | null): number {
  if (mondphase === 'Neumond') return 1.1
  if (mondphase === 'Vollmond') return 0.85
  return 1.0
}

function calcJagddruckFaktor(ansitzeHier: Ansitz[], aktuellesDatum: Date): number {
  if (ansitzeHier.length === 0) return 1.2 // never hunted → well-rested

  const letzterAnsitz = ansitzeHier
    .filter((a) => new Date(a.beginn) < aktuellesDatum)
    .sort((a, b) => new Date(b.beginn).getTime() - new Date(a.beginn).getTime())[0]

  if (!letzterAnsitz) return 1.2

  const tage =
    (aktuellesDatum.getTime() - new Date(letzterAnsitz.beginn).getTime()) /
    (1000 * 60 * 60 * 24)

  if (tage >= 7) return 1.2  // well-rested
  if (tage >= 3) return 1.0  // neutral
  return 0.7                  // high hunting pressure
}

// ---- Main function --------------------------------------------------------

export function calculateHeatmapScores(
  einrichtungen: Ansitzeinrichtung[],
  ansitze: Ansitz[],
  params: HeatmapParams
): HeatmapScore[] {
  const { monat, stundeVon, stundeBis, wildart, wetter, mondphase, aktuellesDatum } = params

  return einrichtungen.map((einrichtung) => {
    const ansitzeHier = ansitze.filter(
      (a) => a.ansitzeinrichtung_id === einrichtung.id
    )

    // Filter by wildart
    const relevantAnsitze =
      wildart === 'alle'
        ? ansitzeHier
        : ansitzeHier.filter(
            (a) =>
              a.beobachtungen.some((b) => b.wildart === wildart) ||
              a.abschuss?.wildart === wildart
          )

    // Filter by season (month ±1, wrapping around year)
    const saisonAnsitze = relevantAnsitze.filter((a) => {
      const m = new Date(a.beginn).getMonth() + 1
      const diff = Math.abs(m - monat)
      return diff <= 1 || diff >= 11 // handles Jan/Dec wrapping
    })

    // Filter by time window (±1h buffer)
    const vonMitPuffer = Math.max(0, stundeVon - 1)
    const bisMitPuffer = Math.min(23, stundeBis + 1)
    const zeitAnsitze = saisonAnsitze.filter((a) => {
      const stunde = new Date(a.beginn).getHours()
      return stunde >= vonMitPuffer && stunde <= bisMitPuffer
    })

    // Base score: need ≥ 5 data points for meaningful result
    const datenpunkte = zeitAnsitze.length
    let basis: number
    if (datenpunkte < 5) {
      basis = 50 // neutral fallback — not enough data
    } else {
      const erfolge = zeitAnsitze.filter((a) => a.erfolg).length
      basis = (erfolge / datenpunkte) * 100
    }

    const wFaktor = calcWetterFaktor(einrichtung, wetter)
    const mFaktor = calcMondFaktor(mondphase)
    const jFaktor = calcJagddruckFaktor(ansitzeHier, aktuellesDatum)

    const score = Math.round(
      Math.max(0, Math.min(100, basis * wFaktor * mFaktor * jFaktor))
    )

    return {
      einrichtungId: einrichtung.id,
      score,
      datenpunkte,
      faktoren: {
        basis: Math.round(basis),
        wetter: Math.round(wFaktor * 100) / 100,
        mond: Math.round(mFaktor * 100) / 100,
        jagddruck: Math.round(jFaktor * 100) / 100,
      },
    }
  })
}

// ---- Best-time finder (used by VorhersageWidget) -------------------------

export interface BestTimeResult {
  einrichtungId: string
  score: number
  stundeVon: number
  stundeBis: number
}

/**
 * Calculates scores for each hour of the day and returns the 2-hour window
 * with the highest average score per Einrichtung.
 */
export function findBestTimes(
  einrichtungen: Ansitzeinrichtung[],
  ansitze: Ansitz[],
  baseParams: Omit<HeatmapParams, 'stundeVon' | 'stundeBis'>
): BestTimeResult[] {
  // Score every 2-hour window across the day
  const windows = Array.from({ length: 12 }, (_, i) => ({
    von: i * 2,
    bis: i * 2 + 1,
  }))

  return einrichtungen.map((einrichtung) => {
    let bestScore = 0
    let bestVon = 17
    let bestBis = 19

    for (const { von, bis } of windows) {
      const scores = calculateHeatmapScores([einrichtung], ansitze, {
        ...baseParams,
        stundeVon: von,
        stundeBis: bis,
      })
      if (scores[0] && scores[0].score > bestScore) {
        bestScore = scores[0].score
        bestVon = von
        bestBis = bis
      }
    }

    return { einrichtungId: einrichtung.id, score: bestScore, stundeVon: bestVon, stundeBis: bestBis }
  })
}

// ---- Color helper ---------------------------------------------------------

export function scoreToColor(score: number, datenpunkte: number): string {
  if (datenpunkte < 5) return '#9ca3af' // gray – not enough data
  if (score >= 75) return '#22c55e'     // green
  if (score >= 50) return '#eab308'     // yellow
  if (score >= 25) return '#f97316'     // orange
  return '#ef4444'                      // red
}
