/**
 * Vercel Serverless SSR Handler (Build Output API)
 * 處理所有前端 SSR 請求
 *
 * 檔案結構（在 .func 目錄內）：
 * - index.js (本檔案)
 * - index.html (模板)
 * - server/entry-server.js (SSR bundle)
 *
 * @module functions/ssr
 */

const fs = require("node:fs");
const path = require("node:path");

module.exports = async function handler(req, res) {
  const url = req.url;

  try {
    console.log(`📥 SSR Request: ${url}`);
    console.log(`📂 __dirname: ${__dirname}`);

    // 在 .func 目錄內，文件是相對於當前目錄的
    const templatePath = path.join(__dirname, "index.html");
    const serverModulePath = path.join(__dirname, "server/entry-server.js");

    console.log(`📄 Template path: ${templatePath}`);
    console.log(`📦 Server module path: ${serverModulePath}`);

    // 驗證文件存在
    if (!fs.existsSync(templatePath)) {
      throw new Error(`index.html not found at: ${templatePath}`);
    }
    if (!fs.existsSync(serverModulePath)) {
      throw new Error(`entry-server.js not found at: ${serverModulePath}`);
    }

    // 讀取 HTML 模板
    const template = fs.readFileSync(templatePath, "utf-8");

    // 載入 SSR render 函數
    console.log("📦 Loading entry-server module...");
    const serverModule = await import(
      `file://${serverModulePath.replace(/\\/g, "/")}`
    );
    const { render } = serverModule;

    if (!render || typeof render !== "function") {
      throw new Error(
        `entry-server.js does not export a 'render' function. Exports: ${Object.keys(
          serverModule,
        ).join(", ")}`,
      );
    }

    // 渲染 HTML
    console.log("🎨 Rendering HTML...");
    let appHtml;
    try {
      const renderResult = render(url);
      appHtml = renderResult.html;
    } catch (renderError) {
      console.error("❌ React render error:", renderError.message);
      console.error("Falling back to CSR...");
      // 渲染失敗，返回空的 SSR outlet 讓客戶端渲染接管
      appHtml = "";
    }

    const html = template.replace("<!--ssr-outlet-->", appHtml);

    res
      .status(200)
      .setHeader("Content-Type", "text/html")
      .setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
      .setHeader("Pragma", "no-cache")
      .setHeader("Expires", "0")
      .end(html);
  } catch (e) {
    console.error("❌ SSR Error:", e.message);
    console.error("Stack:", e.stack);
    console.error("__dirname:", __dirname);

    // 如果 SSR 失敗，返回基礎 HTML 讓 CSR 接管
    try {
      const fallbackPath = path.join(__dirname, "index.html");
      if (fs.existsSync(fallbackPath)) {
        const template = fs.readFileSync(fallbackPath, "utf-8");
        res.status(200).setHeader("Content-Type", "text/html").end(template);
      } else {
        throw new Error(`Fallback index.html not found at: ${fallbackPath}`);
      }
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError.message);
      res
        .status(500)
        .end(
          `SSR Error: ${e.message}\n\nFallback Error: ${fallbackError.message}\n\nStack:\n${e.stack}`,
        );
    }
  }
};
