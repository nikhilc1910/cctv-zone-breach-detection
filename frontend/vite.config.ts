import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'https://realtime-digital-twin-dashboard-1.onrender.com',
        changeOrigin: true,
        secure: true
      },
      '/socket.io': {
        target: 'https://realtime-digital-twin-dashboard-1.onrender.com',
        ws: true,
        changeOrigin: true,
        secure: true
      }
    }
  }
})
