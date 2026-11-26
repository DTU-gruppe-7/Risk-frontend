import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'
import { registerSW } from 'virtual:pwa-register'
import './app/index.css'
import { router } from './app/router.ts'
import { queryClient } from './api/query/queryClient.ts'
import { AuthProvider } from './auth/AuthProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* The router renders after the session is restored, so route gurads see the real login state */}
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  </StrictMode>,
)

// Service workeren cacher app-skallen, så siden starter hurtigt og kan åbnes offline.
// Når et nyt deploy er ude, tager den nye version over, og siden genindlæses af sig selv.
// Spillets tilstand ligger på serveren, så en genindlæsning mister ikke noget.
registerSW({ immediate: true })
