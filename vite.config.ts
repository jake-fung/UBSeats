import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(() => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react(), tailwindcss()].filter(Boolean),
  resolve: {
    alias: [
      { find: /^@\/supabase\//, replacement: path.resolve(__dirname, './supabase') + '/' },
      { find: /^@\//, replacement: path.resolve(__dirname, './src') + '/' },
    ],
  },
}));
