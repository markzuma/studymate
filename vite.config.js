import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['periak-icon.svg'],
      manifest: {
        id: '/',
        name: 'PERIAK',
        short_name: 'PERIAK',
        description: 'Learn. Practise. Excel.',
        theme_color: '#287dcc',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png?v=3',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png?v=3',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/periak-maskable-512.png?v=3',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
})
