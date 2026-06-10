import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { List } from 'lucide-react'
import { useUserStore } from '@/store/useUserStore'
import { useRevierStore } from '@/store/useRevierStore'
import { registerSyncOnReconnect } from '@/lib/indexeddb'
import { AuthGuard } from '@/components/ui/AuthGuard'
import { BottomNav } from '@/components/ui/BottomNav'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'
import { RevierWechsler } from '@/components/revier/RevierWechsler'
import { OnboardingModal } from '@/components/revier/OnboardingModal'
import { LoginPage } from '@/pages/LoginPage'
import { RegistrierungPage } from '@/pages/RegistrierungPage'
import { PasswortResetPage } from '@/pages/PasswortResetPage'
import { KartePage } from '@/pages/KartePage'
import { StatistikenPage } from '@/pages/StatistikenPage'
import { AnsitzPage } from '@/pages/AnsitzPage'
import { ListePage } from '@/pages/ListePage'
import { MenuPage } from '@/pages/MenuPage'
import { WetterPage } from '@/pages/WetterPage'
import { ImpressumPage } from '@/pages/ImpressumPage'
import { DatenschutzPage } from '@/pages/DatenschutzPage'
import { CookieNotice } from '@/components/CookieNotice'

function AppShell() {
  const { reviere, loading } = useRevierStore()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OfflineIndicator />

      {/* Header */}
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b bg-background/95 px-3 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <RevierWechsler />
          <Link
            to="/liste"
            aria-label="Ansitz-Liste"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <List className="h-5 w-5" />
          </Link>
        </div>
        <span className="text-xs font-medium rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
          Beta&nbsp;v{__APP_VERSION__}
        </span>
      </header>

      <main className="flex flex-1 flex-col pb-16">
        <Routes>
          <Route path="/" element={<KartePage />} />
          <Route path="/statistiken" element={<StatistikenPage />} />
          <Route path="/ansitz" element={<AnsitzPage />} />
          <Route path="/ansitz/aktiv" element={<AnsitzPage />} />
          <Route path="/liste" element={<ListePage />} />
          <Route path="/wetter" element={<WetterPage />} />
          <Route path="/menue" element={<MenuPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <BottomNav />

      {/* Onboarding: erstes Revier anlegen */}
      {!loading && <OnboardingModal open={reviere.length === 0} />}

      <CookieNotice />
    </div>
  )
}

export default function App() {
  const initialize = useUserStore((s) => s.initialize)
  const user = useUserStore((s) => s.user)
  const loadReviere = useRevierStore((s) => s.loadReviere)

  useEffect(() => {
    initialize()
    const unregister = registerSyncOnReconnect()
    return unregister
  }, [initialize])

  useEffect(() => {
    if (user) loadReviere()
  }, [user, loadReviere])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registrierung" element={<RegistrierungPage />} />
        <Route path="/passwort-reset" element={<PasswortResetPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

