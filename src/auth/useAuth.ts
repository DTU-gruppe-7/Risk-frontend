import { useSyncExternalStore } from 'react'
import { useMutation } from '@tanstack/react-query'
import { login, logout, register } from '../api/auth/auth'
import { getSession, subscribeSession } from '../api/auth/session'

/** The current user. Re-renders when the session changes (login, logout, refresh). */
export function useAuth() {
  const session = useSyncExternalStore(subscribeSession, getSession)
  return {
    user: session?.user ?? null,
    isAuthenticated: session !== null,
  }
}

export function useLogin() {
  return useMutation({ mutationFn: login })
}

export function useRegister() {
  return useMutation({ mutationFn: register })
}

export function useLogout() {
  return useMutation({ mutationFn: logout })
}
