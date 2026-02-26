import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App'
import './index.css'

// Sentry is only active in production and when DSN is configured
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.2,
    replaysOnErrorSampleRate: 1.0,
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<p style={{ padding: '2rem', color: 'red' }}>Ein unerwarteter Fehler ist aufgetreten. Bitte die Seite neu laden.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
