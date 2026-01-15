/**
 * Vercel Serverless SSR Handler
 * 處理所有前端 SSR 請求
 *
 * @module api/ssr
 */

const fs = require("node:fs");
const path = require("node:path");

module.exports = async function handler(req, res) {
  const url = req.url;

  try {
    // 在 Vercel 部署時，靜態文件在根目錄
    const templatePath = path.resolve(process.cwd(), "index.html");
    const serverModulePath = path.resolve(
      __dirname,
      "../frontend/dist/server/entry-server.js"
    );

    // 讀取 HTML 模板
    const template = fs.readFileSync(templatePath, "utf-8");

    // 載入 SSR render 函數
    const { render } = require(serverModulePath);

    // 渲染 HTML
    const { html: appHtml } = render(url);
    const html = template.replace("<!--ssr-outlet-->", appHtml);

    res.status(200).setHeader("Content-Type", "text/html").end(html);
  } catch (e) {
    console.error("SSR Error:", e);
    console.error("__dirname:", __dirname);
    console.error("process.cwd():", process.cwd());

    // 如果 SSR 失敗，返回基礎 HTML 讓 CSR 接管
    try {
      const template = fs.readFileSync(
        path.resolve(process.cwd(), "index.html"),
        "utf-8"
      );
      res.status(200).setHeader("Content-Type", "text/html").end(template);
    } catch (fallbackError) {
      res.status(500).end(e.stack);
    }
  }
};
