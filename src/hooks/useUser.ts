import { useEffect, useState } from 'react'

export type User = {
  id: string
  name: string
  email: string
  avatar?: string | null
}

const STORAGE_KEY = 'easier_user'
const TOKEN_KEY = 'easier_token'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const token = localStorage.getItem(TOKEN_KEY)
      // Only restore user from storage if we also have a token
      if (raw && token) setUser(JSON.parse(raw))
      else if (raw && !token) {
        // ensure stale stored user is removed
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    // If there's a token but no user, try to fetch current user
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

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  async function listUsers() {
    const res = await fetch('/api/users')
    if (!res.ok) throw new Error('Failed to load users')
    return res.json() as Promise<User[]>
  }

  async function loginByEmail(email: string, name?: string, avatar?: string) {
    // If name provided, assume user wants to register (create account with passwordless register)
    if (name) {
      // Use new auth register endpoint without password (will still create user and return token if available)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: '' }),
      })
      // If backend rejects empty password, fall back to legacy create
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

    // Legacy fallback: login/create by email (no password)
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) throw new Error('Login failed')
    const u = await res.json()
    setUser(u)
    return u
  }

  async function loginWithCredentials(email: string, password: string) {
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
  }

  async function register(name: string, email: string, password: string) {
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
  }

  async function loadById(id: string) {
    const res = await fetch(`/api/users/${id}`)
    if (!res.ok) throw new Error('Failed to load user')
    const u = await res.json()
    setUser(u)
    return u
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
  }

  // ensure storage is cleaned
  function clearAll() {
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { user, setUser, logout: clearAll, listUsers, loginByEmail, loadById, loginWithCredentials, register }
}

export default useUser
