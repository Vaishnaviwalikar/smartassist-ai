import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, try restoring session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('sa_token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/profile')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('sa_token')
          delete api.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  /** Call after login/signup — store token and fetch profile */
  async function authenticate(token) {
    localStorage.setItem('sa_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const res = await api.get('/profile')
    setUser(res.data)
    return res.data
  }

  function logout() {
    localStorage.removeItem('sa_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
