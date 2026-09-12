import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { setUnauthorizedHandler } from '@/services/api'
import { authApi } from '@/services/auth'
import type { UserLogin } from '@/types/api'
import {
  clearStoredToken,
  decodeJwtUserId,
  getStoredToken,
  setStoredToken,
} from '@/utils/authStorage'

interface AuthContextValue {
  token: string | null
  userId: number | null
  isAuthenticated: boolean
  login: (credentials: UserLogin) => Promise<void>
  logout: (options?: { sessionExpired?: boolean }) => void
  sessionMessage: string | null
  clearSessionMessage: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [sessionMessage, setSessionMessage] = useState<string | null>(null)

  const userId = useMemo(() => (token ? decodeJwtUserId(token) : null), [token])

  const logout = useCallback(
    (options?: { sessionExpired?: boolean }) => {
      clearStoredToken()
      setToken(null)
      if (options?.sessionExpired) {
        setSessionMessage('Session expired. Please log in again.')
      }
      navigate('/login', { replace: true })
    },
    [navigate],
  )

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredToken()
      setToken(null)
      setSessionMessage('Session expired. Please log in again.')
      navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate])

  const login = useCallback(async (credentials: UserLogin) => {
    const response = await authApi.login(credentials)
    setStoredToken(response.access_token)
    setToken(response.access_token)
    setSessionMessage(null)
  }, [])

  const clearSessionMessage = useCallback(() => setSessionMessage(null), [])

  const value = useMemo(
    () => ({
      token,
      userId,
      isAuthenticated: Boolean(token),
      login,
      logout,
      sessionMessage,
      clearSessionMessage,
    }),
    [token, userId, login, logout, sessionMessage, clearSessionMessage],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
