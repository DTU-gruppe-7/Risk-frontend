import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login, logout, restoreSession } from './auth'
import { getSession, setSession } from './session'

const USER = { id: 'u1', userName: 'alice', email: 'alice@example.com' }

/** An unsigned JWT that expires in 15 minutes. The session only reads "exp". */
function token() {
  const exp = Math.floor(Date.now() / 1000) + 15 * 60
  const payload = btoa(JSON.stringify({ exp }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `header.${payload}.signature`
}

function authResponse() {
  return new Response(JSON.stringify({ accessToken: token(), user: USER }), { status: 200 })
}

beforeEach(() => setSession(null))
afterEach(() => vi.unstubAllGlobals())

describe('login', () => {
  it('stores the session and sends the refresh cookie, but no access token', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(authResponse())
    vi.stubGlobal('fetch', fetchMock)

    const user = await login({ email: USER.email, password: 'correct horse battery staple' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(user).toEqual(USER)
    expect(getSession()?.user).toEqual(USER)
    expect(url).toBe('/api/auth/login')
    expect(init?.credentials).toBe('include')
    expect(new Headers(init?.headers).has('Authorization')).toBe(false)
  })

  it('stores no session when the login is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, { status: 401 })),
    )

    await expect(login({ email: USER.email, password: 'wrong' })).rejects.toMatchObject({
      status: 401,
    })
    expect(getSession()).toBeNull()
  })
})

describe('logout', () => {
  it('ends the session locally, even when the request to the backend fails', async () => {
    setSession({ accessToken: token(), user: USER })
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('offline')))

    await expect(logout()).rejects.toThrow('offline')
    expect(getSession()).toBeNull()
  })
})

describe('restoreSession', () => {
  it('returns the user when the refresh cookie is still valid', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValueOnce(authResponse()))

    expect(await restoreSession()).toEqual(USER)
  })

  it('returns null when there is no valid refresh cookie', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, { status: 401 })),
    )

    expect(await restoreSession()).toBeNull()
  })
})
