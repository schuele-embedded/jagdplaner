import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const RegistrierungSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  passwort: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
  passwortBestaetigung: z.string(),
}).refine((data) => data.passwort === data.passwortBestaetigung, {
  message: 'Passwörter stimmen nicht überein',
  path: ['passwortBestaetigung'],
})

type RegistrierungFormValues = z.infer<typeof RegistrierungSchema>

export function RegistrierungPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrierungFormValues>({ resolver: zodResolver(RegistrierungSchema) })

  async function onSubmit(data: RegistrierungFormValues) {
    setServerError(null)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.passwort,
      options: {
        data: { name: data.name },
      },
    })
    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>✉️ Bestätigungs-E-Mail gesendet</CardTitle>
            <CardDescription>
              Bitte prüfe deinen Posteingang und bestätige deine E-Mail-Adresse.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Zum Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🦌 JagdPlaner</CardTitle>
          <CardDescription>Erstelle dein kostenloses Konto</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{serverError}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" placeholder="Max Mustermann" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" placeholder="jaeger@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passwort">Passwort</Label>
              <Input id="passwort" type="password" autoComplete="new-password" {...register('passwort')} />
              {errors.passwort && <p className="text-xs text-destructive">{errors.passwort.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passwortBestaetigung">Passwort bestätigen</Label>
              <Input
                id="passwortBestaetigung"
                type="password"
                autoComplete="new-password"
                {...register('passwortBestaetigung')}
              />
              {errors.passwortBestaetigung && (
                <p className="text-xs text-destructive">{errors.passwortBestaetigung.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Registrieren…' : 'Konto erstellen'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Bereits registriert?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Anmelden
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
