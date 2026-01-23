import { Sun, Moon, User } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { useLocation } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'
import useUser from '@/hooks/useUser'

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
  const pageName = pageNames[location.pathname] || 'easier'
  const { user, listUsers, loginByEmail, logout, loginWithCredentials, register } = useUser()
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    listUsers().then(setUsers).catch(() => setUsers([]))
  }, [open])

  // Auto-open login dialog when there's no user
  useEffect(() => {
    if (!user) setOpen(true)
  }, [user])

  // Open login dialog when unauthorized event is received
  useEffect(() => {
    function onUnauthorized() {
      try {
        // ensure any stored token/user is cleared
        localStorage.removeItem('easier_token')
        localStorage.removeItem('easier_user')
      } catch (e) {}
      setOpen(true)
    }

    window.addEventListener('unauthorized', onUnauthorized)
    return () => window.removeEventListener('unauthorized', onUnauthorized)
  }, [])

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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Login / Usuários</DialogTitle>
                <DialogDescription>
                  Selecione um usuário existente ou crie um novo para usar a aplicação.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div>
                  <p className="text-sm font-medium">Usuários existentes</p>
                  <div className="mt-2 space-y-2">
                    {users.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário</p>}
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                        <div>
                          <Button
                            variant="ghost"
                            onClick={async () => {
                              setSelectedEmail(u.email)
                              setPassword('')
                              setError(null)
                            }}
                          >
                            Usar
                          </Button>
                        </div>
                      </div>
                    ))}
                    {selectedEmail ? (
                      <div className="mt-2">
                        <p className="text-sm">Entrar como <strong>{selectedEmail}</strong></p>
                        <Input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <div className="flex gap-2 justify-end mt-2">
                          <Button variant="ghost" onClick={() => { setSelectedEmail(null); setPassword(''); setError(null) }}>Cancelar</Button>
                          <Button onClick={async () => {
                            try {
                              setError(null)
                              if (!password) {
                                // fallback to legacy email login if no password
                                await loginByEmail(selectedEmail)
                              } else {
                                await loginWithCredentials(selectedEmail, password)
                              }
                              setOpen(false)
                            } catch (e: any) {
                              setError(e?.message || 'Falha ao entrar')
                            }
                          }}>Entrar</Button>
                        </div>
                        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Criar novo usuário</p>
                  <div className="mt-2 space-y-2">
                    <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
                    <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Input placeholder="Senha (opcional)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <div className="flex justify-end">
                      <Button
                        onClick={async () => {
                          if (!email) return
                          try {
                            if (password) {
                              await register(name || email.split('@')[0], email, password)
                            } else {
                              await loginByEmail(email, name || undefined)
                            }
                            setOpen(false)
                          } catch (e: any) {
                            // show simple alert for now
                            alert(e?.message || 'Erro')
                          }
                        }}
                      >
                        Criar / Entrar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                {user ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm">Logado como <strong>{user.name}</strong></div>
                    <div>
                      <Button variant="ghost" onClick={() => { logout(); setOpen(false) }}>
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : null}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}
