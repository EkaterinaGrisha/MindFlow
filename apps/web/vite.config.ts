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
