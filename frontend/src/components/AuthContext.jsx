import { createContext, useContext, useEffect, useState } from 'react'

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
        const res = await fetch(`${API}/me`, { credentials: 'include' })
        
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        } else if (res.status === 401) {
          const refreshRes = await fetch(`${API}/refresh`, { 
            method: 'POST', 
            credentials: 'include' 
          })

          if (refreshRes.ok) {
            const retryMeRes = await fetch(`${API}/me`, { credentials: 'include' })
            if (retryMeRes.ok) {
              const data = await retryMeRes.json()
              setUser(data)
            } else {
              setUser(null)
            }
          } else {
            setUser(null)
          }
        } else {
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

      return { ok: false, message: data.message || `Error: ${res.status}` }

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
        setUser(data)
        return { ok: true }
      }

      return { ok: false, message: data.message || `Error: ${res.status}` }

    } catch (err) {
      return { ok: false, message: "Failed to connect to the registration server." }
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
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)