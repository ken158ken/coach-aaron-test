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
    // Vercel 部署時的路徑結構
    // outputDirectory 現在設為 ".vercel_build_output"
    // 包含 client 檔案 + server 子目錄
    
    const templatePath = path.resolve(process.cwd(), "index.html");

    // 可能的 entry-server.js 路徑
    const possiblePaths = [
      // Vercel 部署後：outputDirectory 為根，server 在子目錄
      path.resolve(process.cwd(), "server/entry-server.js"),
      // 本地開發
      path.resolve(__dirname, "../frontend/dist/server/entry-server.js"),
      path.resolve(process.cwd(), "frontend/dist/server/entry-server.js"),
    ];

    let serverModulePath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        serverModulePath = p;
        console.log(`✓ Found entry-server.js at: ${p}`);
        break;
      }
    }

    if (!serverModulePath) {
      const errorMsg = `❌ Cannot find entry-server.js.\nTried paths:\n${possiblePaths.map(p => `  - ${p} (exists: ${fs.existsSync(p)})`).join('\n')}\nCurrent directory: ${process.cwd()}\n__dirname: ${__dirname}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

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
