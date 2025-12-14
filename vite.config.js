import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    hmr: {
      overlay: false
    },
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/data/**',
        '**/output/**',
        '**/*.log',
        '**/episode-links.js',
        '**/rebuild-latest.js',
        '**/bulk-fetch.js'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
