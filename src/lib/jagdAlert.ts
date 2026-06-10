import { fetchWeeklyForecast } from '@/lib/wetter'

const OPT_IN_KEY = 'ansitzplaner-jagdalert-optin'
const SHOWN_KEY_PREFIX = 'ansitzplaner-jagdalert-shown-'
const SCORE_THRESHOLD = 70

export function isJagdAlertEnabled(): boolean {
  return localStorage.getItem(OPT_IN_KEY) === 'true'
}

export function setJagdAlertEnabled(enabled: boolean): void {
  localStorage.setItem(OPT_IN_KEY, String(enabled))
}

export interface JagdAlert {
  datum: string       // YYYY-MM-DD (morgen)
  jagdScore: number
  notified: boolean   // true = System-Notification gezeigt, sonst In-App-Banner nötig
}

/**
 * Prüft beim App-Start, ob morgen besonders gute Jagdbedingungen herrschen
 * (Jagd-Score ≥ 70). Meldet sich pro Tag höchstens einmal.
 */
export async function checkJagdAlert(lat: number, lng: number): Promise<JagdAlert | null> {
  if (!isJagdAlertEnabled()) return null

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const shownKey = SHOWN_KEY_PREFIX + tomorrow
  if (localStorage.getItem(shownKey)) return null

  const forecast = await fetchWeeklyForecast(lat, lng)
  const tag = forecast.find((t) => t.datum === tomorrow)
  if (!tag || tag.jagdScore < SCORE_THRESHOLD) return null

  localStorage.setItem(shownKey, '1')

  let notified = false
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Gute Jagdbedingungen morgen 🎯', {
      body: `Jagd-Score ${tag.jagdScore}/100 – Details im Jagdwetter-Tab.`,
      icon: '/icons/icon.svg',
    })
    notified = true
  }

  return { datum: tag.datum, jagdScore: tag.jagdScore, notified }
}
