import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Fleet ports: frontend 11184, backend 11183 (WEBAPP_PORTS.md; was 10810/10811)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const frontendPort = Number(env.VITE_PORT || process.env.VITE_PORT || 11184)
  const apiTarget =
    env.VITE_API_TARGET ||
    process.env.VITE_API_TARGET ||
    'http://127.0.0.1:11183'

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/docs': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/openapi.json': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/redoc': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
