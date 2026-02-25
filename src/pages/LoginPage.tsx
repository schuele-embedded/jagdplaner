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

const LoginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  passwort: z.string().min(1, 'Passwort ist erforderlich'),
})

type LoginFormValues = z.infer<typeof LoginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(LoginSchema) })

  async function onSubmit(data: LoginFormValues) {
    setServerError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.passwort,
    })
    if (error) {
      setServerError('Ungültige Zugangsdaten. Bitte erneut versuchen.')
      return
    }
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🦌 JagdPlaner</CardTitle>
          <CardDescription>Melde dich in deinem Konto an</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{serverError}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="jaeger@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passwort">Passwort</Label>
              <Input
                id="passwort"
                type="password"
                autoComplete="current-password"
                {...register('passwort')}
              />
              {errors.passwort && <p className="text-xs text-destructive">{errors.passwort.message}</p>}
            </div>
            <div className="text-right text-sm">
              <Link to="/passwort-reset" className="text-primary hover:underline">
                Passwort vergessen?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Anmelden…' : 'Anmelden'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Noch kein Konto?{' '}
              <Link to="/registrierung" className="text-primary hover:underline">
                Jetzt registrieren
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
