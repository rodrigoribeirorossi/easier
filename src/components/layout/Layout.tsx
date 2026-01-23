import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import useUser from '@/hooks/useUser'

export function Layout() {
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:pl-64">
        <Header />

        <main className="p-6">
          {user ? (
            <Outlet />
          ) : (
            <div className="py-24 text-center text-muted-foreground">
              <p className="text-lg">Você não está logado.</p>
              <p className="mt-2">Abra o modal de login no canto superior direito para acessar seus dados.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
