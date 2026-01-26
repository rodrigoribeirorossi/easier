import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet, 
  Calendar, 
  CreditCard, 
  TrendingUp,
  BarChart3,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transações', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Entradas', href: '/incomes', icon: TrendingUp },
  { name: 'Contas', href: '/accounts', icon: Wallet },
  { name: 'Calendário', href: '/calendar', icon: Calendar },
  { name: 'Pagamentos', href: '/payments', icon: CreditCard },
  { name: 'Investimentos', href: '/investments', icon: TrendingUp },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen w-64 bg-card border-r border-border transition-transform duration-200 z-40",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-primary">easier</h1>
            <p className="text-sm text-muted-foreground">Controle Financeiro</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              © 2024 easier
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
