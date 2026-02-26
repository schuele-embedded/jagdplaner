import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'AnsitzPlaner',
        short_name: 'AnsitzPlaner',
        description: 'Kartenbasierte Jagdplanung mit interaktiver Revierkarte und KI-Erfolgsvorhersage für Jäger.',
        theme_color: '#2d5016',
        background_color: '#1a1a1a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
          // TODO: Add PNG icons for full PWA installation support:
          // icon-192x192.png and icon-512x512.png generated from public/icons/icon.svg
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // OSM tiles zoom >= 14 (detail) – CacheFirst, max 1000 entries, 30 days
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/1[4-9]\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles-detail',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // OSM tiles zoom < 14 (overview) – StaleWhileRevalidate, max 200 entries
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/([0-9]|1[0-3])\//i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'osm-tiles-overview',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Weather API – network first, fallback to cache
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase API calls – never cache (network only, sensitive data)
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
