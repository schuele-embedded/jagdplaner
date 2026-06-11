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

const PasswortNeuSchema = z
  .object({
    password: z.string().min(8, 'Mindestens 8 Zeichen'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwörter stimmen nicht überein',
    path: ['passwordConfirm'],
  })

type PasswortNeuFormValues = z.infer<typeof PasswortNeuSchema>

/**
 * Zielseite des Recovery-Links aus der Supabase-E-Mail.
 * Der Link meldet den Nutzer an (detectSessionInUrl); hier wird das
 * neue Passwort gesetzt.
 */
export function PasswortNeuPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswortNeuFormValues>({ resolver: zodResolver(PasswortNeuSchema) })

  async function onSubmit(data: PasswortNeuFormValues) {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setServerError(
        error.message === 'Auth session missing!'
          ? 'Sitzung abgelaufen. Bitte fordere einen neuen Link an.'
          : error.message
      )
      return
    }
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Neues Passwort</CardTitle>
          <CardDescription>Lege ein neues Passwort für dein Konto fest.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{serverError}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="password">Neues Passwort</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passwordConfirm">Passwort wiederholen</Label>
              <Input id="passwordConfirm" type="password" autoComplete="new-password" {...register('passwordConfirm')} />
              {errors.passwordConfirm && (
                <p className="text-xs text-destructive">{errors.passwordConfirm.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Speichern…' : 'Passwort speichern'}
            </Button>
            <Link to="/passwort-reset" className="text-center text-sm text-muted-foreground hover:underline">
              Neuen Link anfordern
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
