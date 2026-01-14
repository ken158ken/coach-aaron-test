/**
 * Vercel Serverless SSR Handler
 * 處理所有前端 SSR 請求
 * 
 * @module api/ssr
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
  const url = req.url;

  try {
    // 讀取 HTML 模板
    const template = fs.readFileSync(
      path.resolve(__dirname, '../frontend/dist/client/index.html'),
      'utf-8'
    );

    // 載入 SSR render 函數
    const { render } = await import('../frontend/dist/server/entry-server.js');

    // 渲染 HTML
    const { html: appHtml } = render(url);
    const html = template.replace('<!--ssr-outlet-->', appHtml);

    res.status(200).setHeader('Content-Type', 'text/html').end(html);
  } catch (e) {
    console.error('SSR Error:', e);
    res.status(500).end(e.stack);
  }
}
