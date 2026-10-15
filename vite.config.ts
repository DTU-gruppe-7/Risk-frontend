import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' as prefix = load all variables, not only those starting with VITE_.
  // VITE_PROXY_TARGET is only used here in Node and never reaches browser code.
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5081'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // Same role as the reverse proxy in production: the browser only sees one origin.
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true },
        '/hubs': { target: proxyTarget, changeOrigin: true, ws: true },
      },
    },
  }
})
