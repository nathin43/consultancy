import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3003,
    },
    // ⚠️  IMPORTANT: This frontend (port 3003) proxies API requests to the backend
    // ⚠️  The backend MUST be running on port 50004 before starting the frontend
    // Backend is configured in: backend/.env (PORT=50004)
    // If you change the backend port, update the 'target' values below accordingly
    proxy: {
      '/api': {
        target: 'http://localhost:50004',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            // Silently handle backend-not-running errors instead of spamming the terminal
            if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
              if (res && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Backend server is not running' }));
              }
              return;
            }
            console.error('[proxy error]', err.message);
          });
        },
      },
      '/uploads': {
        target: 'http://localhost:50004',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
              if (res && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'text/plain' });
                res.end('Backend server is not running');
              }
              return;
            }
            console.error('[proxy error]', err.message);
          });
        },
      }
    }
  }
})
