import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

export type User = {
  id: string
  name: string
  email: string
  avatar?: string | null
}

const STORAGE_KEY = 'easier_user'
const TOKEN_KEY = 'easier_token'

interface UserContextType {
  user: User | null
  initialized: boolean
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  logout: () => void
  listUsers: () => Promise<User[]>
  loginByEmail: (email: string, name?: string, avatar?: string) => Promise<any>
  loadById: (id: string) => Promise<User>
  loginWithCredentials: (email: string, password: string) => Promise<any>
  register: (name: string, email: string, password: string) => Promise<any>
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Initialize user from storage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const token = localStorage.getItem(TOKEN_KEY)
      if (raw && token) setUser(JSON.parse(raw))
      else if (raw && !token) {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore
    } finally {
      setInitialized(true)
    }
  }, [])

  // If there's a token but no user, try to fetch current user
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const raw = localStorage.getItem(STORAGE_KEY)
    if (token && !raw) {
      fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => {
          if (!r.ok) throw new Error('no user')
          return r.json()
        })
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY)
        })
    }
  }, [])

  // Sync user to storage
  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  // Handle unauthorized events from API (token expired, etc.)
  useEffect(() => {
    function onUnauthorized() {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(STORAGE_KEY)
      setUser(null)
    }
    window.addEventListener('unauthorized', onUnauthorized)
    return () => window.removeEventListener('unauthorized', onUnauthorized)
  }, [])

  const listUsers = useCallback(async () => {
    const res = await fetch('/api/users')
    if (!res.ok) throw new Error('Failed to load users')
    return res.json() as Promise<User[]>
  }, [])

  const loginByEmail = useCallback(async (email: string, name?: string, avatar?: string) => {
    if (name) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: '' }),
      })
      if (!res.ok) {
        const legacy = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, avatar }),
        })
        if (!legacy.ok) throw new Error('Login failed')
        const u = await legacy.json()
        setUser(u)
        return u
      }
      const data = await res.json()
      if (data.token) localStorage.setItem(TOKEN_KEY, data.token)
      if (data.user) setUser(data.user)
      return data.user
    }

    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) throw new Error('Login failed')
    const u = await res.json()
    setUser(u)
    return u
  }, [])

  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      let body: any = null
      try { body = await res.json() } catch (e) { /* ignore */ }
      const msg = body && (body.error || body.message) ? (body.error || body.message) : 'Login failed'
      throw new Error(msg)
    }
    const data = await res.json()
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token)
    if (data.user) setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) {
      let body: any = null
      try { body = await res.json() } catch (e) { /* ignore */ }
      const msg = body && (body.error || body.message) ? (body.error || body.message) : 'Register failed'
      throw new Error(msg)
    }
    const data = await res.json()
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token)
    if (data.user) setUser(data.user)
    return data
  }, [])

  const loadById = useCallback(async (id: string) => {
    const res = await fetch(`/api/users/${id}`)
    if (!res.ok) throw new Error('Failed to load user')
    const u = await res.json()
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(() => ({
    user,
    initialized,
    setUser,
    logout,
    listUsers,
    loginByEmail,
    loadById,
    loginWithCredentials,
    register,
  }), [user, initialized, logout, listUsers, loginByEmail, loadById, loginWithCredentials, register])

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export default useUser
