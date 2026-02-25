import { useEffect, useState } from 'react'
import { UserPlus, Trash2, Crown, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRevier } from '@/hooks/useRevier'
import { useUserStore } from '@/store/useUserStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLE_PRESETS } from '@/types'
import type { RevierMitglied, Rolle } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

const ROLLE_LABELS: Record<Rolle, string> = {
  eigentuemer: 'Eigentümer',
  jaeger: 'Jäger',
  gaende: 'Jagdgänger',
  gast: 'Gast',
}

export function MitgliederVerwaltung() {
  const { revierId } = useRevier()
  const currentUser = useUserStore((s) => s.user)
  const permissions = usePermissions()

  const [mitglieder, setMitglieder] = useState<RevierMitglied[]>([])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [rolle, setRolle] = useState<Rolle>('jaeger')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!revierId) return
    setLoading(true)
    supabase
      .from('revier_mitglieder')
      .select('*')
      .eq('revier_id', revierId)
      .then(({ data }) => {
        setMitglieder((data ?? []) as RevierMitglied[])
        setLoading(false)
      })
  }, [revierId])

  async function handleInvite() {
    if (!email || !revierId) return
    setInviting(true)
    setError(null)
    setSuccess(null)

    // Resolve email → user_id via Supabase RPC helper (002_helper_functions.sql)
    const { data: userRow, error: lookupError } = await supabase
      .rpc('get_user_id_by_email', { p_email: email })

    if (lookupError || !userRow) {
      setError('Kein Nutzer mit dieser E-Mail-Adresse gefunden.')
      setInviting(false)
      return
    }

    const { error: insertError } = await supabase.from('revier_mitglieder').insert({
      revier_id: revierId,
      user_id: userRow as string,
      rolle,
      berechtigungen: ROLE_PRESETS[rolle],
      eingeladen_von: currentUser?.id,
      aktiv: true,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess(`${email} wurde als ${ROLLE_LABELS[rolle]} eingeladen.`)
      setEmail('')
      // Refresh list
      const { data } = await supabase.from('revier_mitglieder').select('*').eq('revier_id', revierId)
      setMitglieder((data ?? []) as RevierMitglied[])
    }
    setInviting(false)
  }

  async function handleRolleChange(mitgliedId: string, neueRolle: Rolle) {
    await supabase
      .from('revier_mitglieder')
      .update({ rolle: neueRolle, berechtigungen: ROLE_PRESETS[neueRolle] })
      .eq('id', mitgliedId)
    setMitglieder((prev) =>
      prev.map((m) => m.id === mitgliedId ? { ...m, rolle: neueRolle, berechtigungen: ROLE_PRESETS[neueRolle] } : m)
    )
  }

  async function handleRemove(mitglied: RevierMitglied) {
    if (mitglied.rolle === 'eigentuemer') return
    if (!confirm(`Mitglied wirklich entfernen?`)) return
    await supabase.from('revier_mitglieder').delete().eq('id', mitglied.id)
    setMitglieder((prev) => prev.filter((m) => m.id !== mitglied.id))
  }

  if (!revierId) return null

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold">Mitglieder</h2>

      {/* Mitgliederliste */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Lade Mitglieder…</p>
      ) : (
        <div className="space-y-2">
          {mitglieder.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  {m.rolle === 'eigentuemer' ? (
                    <Crown className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.user_id}</p>
                  <p className="text-xs text-muted-foreground">{m.aktiv ? 'Aktiv' : 'Ausstehend'}</p>
                </div>

                {permissions.canInviteMembers() && m.rolle !== 'eigentuemer' && (
                  <Select value={m.rolle} onValueChange={(v) => handleRolleChange(m.id, v as Rolle)}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLLE_LABELS) as Rolle[])
                        .filter((r) => r !== 'eigentuemer')
                        .map((r) => (
                          <SelectItem key={r} value={r}>{ROLLE_LABELS[r]}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}

                {permissions.canInviteMembers() && m.rolle !== 'eigentuemer' && m.user_id !== currentUser?.id && (
                  <button
                    onClick={() => handleRemove(m)}
                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Einladen */}
      {permissions.canInviteMembers() && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-medium">Mitglied einladen</h3>

          {error && <p className="text-xs text-destructive">{error}</p>}
          {success && <p className="text-xs text-green-600">{success}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="invite-email">E-Mail</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="jaeger@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Rolle</Label>
            <Select value={rolle} onValueChange={(v) => setRolle(v as Rolle)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLLE_LABELS) as Rolle[])
                  .filter((r) => r !== 'eigentuemer')
                  .map((r) => (
                    <SelectItem key={r} value={r}>{ROLLE_LABELS[r]}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleInvite} disabled={inviting || !email} className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            {inviting ? 'Einladen…' : 'Einladen'}
          </Button>
        </div>
      )}
    </div>
  )
}
