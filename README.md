# Risk Frontend

React 19 + Vite + TanStack Router/Query + Tailwind + SignalR client for the online Risk board game.

## Local Development

Prerequisites: Node.js 24 and npm.

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

### Against the dev server

To work on the frontend without running the backend, point the proxy at the shared dev environment by creating
`.env.development.local` (git-ignored):

```bash
VITE_PROXY_TARGET=https://130.225.170.66:8443
```

Restart `npm run dev` afterwards. Delete the file (or the line) to go back to the local backend.

Keep in mind that the dev environment's data is shared with the rest of the group, and that it runs the code
from `develop` — API changes on your own backend branch are not there yet.

`VITE_PROXY_TARGET` is only read by Vite's Node process and never ends up in the browser bundle.

---

## Vite Template Notes

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
