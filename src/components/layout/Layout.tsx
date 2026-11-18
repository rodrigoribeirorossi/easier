import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import useUser from '@/hooks/useUser'

export function Layout() {
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-background dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.03),rgba(255,255,255,0.03))]">
      <Sidebar />

      <div className="md:pl-64">
        <div className="min-h-screen border-l border-border dark:border-white/80 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]">
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
    </div>
  )
}
