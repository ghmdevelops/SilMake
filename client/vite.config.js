import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Em produção, as rotas /api/* são atendidas por funções do Netlify (veja
// netlify.toml). No `npm run dev` elas não existiriam e dariam 404. Este
// plugin executa as MESMAS funções localmente, para dar para testar a
// integração antes de publicar.
const API_ROUTES = {
  '/api/shipping-quote': 'shipping-quote',
  '/api/melhorenvio/connect': 'melhorenvio-connect',
  '/api/melhorenvio/callback': 'melhorenvio-callback',
  '/api/melhorenvio/status': 'melhorenvio-status',
}

const FORWARDED_ENV = [
  'MELHOR_ENVIO_CLIENT_ID',
  'MELHOR_ENVIO_CLIENT_SECRET',
  'MELHOR_ENVIO_ENV',
  'MELHOR_ENVIO_USER_AGENT',
  'URL',
]

function netlifyFunctionsDev(env) {
  return {
    name: 'netlify-functions-dev',
    apply: 'serve',
    configureServer(server) {
      // As funções leem as credenciais de process.env (padrão do Netlify),
      // então repassamos o que estiver no .env local.
      for (const key of FORWARDED_ENV) {
        if (env[key]) process.env[key] = env[key]
      }

      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '').split('?')[0]
        const functionName = API_ROUTES[path]
        if (!functionName) return next()

        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)

          const request = new Request(`http://localhost:${server.config.server.port || 5173}${req.url}`, {
            method: req.method,
            headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
            redirect: 'manual',
          })

          const mod = await server.ssrLoadModule(`/netlify/functions/${functionName}.mjs`)
          const response = await mod.default(request)

          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(await response.text())
        } catch (err) {
          server.config.logger.error(`[${functionName}] ${err.message}`)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'dev_handler_failed', message: err.message }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    netlifyFunctionsDev(loadEnv(mode, process.cwd(), '')),
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
}))
