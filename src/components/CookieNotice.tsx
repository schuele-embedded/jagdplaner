import { useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'ansitzplaner-cookie-notice-accepted'

export function CookieNotice() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  if (dismissed) return null

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 p-3">
      <div className="rounded-xl border bg-background shadow-lg p-4 flex flex-col gap-3 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground">
          AnsitzPlaner verwendet ausschließlich <strong>technisch notwendige Cookies</strong> und
          lokalen Browser-Speicher. Kein Tracking, keine Werbung.{' '}
          <Link to="/datenschutz" className="text-primary underline">
            Datenschutzerklärung
          </Link>
        </p>
        <button
          onClick={accept}
          className="self-end rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Verstanden
        </button>
      </div>
    </div>
  )
}
