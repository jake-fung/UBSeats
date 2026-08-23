import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(() => ({
  server: {
    host: '::',
    port: 8080,
    proxy: {
      '/place-details': {
        target: 'https://places.googleapis.com',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace('/place-details/', '/v1/places/'),
      },
    },
  },
  plugins: [react(), tailwindcss()].filter(Boolean),
  resolve: {
    // Order matters: `@/supabase/*` must be matched before the broader `@` alias,
    // since the supabase folder lives at the repo root, not under src/.
    alias: [
      { find: /^@\/supabase\//, replacement: path.resolve(__dirname, './supabase') + '/' },
      { find: /^@\//, replacement: path.resolve(__dirname, './src') + '/' },
    ],
  },
}));
