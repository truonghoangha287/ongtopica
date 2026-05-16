import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,webp,mp3,svg,woff2}'],
      },
      manifest: {
        name: 'Ongtopica',
        short_name: 'Ongtopica',
        display: 'standalone',
        theme_color: '#4A90E2',
        background_color: '#FFFFFF',
        icons: [
          {
            src: '/assets/images/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/assets/images/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
