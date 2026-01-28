/**
 * SSR 開發/生產伺服器
 * @module server
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

async function createServer() {
  const app = express()

  let vite
  if (!isProduction) {
    // Development mode - use Vite dev server as middleware
    const { createServer } = await import('vite')
    vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom'
    })
    app.use(vite.middlewares)
  } else {
    // Production mode - serve static files
    app.use(express.static(path.resolve(__dirname, 'dist/client'), { index: false }))
  }

  app.use('/{*splat}', async (req, res, next) => {
    const url = req.originalUrl

    try {
      let template, render

      if (!isProduction) {
        // Dev: read template and transform with Vite
        template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
      } else {
        // Prod: use built assets
        template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
        render = (await import('./dist/server/entry-server.js')).render
      }

      const { html: appHtml, head } = render(url)
      
      // 注入 SSR 內容和 head 標籤
      let html = template.replace('<!--ssr-outlet-->', appHtml)
      
      // 如果有 head 標籤，注入到 <!--ssr-head--> 位置
      if (head) {
        html = html.replace('<!--ssr-head-->', head)
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(e)
      }
      console.error(e.stack)
      res.status(500).end(e.stack)
    }
  })

  const port = process.env.PORT || 5173
  app.listen(port, () => {
    console.log(`SSR Server running at http://localhost:${port}`)
  })
}

createServer()
