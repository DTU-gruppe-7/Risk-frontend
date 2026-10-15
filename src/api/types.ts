// Contract for the auth endpoints. Replace with the generated types in
// src/types/backend.d.ts (npm run gen:api) once the endpoints exist in the backend.

export interface AuthUser {
  id: string // Domain User id (not ApplicationUser), so it matches player ids
  userName: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  userName: string
  password: string
}

// Login, register and refresh all return this.
// The refresh token is NOT included here. The backend sets it as an HttpOnly cookie,
// so JavaScript can never read it.
export interface AuthResponse {
  accessToken: string
  user: AuthUser
}
