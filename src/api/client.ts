import { API_BASE_URL } from './config'
import { ApiError, type ProblemDetails } from './errors'
import { getValidAccessToken, refreshSession } from './auth/session'

export type QueryParams = Record<string, string | number | boolean | null | undefined>

export interface RequestOptions {
  query?: QueryParams
  headers?: HeadersInit
  signal?: AbortSignal
  /** false = do not send an Authorization header (login, register etc.). Default to true */
  auth?: boolean
  /** Send cookies. Only needed for the auth endpoints that use the refresh cookie. */
  credentials?: RequestCredentials
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Generic request. TResponse is the type the backend returns.
 *  On 401 the access token is renewed once and the request is retired
 */
export async function request<TResponse>(
  method: Method,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { auth = true } = options

  const token = auth ? await getValidAccessToken() : null
  let response = await send(method, path, body, options, token)

  // Only retry if we actually sent a token. Without one, a refresh has
  // already failed and trying again would just repeat the same failure.
  if (response.status === 401 && token) {
    const session = await refreshSession()
    if (session) {
      response = await send(method, path, body, options, session.accessToken)
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response), response.statusText)
  }

  return parseBody<TResponse>(response)
}

export const api = {
  get: <TResponse>(path: string, options?: RequestOptions) =>
    request<TResponse>('GET', path, undefined, options),

  post: <TResponse = void, TBody = unknown>(path: string, body?: TBody, options?: RequestOptions) =>
    request<TResponse>('POST', path, body, options),

  put: <TResponse = void, TBody = unknown>(path: string, body?: TBody, options?: RequestOptions) =>
    request<TResponse>('PUT', path, body, options),

  patch: <TResponse = void, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ) => request<TResponse>('PATCH', path, body, options),

  delete: <TResponse = void>(path: string, options?: RequestOptions) =>
    request<TResponse>('DELETE', path, undefined, options),
}

function send(
  method: Method,
  path: string,
  body: unknown,
  options: RequestOptions,
  accessToken: string | null,
) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  return fetch(buildUrl(path, options.query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options.signal,
    credentials: options.credentials ?? 'same-origin',
  })
}

function buildUrl(path: string, query?: QueryParams) {
  if (!query) return API_BASE_URL + path

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    // Skip empty values so optional filters can be passed directly.
    if (value !== undefined && value !== null) params.append(key, String(value))
  }
  const qs = params.toString()
  return API_BASE_URL + path + (qs ? `${qs}` : '')
}

async function parseBody<T>(response: Response): Promise<T> {
  // 204 No Content and empty bodies give undefined instead of a JSON parse error.
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

async function readProblem(response: Response): Promise<ProblemDetails | null> {
  try {
    const text = await response.text()
    return text ? (JSON.parse(text) as ProblemDetails) : null
  } catch {
    // Not JSON (e.g an HTML error page from a proxy).
    return null
  }
}
