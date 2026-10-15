// ASP.NET returns errors as RFC 7807 ProblemDetails.
// On validation errors (400), "errors" contains messages per field.

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Record<string, string[]>
  [key: string]: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails | null

  constructor(status: number, problem: ProblemDetails | null, fallbackMessage: string) {
    super(problem?.detail ?? problem?.title ?? fallbackMessage)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }

  get isUnautorized() {
    return this.status === 401
  }

  get isValidationError() {
    return this.status === 400 && !!this.problem?.errors
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
