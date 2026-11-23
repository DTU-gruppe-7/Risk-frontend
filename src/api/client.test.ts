import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiClient } from './client'
import { ApiError } from './errors'

/** A token provider that hands out `current` and renews to `renewed`. */
function fakeTokens(current: string | null, renewed: string | null = null) {
  return {
    getAccessToken: vi.fn(async () => current),
    refresh: vi.fn(async () => renewed),
  }
}

function respond(status: number, body?: unknown, statusText = '') {
  const text = body === undefined ? null : typeof body === 'string' ? body : JSON.stringify(body)
  return new Response(text, { status, statusText })
}

function stubFetch(...responses: Response[]) {
  const fetchMock = vi.fn<typeof fetch>()
  for (const response of responses) fetchMock.mockResolvedValueOnce(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** The URL and headers of the n'th call to fetch. */
function sent(fetchMock: ReturnType<typeof stubFetch>, call = 0) {
  const [url, init] = fetchMock.mock.calls[call]
  return { url, init, headers: new Headers(init?.headers) }
}

afterEach(() => vi.unstubAllGlobals())

describe('requests', () => {
  it('sends the access token, JSON headers and the body, and parses the answer', async () => {
    const fetchMock = stubFetch(respond(200, { id: 'g1' }))
    const client = createApiClient('', fakeTokens('token-1'))

    const result = await client.post<{ id: string }>('/api/games', { maxPlayers: 4 })

    const { url, init, headers } = sent(fetchMock)
    expect(result).toEqual({ id: 'g1' })
    expect(url).toBe('/api/games')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"maxPlayers":4}')
    expect(init?.credentials).toBe('same-origin')
    expect(headers.get('Authorization')).toBe('Bearer token-1')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('Accept')).toBe('application/json')
  })

  it('leaves out the token when auth is false', async () => {
    const fetchMock = stubFetch(respond(200, {}))
    const tokens = fakeTokens('token-1')

    await createApiClient('', tokens).get('/api/map', { auth: false })

    expect(tokens.getAccessToken).not.toHaveBeenCalled()
    expect(sent(fetchMock).headers.has('Authorization')).toBe(false)
  })

  it('builds the query string and skips empty values', async () => {
    const fetchMock = stubFetch(respond(200, []))

    await createApiClient('https://example.test', fakeTokens('t')).get('/api/games', {
      query: { state: 'Lobby', page: 2, mine: true, empty: null, missing: undefined },
    })

    expect(sent(fetchMock).url).toBe('https://example.test/api/games?state=Lobby&page=2&mine=true')
  })

  it('returns undefined for an empty answer such as 204 No Content', async () => {
    stubFetch(respond(204))

    expect(await createApiClient('', fakeTokens('t')).delete('/api/games/g1')).toBeUndefined()
  })
})

describe('an expired token', () => {
  it('is renewed once, and the request is sent again with the new token', async () => {
    const fetchMock = stubFetch(respond(401), respond(200, { ok: true }))
    const tokens = fakeTokens('old', 'new')

    const result = await createApiClient('', tokens).get('/api/users/me')

    expect(result).toEqual({ ok: true })
    expect(tokens.refresh).toHaveBeenCalledTimes(1)
    expect(sent(fetchMock, 1).headers.get('Authorization')).toBe('Bearer new')
  })

  it('gives a 401 error when the token cannot be renewed', async () => {
    const fetchMock = stubFetch(respond(401))

    const request = createApiClient('', fakeTokens('old', null)).get('/api/users/me')

    await expect(request).rejects.toMatchObject({ status: 401, isUnauthorized: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('is only renewed once, even if the retry also gets 401', async () => {
    const fetchMock = stubFetch(respond(401), respond(401))
    const tokens = fakeTokens('old', 'new')

    await expect(createApiClient('', tokens).get('/api/users/me')).rejects.toBeInstanceOf(ApiError)
    expect(tokens.refresh).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('is not renewed when no token was sent', async () => {
    stubFetch(respond(401))
    const tokens = fakeTokens('t', 'new')

    await expect(
      createApiClient('', tokens).post('/api/auth/login', {}, { auth: false }),
    ).rejects.toBeInstanceOf(ApiError)
    expect(tokens.refresh).not.toHaveBeenCalled()
  })
})

describe('errors', () => {
  it('carry the ProblemDetails from the backend, with the detail as message', async () => {
    stubFetch(
      respond(400, {
        title: 'One or more validation errors occurred.',
        detail: 'The password is too short.',
        errors: { PasswordTooShort: ['Passwords must be at least 15 characters.'] },
      }),
    )

    const error = await createApiClient('', fakeTokens('t'))
      .post('/api/auth/register', {})
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, message: 'The password is too short.' })
    expect((error as ApiError).isValidationError).toBe(true)
    expect((error as ApiError).problem?.errors?.PasswordTooShort).toHaveLength(1)
  })

  it('fall back to the status text when the body is not JSON, e.g. an error page from a proxy', async () => {
    stubFetch(respond(502, '<html>Bad Gateway</html>', 'Bad Gateway'))

    const error = await createApiClient('', fakeTokens('t'))
      .get('/api/games')
      .catch((caught: unknown) => caught)

    expect(error).toMatchObject({ status: 502, problem: null, message: 'Bad Gateway' })
  })
})
