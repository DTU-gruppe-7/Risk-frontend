import { api } from '../client'
import { AUTH_ENDPOINTS } from '../config'
import { refreshSession, setSession } from './session'
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../types'

//No access token is needed for these, but the refresh cookie must be sent and received.
const authOptions = { auth: false, credentials: 'include' } as const

export async function login(body: LoginRequest): Promise<AuthUser> {
  const response = await api.post<AuthResponse, LoginRequest>(
    AUTH_ENDPOINTS.login,
    body,
    authOptions,
  )
  setSession(response)
  return response.user
}

export async function register(body: RegisterRequest): Promise<AuthUser> {
  const response = await api.post<AuthResponse, RegisterRequest>(
    AUTH_ENDPOINTS.register,
    body,
    authOptions,
  )
  setSession(response)
  return response.user
}

export async function logout(): Promise<void> {
  try {
    // The backend revokes the refresh token and deletes the cookie.
    await api.post(AUTH_ENDPOINTS.logout, undefined, authOptions)
  } finally {
    // Log out locally even if the request fails.
    setSession(null)
  }
}

/** Restores the session from the refresh cookie, e.g. after a page reload */
export async function restoreSession(): Promise<AuthUser | null> {
  const session = await refreshSession()
  return session?.user ?? null
}
