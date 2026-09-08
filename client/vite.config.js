import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'SilBeauty - Sua Loja Online',
        short_name: 'SilBeauty',
        description: 'Beleza e cuidado em cada produto, com todo o carinho da SilBeauty.',
        theme_color: '#f7f7fa',
        background_color: '#f7f7fa',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'pt-BR',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cacheia os arquivos do app para funcionar offline / carregar instantâneo.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Produtos vêm do Firebase Realtime Database via WebSocket, então
        // cacheamos as chamadas REST auxiliares (ex: imagens externas) via runtimeCaching.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|webp|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'silbeauty-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
              },
            },
          },
        ],
      },
    }),
  ],
})
