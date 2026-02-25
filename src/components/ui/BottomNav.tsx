import { NavLink } from 'react-router-dom'
import { Map, BarChart3, Plus, List, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', icon: Map, label: 'Karte', exact: true },
  { to: '/statistiken', icon: BarChart3, label: 'Statistiken', exact: false },
  { to: '/ansitz', icon: Plus, label: 'Ansitz', exact: false, primary: true },
  { to: '/liste', icon: List, label: 'Liste', exact: false },
  { to: '/menue', icon: Menu, label: 'Menü', exact: false },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm safe-area-pb">
      <div className="flex h-16 items-center">
        {tabs.map(({ to, icon: Icon, label, exact, primary }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors',
                primary
                  ? cn(
                      'relative',
                      isActive
                        ? 'text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    )
                  : isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                {primary ? (
                  <span
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors',
                      isActive ? 'bg-primary' : 'bg-primary/90 hover:bg-primary'
                    )}
                  >
                    <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </span>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                {!primary && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
