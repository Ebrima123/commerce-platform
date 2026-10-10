import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// /api is proxied to the backend in development so the app never needs a CORS
// allowance for localhost (or *.localhost store subdomains).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.API_PROXY_TARGET || 'https://estore-backend-6on4.onrender.com';
  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      proxy: { '/api': { target, changeOrigin: true, secure: true } },
    },
  };
});
