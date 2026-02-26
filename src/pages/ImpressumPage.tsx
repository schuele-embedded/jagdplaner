// Impressum gemäß §5 TMG

export function ImpressumPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">Impressum</h1>

      <section className="space-y-1 text-sm">
        <h2 className="font-semibold text-base">Angaben gemäß §5 TMG</h2>
        <p className="font-medium">Florian Schüle</p>
        <p>Attentalstr. 20</p>
        <p>79252 Stegen</p>
      </section>

      <section className="space-y-1 text-sm">
        <h2 className="font-semibold text-base">Kontakt</h2>
        <p>E-Mail: <a href="mailto:info@schuele-embedded.de" className="text-primary underline">info@schuele-embedded.de</a></p>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-semibold text-base">EU-Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
        </p>
        <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section className="space-y-1 text-sm">
        <h2 className="font-semibold text-base">Haftung für Inhalte</h2>
        <p className="text-muted-foreground">
          Als Diensteanbieter sind wir gemäß §7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach
          den allgemeinen Gesetzen verantwortlich. Nach §§8 bis 10 TMG sind wir als Diensteanbieter
          jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen
          oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
        </p>
      </section>
    </div>
  )
}
