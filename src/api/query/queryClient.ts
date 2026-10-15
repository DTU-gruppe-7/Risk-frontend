import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '../errors'

const MAX_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data counts as fresh for 30 seconds, so components mounting in that
      // windows reuse the cache instead of refetching.
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // 4xx error will not succed on retry (not found, forbidden, invalid input).
        if (isApiError(error) && error.status < 500) return false
        // Network error and 5xx may be temporary.
        return failureCount < MAX_RETRIES
      },
    },
    mutations: {
      // Never retry mutations automatically: "create game" twice is not harmless,
      retry: false,
    },
  },
})
