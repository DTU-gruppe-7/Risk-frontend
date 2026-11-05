import { API_BASE_URL, AUTH_ENDPOINTS, TOKEN_REFRESH_MARGIN_MS } from '../config'
import type { AuthResponse, AuthUser } from '../types'

// The access token is kept in memory only (never localStorage), so a script injected
// into the page cannot steal a long-lived credential. After a page reload a new one is
// fetched using the HttpOnly refresh cookie (see AuthProvider).

export interface Session {
  accessToken: string
  user: AuthUser
  expiresAt: number //ms since epoch, read from the JWT "exp" claim
}

type Listener = (session: Session | null) => void

let current: Session | null = null
let refreshInFlight: Promise<Session | null> | null = null
const listeners = new Set<Listener>()

export function getSession() {
  return current
}

export function setSession(response: AuthResponse | null) {
  current = response
    ? {
        accessToken: response.accessToken,
        user: response.user,
        expiresAt: readExpiry(response.accessToken),
      }
    : null
  listeners.forEach((listener) => listener(current))
}

/** Subscribe to session changes. Returns an unsubscribe function */
export function subscribeSession(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Fetches a new access token using the refresh cookie. Concurrent callers
 * (e.g three requests that all got 401) share the same request, so the
 * refresh token is not rotated several times in parallel.
 */
export function refreshSession(): Promise<Session | null> {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

/** Returns a valid access token, renewing it first if it is about to expire */
export async function getValidAccessToken(): Promise<string | null> {
  if (current && current.expiresAt - Date.now() > TOKEN_REFRESH_MARGIN_MS) {
    return current.accessToken
  }
  const session = await refreshSession()
  return session?.accessToken ?? null
}

async function doRefresh(): Promise<Session | null> {
  let response: Response
  try {
    response = await withRefreshLock(() =>
      fetch(API_BASE_URL + AUTH_ENDPOINTS.refresh, {
        method: 'POST',
        credentials: 'include',
      }),
    )
  } catch {
    // Network error: keep the current session, the user is not necessarily logged out.
    return null
  }

  if (!response.ok) {
    // Refresh token is missing, expired or revoked: the user is logged out.
    setSession(null)
    return null
  }

  setSession((await response.json()) as AuthResponse)
  return current
}

/** Lets only one tab refresh at a time. All tabs share the refresh cookie, and the backend
 *  rotates it on every use. If two tabs sent the same cookie at once, the second would look
 *  like a stolen token and end the login. With the lock, the second tab waits and then sends
 *  the new cookie the first tab received.
 */
function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  // Web Locks are supported by all current browsers; fall back to no lock if missing.
  if (typeof navigator === 'undefined' || !navigator.locks) return fn()
  return navigator.locks.request('risk-auth-refresh', fn)
}

function readExpiry(token: string): number {
  try {
    // A JWT is header.payload.signature, where payload is base64url-encoded JSON.
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload)) as { exp?: number }
    return exp ? exp * 1000 : 0
  } catch {
    return 0
  }
}
