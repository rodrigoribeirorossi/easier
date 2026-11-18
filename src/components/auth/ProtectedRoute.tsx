import { Navigate, Outlet } from 'react-router-dom'
import useUser from '@/hooks/useUser'

export function ProtectedRoute() {
  const { user, initialized } = useUser()

  // Still reading from storage - don't redirect yet
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
