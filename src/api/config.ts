// Empty string = same origin. Locally the Vite proxy forwards /api and /hubs,
// in production the reverse proxy on the server does the same.

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? ''

export const AUTH_ENDPOINTS = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  refresh: '/api/auth/refresh',
  logout: '/api/auth/logout',
} as const

export const HUB_URLS = {
  game: '/hubs/game',
} as const

// Renew the access token when less than this much of its lifetime remains.
export const TOKEN_REFRESH_MARGIN_MS = 30_000
