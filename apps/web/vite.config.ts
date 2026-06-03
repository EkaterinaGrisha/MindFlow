import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const repoRoot = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, repoRoot, '');

  return {
    plugins: [react(), tailwindcss()],
    envDir: repoRoot,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Делим бандл, чтобы первый paint не качал 4 МБ JS целиком.
      // Тяжёлые модули (KaTeX-движок, recharts, dnd-kit, supabase-клиент)
      // выносим в отдельные чанки — браузер скачивает их параллельно и
      // кеширует независимо от частых изменений приложения.
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            katex: ['katex', 'react-markdown', 'rehype-katex', 'remark-math', 'remark-gfm'],
            charts: ['recharts'],
            dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
            supabase: ['@supabase/supabase-js'],
            icons: ['lucide-react'],
            motion: ['motion'],
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: env.VITE_API_BASE_URL
        ? undefined
        : {
            '/api': {
              target: 'http://localhost:8787',
              changeOrigin: true,
            },
          },
    },
  };
});
