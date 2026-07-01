import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The web dev server proxies /api to the Express backend so the frontend can
// call same-origin paths in both dev and prod.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
