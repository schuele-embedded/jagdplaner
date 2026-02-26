// Datenschutzerklärung gemäß DSGVO Art. 13/14

export function DatenschutzPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-6 max-w-2xl mx-auto text-sm">
      <h1 className="text-xl font-bold">Datenschutzerklärung</h1>

      <section className="space-y-2">
        <h2 className="font-semibold text-base">1. Verantwortlicher</h2>
        <p>
          Florian Schüle<br />
          Attentalstr. 20<br />
          79252 Stegen<br />
          E-Mail: <a href="mailto:info@schuele-embedded.de" className="text-primary underline">info@schuele-embedded.de</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base">2. Welche Daten wir verarbeiten</h2>
        <p>AnsitzPlaner ist eine <strong>Offline-First-App</strong>. Die meisten Daten werden ausschließlich lokal auf Ihrem Gerät gespeichert:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li><strong>Standortdaten</strong> (GPS): nur lokal, nie automatisch an Server übertragen</li>
          <li><strong>Jagddaten</strong> (Ansitze, Beobachtungen, Einrichtungen): lokal in IndexedDB; optionale Synchronisierung zu Supabase nur nach Anmeldung</li>
          <li><strong>Zugangsdaten</strong> (E-Mail, Passwort-Hash): bei Nutzung der Cloud-Funktion bei Supabase gespeichert</li>
          <li><strong>Wetterdaten</strong>: werden von Open-Meteo abgerufen (keine personenbezogenen Daten übertragen)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base">3. Rechtsgrundlagen (DSGVO)</h2>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Art. 6 Abs. 1 lit. b DSGVO – Vertragserfüllung (Bereitstellung der App-Funktionen)</li>
          <li>Art. 6 Abs. 1 lit. f DSGVO – Berechtigtes Interesse (Sicherheit, Fehleranalyse)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base">4. Drittanbieter</h2>

        <div className="space-y-3">
          <div>
            <p className="font-medium">Supabase (Cloud-Synchronisierung)</p>
            <p className="text-muted-foreground">
              Bei aktivierter Cloud-Synchronisierung werden Jagddaten bei Supabase Inc. gespeichert.
              Server-Region: EU Frankfurt (AWS eu-central-1). Supabase verarbeitet Daten im Auftrag
              (Auftragsverarbeitungsvertrag / DPA vorhanden).
              Datenschutz: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">supabase.com/privacy</a>
            </p>
          </div>

          <div>
            <p className="font-medium">Open-Meteo (Wetterdaten)</p>
            <p className="text-muted-foreground">
              Wetterdaten werden von Open-Meteo abgerufen. Es werden keine personenbezogenen Daten
              übertragen. Open-Meteo ist eine kostenlose, DSGVO-konforme Wetter-API mit Servern in Österreich.
              Datenschutz: <a href="https://open-meteo.com/en/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">open-meteo.com/en/terms</a>
            </p>
          </div>

          <div>
            <p className="font-medium">OpenStreetMap (Kartenmaterial)</p>
            <p className="text-muted-foreground">
              Karten-Kacheln werden von OpenStreetMap-Servern geladen. Dabei wird Ihre IP-Adresse an
              die Tile-Server übermittelt. OSM ist ein gemeinnütziges Open-Data-Projekt.
              Datenschutz: <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">osmfoundation.org/Privacy_Policy</a>
            </p>
          </div>

          <div>
            <p className="font-medium">Sentry (Fehler-Monitoring, optional)</p>
            <p className="text-muted-foreground">
              Zur Analyse von Anwendungsfehlern kann anonymisiertes Fehler-Tracking via Sentry genutzt
              werden. Es werden keine Namen, E-Mail-Adressen oder Standortdaten übertragen.
              Datenschutz: <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary underline">sentry.io/privacy</a>
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base">5. Lokaler Speicher</h2>
        <p className="text-muted-foreground">
          Die App verwendet <strong>localStorage</strong> und <strong>IndexedDB</strong> (im Browser), um
          Jagddaten offline verfügbar zu halten. Diese Daten verlassen Ihr Gerät nicht, es sei denn, Sie
          aktivieren die Cloud-Synchronisierung. Sie können diese Daten jederzeit über die
          Browser-Einstellungen löschen.
        </p>
        <p className="text-muted-foreground">
          Supabase Auth verwendet technisch notwendige Session-Cookies (<code>sb-*</code>), die für die
          Anmeldung erforderlich sind.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base">6. Ihre Rechte (Art. 15–21 DSGVO)</h2>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li><strong>Auskunft</strong> (Art. 15): Welche Daten wir über Sie speichern</li>
          <li><strong>Berichtigung</strong> (Art. 16): Korrektur unrichtiger Daten</li>
          <li><strong>Löschung</strong> (Art. 17): "Recht auf Vergessenwerden"</li>
          <li><strong>Einschränkung</strong> (Art. 18): Einschränkung der Verarbeitung</li>
          <li><strong>Datenübertragbarkeit</strong> (Art. 20): Export Ihrer Daten</li>
          <li><strong>Widerspruch</strong> (Art. 21): Widerspruch gegen die Verarbeitung</li>
        </ul>
        <p className="text-muted-foreground">
          Anfragen richten Sie bitte an:{' '}
          <a href="mailto:info@schuele-embedded.de" className="text-primary underline">info@schuele-embedded.de</a>
        </p>
        <p className="text-muted-foreground">
          Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
        </p>
      </section>

      <section className="space-y-1">
        <h2 className="font-semibold text-base">7. Aktualität</h2>
        <p className="text-muted-foreground">Stand: Februar 2026</p>
      </section>
    </div>
  )
}
