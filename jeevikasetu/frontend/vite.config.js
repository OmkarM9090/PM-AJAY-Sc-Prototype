import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The frontend never talks to the backend host directly — it always calls
// relative /api paths which Vite proxies. That keeps the app working on
// localhost, on a LAN demo machine and inside hosted preview sandboxes.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
