import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getSession,
  getValidAccessToken,
  refreshSession,
  setSession,
  subscribeSession,
} from './session'

const USER = { id: 'u1', userName: 'alice', email: 'alice@example.com' }

/** An unsigned JWT that expires after the given time. session.ts only reads "exp". */
function token(expiresInMs: number) {
  const exp = Math.floor((Date.now() + expiresInMs) / 1000)
  const payload = btoa(JSON.stringify({ exp }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `header.${payload}.signature`
}

function refreshResponse(status: number, accessToken = token(15 * 60_000)) {
  return new Response(status === 200 ? JSON.stringify({ accessToken, user: USER }) : null, {
    status,
  })
}

beforeEach(() => setSession(null))
afterEach(() => vi.unstubAllGlobals())

describe('the session', () => {
  it('reads the expiry from the token', () => {
    setSession({ accessToken: token(60_000), user: USER })

    expect(getSession()?.expiresAt).toBeGreaterThan(Date.now() + 55_000)
    expect(getSession()?.expiresAt).toBeLessThanOrEqual(Date.now() + 60_000)
  })

  it('tells subscribers about changes until they unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeSession(listener)

    setSession({ accessToken: token(60_000), user: USER })
    unsubscribe()
    setSession(null)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0]).toMatchObject({ user: USER })
  })
})

describe('getValidAccessToken', () => {
  it('uses the current token while it is valid', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const current = token(10 * 60_000)
    setSession({ accessToken: current, user: USER })

    expect(await getValidAccessToken()).toBe(current)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renews the token with the refresh cookie when it is about to expire', async () => {
    const renewed = token(15 * 60_000)
    const fetchMock = vi.fn(() => Promise.resolve(refreshResponse(200, renewed)))
    vi.stubGlobal('fetch', fetchMock)
    setSession({ accessToken: token(10_000), user: USER })

    expect(await getValidAccessToken()).toBe(renewed)
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
  })
})

describe('refreshSession', () => {
  it('sends one request when several callers refresh at the same time', async () => {
    // The refresh token is rotated on every use, so parallel requests would end the login.
    const fetchMock = vi.fn(() => Promise.resolve(refreshResponse(200)))
    vi.stubGlobal('fetch', fetchMock)

    const sessions = await Promise.all([refreshSession(), refreshSession(), refreshSession()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(new Set(sessions.map((session) => session?.accessToken)).size).toBe(1)
  })

  it('logs out when the refresh token is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(refreshResponse(401))),
    )
    setSession({ accessToken: token(10_000), user: USER })
    const listener = vi.fn()
    const unsubscribe = subscribeSession(listener)

    expect(await refreshSession()).toBeNull()
    expect(getSession()).toBeNull()
    expect(listener).toHaveBeenCalledWith(null)
    unsubscribe()
  })

  it('keeps the session when the network fails, since the user is not necessarily logged out', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('network down'))),
    )
    setSession({ accessToken: token(10_000), user: USER })

    expect(await refreshSession()).toBeNull()
    expect(getSession()?.user).toEqual(USER)
  })
})
