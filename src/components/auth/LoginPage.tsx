import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import useUser from '@/hooks/useUser'
import { useTheme } from '@/hooks/useTheme'
import { Sun, Moon } from 'lucide-react'

export function LoginPage() {
  const { user, loginWithCredentials } = useUser()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await loginWithCredentials(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Email ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full" />
        <div className="absolute top-1/3 -right-16 w-64 h-64 bg-white/10 rounded-full" />
        <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-white/10 rounded-full" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-2xl font-bold tracking-tight">easier</span>
        </div>

        {/* Center copy */}
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Controle suas finanças<br />com simplicidade.
          </h1>
          <p className="text-blue-100 text-lg max-w-sm">
            Acompanhe receitas, despesas, investimentos e muito mais — tudo em um só lugar.
          </p>

          {/* Stats row */}
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-white text-2xl font-bold">100%</p>
              <p className="text-blue-200 text-sm">Privado & Local</p>
            </div>
            <div>
              <p className="text-white text-2xl font-bold">∞</p>
              <p className="text-blue-200 text-sm">Transações</p>
            </div>
            <div>
              <p className="text-white text-2xl font-bold">0</p>
              <p className="text-blue-200 text-sm">Custo</p>
            </div>
          </div>
        </div>

        <p className="relative text-blue-200 text-sm">© 2026 easier. Todos os direitos reservados.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between p-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">easier</span>
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <span className="text-sm text-muted-foreground">Não tem conta?</span>
            <Link to="/register">
              <Button variant="outline" size="sm">Criar conta</Button>
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Entrar</h2>
              <p className="text-muted-foreground">Bem-vindo de volta! Acesse sua conta.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Entrando...
                  </span>
                ) : 'Entrar'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Criar conta gratuita
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
