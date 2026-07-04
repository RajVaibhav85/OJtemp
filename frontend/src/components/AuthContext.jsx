import { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../utils/apiFetch'

const AuthContext = createContext(null)
const API = import.meta.env.VITE_SERVER_URL + '/api/auth'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const parseJsonSafe = async (res) => {
    const contentType = res.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return await res.json()
    }
    return {}
  }

  useEffect(() => {
    const checkAuthSession = async () => {
      try {
        const res = await apiFetch(`${API}/me`)

        if (res.ok) {
          const data = await res.json()
          setUser(data)
        } else {
          // apiFetch already tried one silent refresh-and-retry internally.
          // Still failing here means the refresh token itself is gone/expired
          // — a real logged-out state, not a recoverable token hiccup.
          setUser(null)
        }
      } catch (err) {
        console.error("Auth session check failed:", err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuthSession()
  }, [])

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await parseJsonSafe(res)

      if (res.ok) {
        setUser(data)
        return { ok: true }
      }

      return {
        ok: false,
        message: data.message || `Error: ${res.status}`,
        needsVerification: data.needsVerification || false,
        email: data.email,
      }

    } catch (err) {
      return { ok: false, message: "Network connection lost. Please try again." }
    }
  }

  const register = async ({ username, email, password, dob }) => {
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password, dob }),
      })

      const data = await parseJsonSafe(res)

      if (res.ok) {
        // No cookies are set on register anymore — the account needs email
        // verification first, so we intentionally don't setUser() here.
        return { ok: true, message: data.message, email: data.email }
      }

      return { ok: false, message: data.message || `Error: ${res.status}` }

    } catch (err) {
      return { ok: false, message: "Failed to connect to the registration server." }
    }
  }

  const verifyEmail = async (token) => {
    try {
      const res = await fetch(`${API}/verify/${token}`, {
        method: 'GET',
        credentials: 'include',
      })

      const data = await parseJsonSafe(res)

      if (res.ok) {
        setUser(data)
        return { ok: true, message: data.message }
      }

      return { ok: false, message: data.message || `Error: ${res.status}` }

    } catch (err) {
      return { ok: false, message: "Failed to connect to the server." }
    }
  }

  const resendVerification = async (email) => {
    try {
      const res = await fetch(`${API}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })

      const data = await parseJsonSafe(res)

      if (res.ok) {
        return { ok: true, message: data.message }
      }

      return { ok: false, message: data.message || `Error: ${res.status}` }

    } catch (err) {
      return { ok: false, message: "Failed to connect to the server." }
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' })
    } catch (err) {
      console.error("Logout request failed", err)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, verifyEmail, resendVerification }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)