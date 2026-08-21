import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Arus — Latihan Arus Kas',
        short_name: 'Arus',
        description: 'Latihan arus kas dan pengelolaan emosi terhadap uang.',
        lang: 'id',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FDFBF7',
        theme_color: '#0F766E',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/uji/setup.ts'],
  },
});
