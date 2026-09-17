import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  cacheDir: process.env['VITE_CACHE_DIR'] ?? 'node_modules/.vite',
  resolve: {
    alias: {
      '@avtoklyuch/shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url),
      ),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    allowedHosts: true,
    hmr: { clientPort: Number(process.env['HTTP_PORT'] ?? 80) },
    proxy: {
      '/api': { target: process.env['API_URL'] ?? 'http://api:3000', changeOrigin: true },
      '/uploads': { target: process.env['API_URL'] ?? 'http://api:3000', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
  ssr: {
    // Самодостаточный бандл: образу сервера не нужны node_modules
    noExternal: true,
  },
});
