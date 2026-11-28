# Risk Frontend

React 19 + Vite + TanStack Router/Query + Tailwind + SignalR client for the online Risk board game.
The API contract is `Risk.Api/openapi.json` in the backend repo.

## Local Development

Prerequisites: Node.js 26 and npm. The version is pinned in `.nvmrc`; with [nvm](https://github.com/nvm-sh/nvm) (or nvm-windows) run `nvm install 26 && nvm use 26` (nvm-windows does not read `.nvmrc`). `engine-strict` makes `npm ci` fail on the wrong Node version.

```bash
npm ci
npm run dev   # http://localhost:5173
```

The app calls the API with relative paths (`/api/*`, `/hubs/*`), exactly as in production where Caddy serves
frontend and API from the same origin. Locally, Vite's dev proxy plays Caddy's role (see `vite.config.ts`),
so the browser only ever sees `localhost:5173` — no CORS setup is needed.

### Against a local backend (default)

Start the backend as described in the backend repo's README. It listens on `http://localhost:5081`, which is
where the proxy points by default, so nothing needs to be configured.

### Against the shared dev server

To work on the frontend without running the backend, point the proxy at the group's dev environment by
setting `VITE_PROXY_TARGET` in `.env.development.local` (git-ignored). The address is in the README of the
private `Risk-infrastructure` repo. Restart `npm run dev` afterwards; delete the line to go back to the local
backend.

The dev environment's data is shared with the rest of the group, and it runs the code from `develop`, so API
changes on your own backend branch are not there yet. `VITE_PROXY_TARGET` is only read by Vite's Node process
and never ends up in the browser bundle.

## Commands

| Command                           | What it does                                                          |
| --------------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                     | Dev server with hot reload and the API proxy                          |
| `npm run build`                   | Type check (`tsc -b`, also the tests) and production build to `dist/` |
| `npm test`                        | Vitest, once                                                          |
| `npm run coverage`                | Vitest with coverage and per-file thresholds; this is what CI runs    |
| `npm run lint`                    | ESLint (CI uses `--max-warnings=0`)                                   |
| `npm run format` / `format:check` | Prettier                                                              |
| `npm run gen:api`                 | Types from the backend's `openapi.json`                               |

The husky pre-commit hook runs ESLint and Prettier on staged files and `npm run build`.

## Tests

Tests are `*.test.ts` next to the code they test and run in Node without a DOM. They cover the logic where a
bug is expensive or invisible: the client-side game rules, session and token refresh, the API client's 401
retry, the SignalR connection leases and the consistency of the hand-written map data. There are no
component or end-to-end tests.

## PWA

`vite-plugin-pwa` generates the manifest and a Workbox service worker at build time, so it is not active in
`npm run dev`; use `npm run build && npm run preview` to try it. The app shell and `/assets/` are precached.
`/api` and `/hubs` are `NetworkOnly` and must never be cached, because the server owns the game state.

## Production Image

The `Dockerfile` builds the app and serves it with nginx as a non-root user (uid 65532) on a read-only file
system, with SPA fallback routing and `/healthz`. All response headers, including the Content Security Policy,
are set at server level in `nginx.conf`, never inside a `location` (an `add_header` there would drop the
inherited ones). CI starts the hardened container and checks the headers, caching and PWA files.
