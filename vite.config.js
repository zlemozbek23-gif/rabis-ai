import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function fluxImagePlugin() {
  return {
    name: 'flux-generator-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/flux-generate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { prompt, seed, width = 768, height = 1024 } = JSON.parse(body || '{}')
            if (!prompt) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Prompt is required' }))
              return
            }

            const { Client } = await import('@gradio/client')
            const hfToken = process.env.VITE_HF_TOKEN || ''
            const client = await Client.connect('black-forest-labs/FLUX.1-schnell', {
              token: hfToken
            })
            
            const result = await client.predict('/infer', {
              prompt,
              seed: seed || Math.floor(Math.random() * 999999),
              randomize_seed: true,
              width: Number(width) || 768,
              height: Number(height) || 1024,
              num_inference_steps: 4,
            })

            const imgUrl = result?.data?.[0]?.url
            if (!imgUrl) {
              throw new Error('No image URL returned from FLUX')
            }

            // Fetch image binary and proxy it back directly to avoid CORS in browser
            const https = await import('https')
            https.get(imgUrl, (proxyRes) => {
              res.writeHead(proxyRes.statusCode || 200, {
                'Content-Type': proxyRes.headers['content-type'] || 'image/webp',
                'Cache-Control': 'public, max-age=86400',
              })
              proxyRes.pipe(res)
            }).on('error', (err) => {
              console.error('FLUX proxy error:', err)
              res.statusCode = 502
              res.end(JSON.stringify({ error: 'Failed to download generated image' }))
            })
          } catch (err) {
            console.error('FLUX generation error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message || 'Generation failed' }))
          }
        })
      })
    }
  }
}

export default defineConfig({
  server: {
    proxy: {
      '/api-together': {
        target: 'https://api.together.xyz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-together/, ''),
      },
      '/api-openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-openai/, ''),
      },
      '/api-pollinations': {
        target: 'https://image.pollinations.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-pollinations/, ''),
      },
    },
  },
  plugins: [
    react(),
    fluxImagePlugin(),

    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      },
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png', 'icons/*.png'],
      manifest: {
        name: 'StyleAI — AI Stil Asistanın',
        short_name: 'StyleAI',
        description: 'Yapay zeka destekli kombin önerileri — dolabından, havaya göre',
        theme_color: '#7c3aed',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'tr',
        categories: ['lifestyle', 'shopping'],
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openweathermap\.org\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-cache',
              expiration: { maxAgeSeconds: 1800 },
            },
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wardrobe-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 86400 * 7 },
            },
          },
        ],
      },
    }),
  ],
})
