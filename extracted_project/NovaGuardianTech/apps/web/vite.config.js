import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      protocol: 'wss',
      host: undefined,
      clientPort: 443,
      timeout: 30000,
    },
    proxy: {
      '/api': {
        target: process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS}:8080`
          : 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5000,
  },
})
