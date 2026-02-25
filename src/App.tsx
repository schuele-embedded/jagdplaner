import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from '@/store/useUserStore'
import { AuthGuard } from '@/components/ui/AuthGuard'
import { BottomNav } from '@/components/ui/BottomNav'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'
import { LoginPage } from '@/pages/LoginPage'
import { RegistrierungPage } from '@/pages/RegistrierungPage'
import { PasswortResetPage } from '@/pages/PasswortResetPage'
import { KartePage } from '@/pages/KartePage'
import { StatistikenPage } from '@/pages/StatistikenPage'
import { AnsitzPage } from '@/pages/AnsitzPage'
import { ListePage } from '@/pages/ListePage'
import { MenuPage } from '@/pages/MenuPage'

function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OfflineIndicator />
      <main className="flex flex-1 flex-col pb-16">
        <Routes>
          <Route path="/" element={<KartePage />} />
          <Route path="/statistiken" element={<StatistikenPage />} />
          <Route path="/ansitz" element={<AnsitzPage />} />
          <Route path="/liste" element={<ListePage />} />
          <Route path="/menue" element={<MenuPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const initialize = useUserStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registrierung" element={<RegistrierungPage />} />
        <Route path="/passwort-reset" element={<PasswortResetPage />} />

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

