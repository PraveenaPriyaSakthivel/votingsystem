import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
}

interface AuthContextValue extends AuthState {
  setAuth: (user: User, token: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const loadFromStorage = (): AuthState => {
  try {
    const token = localStorage.getItem('lp_token')
    const raw = localStorage.getItem('lp_user')
    if (token && raw) {
      return { token, user: JSON.parse(raw) as User }
    }
  } catch {
    // Corrupt storage — clear it.
    localStorage.removeItem('lp_token')
    localStorage.removeItem('lp_user')
  }
  return { token: null, user: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(loadFromStorage)

  const setAuth = useCallback((user: User, token: string) => {
    localStorage.setItem('lp_token', token)
    localStorage.setItem('lp_user', JSON.stringify(user))
    setAuthState({ user, token })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('lp_token')
    localStorage.removeItem('lp_user')
    setAuthState({ user: null, token: null })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        setAuth,
        logout,
        isAuthenticated: !!auth.token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
