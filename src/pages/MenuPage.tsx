import { LogOut, User } from 'lucide-react'
import { useUserStore } from '@/store/useUserStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MenuPage() {
  const { user, signOut } = useUserStore()

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-4 space-y-4">
      <h1 className="text-lg font-semibold">Menü</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/5 transition-colors rounded-xl"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Abmelden</span>
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
