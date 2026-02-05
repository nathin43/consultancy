import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:50000',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/uploads': {
        target: 'http://localhost:50001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
