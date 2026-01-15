/**
 * Vercel Serverless SSR Handler
 * 處理所有前端 SSR 請求
 *
 * @module api/ssr
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
  const url = req.url;

  try {
    // 在 Vercel 部署時，靜態文件在根目錄，server bundle 需要從 frontend/dist/server 讀取
    const templatePath = process.env.VERCEL
      ? path.resolve(process.cwd(), "index.html")
      : path.resolve(__dirname, "../frontend/dist/client/index.html");

    const serverModulePath = process.env.VERCEL
      ? path.resolve(process.cwd(), "../frontend/dist/server/entry-server.js")
      : path.resolve(__dirname, "../frontend/dist/server/entry-server.js");

    // 讀取 HTML 模板
    const template = fs.readFileSync(templatePath, "utf-8");

    // 載入 SSR render 函數
    const { render } = await import(serverModulePath);

    // 渲染 HTML
    const { html: appHtml } = render(url);
    const html = template.replace("<!--ssr-outlet-->", appHtml);

    res.status(200).setHeader("Content-Type", "text/html").end(html);
  } catch (e) {
    console.error("SSR Error:", e);
    console.error("__dirname:", __dirname);
    console.error("process.cwd():", process.cwd());
    res.status(500).end(e.stack);
  }
}
