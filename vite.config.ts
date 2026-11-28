/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' as prefix = load all variables, not only those starting with VITE_.
  // VITE_PROXY_TARGET is only used here in Node and never reaches browser code.
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5081'

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // En ny version tager over med det samme, og main.tsx genindlæser siden.
        registerType: 'autoUpdate',
        // Registreringen sker i main.tsx, ikke med et indsat script.
        injectRegister: false,
        manifest: {
          id: '/',
          name: 'Risk',
          short_name: 'Risk',
          description: 'Risk-brætspillet online',
          lang: 'da',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#1c1917',
          theme_color: '#1c1917',
          icons: [
            { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Ny service worker tager over med det samme i stedet for at vente på, at alle faner lukkes.
          // Sættes ikke af sig selv, fordi injectRegister er false. main.tsx genindlæser så siden.
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
          cleanupOutdatedCaches: true,
          // Navigation i SPA'en (fx /game/123) får index.html fra cachen, også offline.
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/hubs\//, /^\/healthz$/],
          runtimeCaching: [
            {
              // API og SignalR går altid til serveren. Spillets tilstand må aldrig komme fra en cache.
              urlPattern: ({ url }) =>
                url.pathname.startsWith('/api/') || url.pathname.startsWith('/hubs/'),
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
    server: {
      // Same role as the reverse proxy in production: the browser only sees one origin.
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true },
        '/hubs': { target: proxyTarget, changeOrigin: true, ws: true },
      },
    },
    test: {
      coverage: {
        provider: 'v8',
        // Tag alle kildefiler med, også dem uden tests, så totalen er ærlig.
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.ts', 'src/types/**', 'src/**/*.d.ts'],
        reporter: ['text', 'json-summary', 'html'],
        // Lidt under de nuværende tal, så coverage ikke falder for den testede logik.
        thresholds: {
          'src/feature/game/rules.ts': { statements: 70, branches: 70, functions: 75, lines: 75 },
          'src/api/auth/session.ts': { statements: 90, branches: 80, functions: 100, lines: 95 },
          'src/realtime/hubLease.ts': { statements: 95, branches: 95, functions: 95, lines: 95 },
          'src/api/client.ts': { statements: 90, branches: 90, functions: 75, lines: 90 },
        },
      },
    },
  }
})
