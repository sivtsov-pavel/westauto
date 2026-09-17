import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Приложение живёт на /app/ того же хоста, что и сайт: один origin —
 * значит cookie-сессия работает без CORS, а API доступен по /api.
 */
export default defineConfig({
  base: '/app/',
  plugins: [react()],
  // Кеш держим вне примонтированных каталогов: node_modules внутри
  // контейнера — анонимный том, и права на него принадлежат не нам
  cacheDir: process.env['VITE_CACHE_DIR'] ?? 'node_modules/.vite',
  resolve: {
    alias: {
      // Общий пакет подключаем исходниками: правка движка расчёта
      // сразу приезжает в браузер через HMR, без пересборки пакета
      '@avtoklyuch/shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url),
      ),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    // Ходим через nginx на local.westauto.com.ua — иначе Vite
    // отклонит запрос по проверке Host
    allowedHosts: true,
    // За nginx: иначе HMR стучится не туда
    hmr: { clientPort: Number(process.env['HTTP_PORT'] ?? 80) },
    proxy: {
      '/api': { target: process.env['API_URL'] ?? 'http://api:3000', changeOrigin: true },
      '/uploads': { target: process.env['API_URL'] ?? 'http://api:3000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
