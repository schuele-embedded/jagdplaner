import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const PasswortResetSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
})

type PasswortResetFormValues = z.infer<typeof PasswortResetSchema>

export function PasswortResetPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswortResetFormValues>({ resolver: zodResolver(PasswortResetSchema) })

  async function onSubmit(data: PasswortResetFormValues) {
    setServerError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/passwort-neu`,
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
            <CardTitle>✉️ E-Mail gesendet</CardTitle>
            <CardDescription>
              Falls ein Konto mit dieser E-Mail-Adresse existiert, erhältst du einen Link zum Zurücksetzen.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/login">
              <Button variant="outline">Zum Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Passwort zurücksetzen</CardTitle>
          <CardDescription>
            Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.
          </CardDescription>
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
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Senden…' : 'Link senden'}
            </Button>
            <Link to="/login" className="text-center text-sm text-muted-foreground hover:underline">
              Zurück zum Login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
