import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { restoreSession } from '../api/auth/auth'
import { getSession, subscribeSession } from '../api/auth/session'

interface AuthProviderProbs {
  children: ReactNode
  /** Shown while the session is being restores on startup */
  fallback?: ReactNode
}

export function AuthProvider({ children, fallback = null }: AuthProviderProbs) {
  const queryClient = useQueryClient()
  const [isRestoring, setIsRestoring] = useState(true)

  // Restore the session once on startup. StrictMode runs this twice in dev,
  // but refreshSession shares the in-flight request, so only one call is made.
  useEffect(() => {
    let active = true
    restoreSession().finally(() => {
      if (active) setIsRestoring(false)
    })
    return () => {
      active = false
    }
  }, [])

  // Clear all cached server data when the user changes (login, logout, forced
  // logout), so one user never sees another user's data.
  useEffect(() => {
    let previousUserId = getSession()?.user.id ?? null
    return subscribeSession((session) => {
      const userId = session?.user.id ?? null
      if (userId !== previousUserId) queryClient.clear()
      previousUserId = userId
    })
  }, [queryClient])

  return isRestoring ? fallback : children
}
