import { Sun, Moon, User } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { useLocation } from 'react-router-dom'

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transações',
  '/accounts': 'Contas',
  '/calendar': 'Calendário',
  '/payments': 'Pagamentos',
  '/investments': 'Simulador de Investimentos',
  '/reports': 'Relatórios',
}

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const pageName = pageNames[location.pathname] || 'FinControl'

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Page Title */}
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">{pageName}</h2>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* User Profile */}
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
