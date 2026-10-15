import type { QueryClient } from '@tanstack/react-query'
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import { getSession, subscribeSession } from '../api/auth/session'
import { queryClient } from '../api/query/queryClient'
import LoginPage from '../auth/LoginPage'
import GamePage, { GameErrorPage } from '../feature/game/GamePage'
import { gameQuery } from '../feature/game/queries'
import App from './App'

interface RouterContext {
  queryClient: QueryClient
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  // Only allow relative paths, so the login page cannot redirect to another site.
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect:
      typeof search.redirect === 'string' &&
      search.redirect.startsWith('/') &&
      !search.redirect.startsWith('//')
        ? search.redirect
        : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (getSession()) throw redirect({ href: search.redirect ?? '/' })
  },
  component: LoginPage,
})

// Layout route without a path: every child requires a logged-in user.
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  beforeLoad: ({ location }) => {
    if (!getSession()) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
})

const lobbyRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  component: App, // TODO: replace with the lobby page
})

const gameRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/games/$gameId',
  // Fetch the game before the page renders. Uses the TanStack cache, so data
  // that is already cachec (e.g. preloaded on hover) is not fetched again.
  loader: ({ context, params }) => context.queryClient.ensureQueryData(gameQuery(params.gameId)),
  component: GamePage,
  errorComponent: GameErrorPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([lobbyRoute, gameRoute]),
])

export const router = createRouter({
  routeTree,
  context: { queryClient },
  // Start loading a route's data when the user hovers a link to it.
  defaultPreload: 'intent',
  // Let TanStack Query decide what is fresh, instead of the router's own cache.
  defaultPreloadStaleTime: 0,
})

// Re-run the route guards when the user logs in or out, so a logged-out user
// is sent to /login. Token refreshes for the same user are ignored.
let wasLoggedIn = getSession() !== null
subscribeSession((session) => {
  const isLoggedIn = session !== null
  if (isLoggedIn !== wasLoggedIn) {
    wasLoggedIn = isLoggedIn
    void router.invalidate()
  }
})

//Makes Link, useNavigate, useParams etc. type-sage across the whole app
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
