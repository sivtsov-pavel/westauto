import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Кеш держим вне примонтированных каталогов: node_modules внутри
  // контейнера — анонимный том, и права на него принадлежат не нам
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
    port: 5173,
    strictPort: true,
    // Ходим через nginx на local.westauto.com.ua — иначе Vite
    // отклонит запрос по проверке Host
    allowedHosts: true,
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
  ssr: {
    /*
     * Вшиваем зависимости в серверный бандл вместо ссылок на node_modules.
     *
     * Образ сервера сайта тогда состоит из двух каталогов и не тянет
     * несколько сотен мегабайт зависимостей ради react-dom/server.
     */
    noExternal: true,
  },
});
