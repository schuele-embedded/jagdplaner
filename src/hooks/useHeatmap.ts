import { useMemo, useState } from 'react'
import { calculateHeatmapScores, findBestTimes, type HeatmapScore, type BestTimeResult } from '@/lib/heatmap'
import { useEinrichtungen } from '@/hooks/useEinrichtungen'
import { useAnsitze } from '@/hooks/useAnsitze'
import { useWeatherData } from '@/hooks/useWeatherData'
import { useGeolocation } from '@/hooks/useGeolocation'
import { getMoonPhase } from '@/lib/mondphase'
import type { Wildart } from '@/types'

export interface UseHeatmapResult {
  scores: HeatmapScore[]
  bestTimes: BestTimeResult[]
  loading: boolean
  wildart: Wildart | 'alle'
  stundeVon: number
  stundeBis: number
  setWildart: (w: Wildart | 'alle') => void
  setZeit: (von: number, bis: number) => void
}

export function useHeatmap(): UseHeatmapResult {
  const { einrichtungen, loading: eLoading } = useEinrichtungen()
  const { ansitze, loading: aLoading } = useAnsitze()
  const { position } = useGeolocation(false)
  const { wetter } = useWeatherData(position?.lat ?? null, position?.lng ?? null)

  const [wildart, setWildart] = useState<Wildart | 'alle'>('alle')
  const [stundeVon, setStundeVon] = useState(5)
  const [stundeBis, setStundeBis] = useState(21)

  function setZeit(von: number, bis: number) {
    setStundeVon(von)
    setStundeBis(bis)
  }

  const now = new Date()

  const baseParams = useMemo(() => ({
    monat: now.getMonth() + 1,
    wildart,
    wetter: {
      windrichtung: wetter?.windrichtung ?? null,
      niederschlag_mm: wetter?.niederschlag_mm ?? null,
      temperatur_celsius: wetter?.temperatur_celsius ?? null,
      bewoelkung_prozent: wetter?.bewoelkung_prozent ?? null,
    },
    mondphase: wetter?.mondphase ?? getMoonPhase(now),
    aktuellesDatum: now,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [wildart, wetter])

  const scores = useMemo(() => {
    if (einrichtungen.length === 0) return []
    return calculateHeatmapScores(einrichtungen, ansitze, {
      ...baseParams,
      stundeVon,
      stundeBis,
    })
  }, [einrichtungen, ansitze, baseParams, stundeVon, stundeBis])

  const bestTimes = useMemo(() => {
    if (einrichtungen.length === 0) return []
    return findBestTimes(einrichtungen, ansitze, baseParams)
  }, [einrichtungen, ansitze, baseParams])

  return {
    scores,
    bestTimes,
    loading: eLoading || aLoading,
    wildart,
    stundeVon,
    stundeBis,
    setWildart,
    setZeit,
  }
}
