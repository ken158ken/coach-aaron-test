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
    console.log(`📥 SSR Request: ${url}`);
    console.log(`📂 CWD: ${process.cwd()}`);
    console.log(`📂 __dirname: ${__dirname}`);

    // Vercel 架構：
    // - outputDirectory (frontend/dist/client) → 自動提供給所有 functions
    // - includeFiles (frontend/dist/server/entry-server.js) → 複製到函數目錄

    // HTML 模板來自 outputDirectory (自動可用)
    const templatePath = path.resolve(process.cwd(), "index.html");

    // SSR bundle 來自 includeFiles
    const serverModulePath = path.resolve(
      __dirname,
      "../frontend/dist/server/entry-server.js",
    );

    console.log(`📂 Template path: ${templatePath}`);
    console.log(`📂 Server module path: ${serverModulePath}`);

    // 檢查檔案
    if (!fs.existsSync(templatePath)) {
      console.error(`❌ Template not found at ${templatePath}`);
      console.log(`📋 Available files in CWD:`, fs.readdirSync(process.cwd()));
      throw new Error(`Cannot find index.html at ${templatePath}`);
    }

    if (!fs.existsSync(serverModulePath)) {
      console.error(`❌ Server module not found at ${serverModulePath}`);
      const parentDir = path.dirname(serverModulePath);
      if (fs.existsSync(parentDir)) {
        console.log(`📋 Files in ${parentDir}:`, fs.readdirSync(parentDir));
      }
      throw new Error(`Cannot find entry-server.js at ${serverModulePath}`);
    }

    console.log(`✓ Found template: ${templatePath}`);
    console.log(`✓ Found entry-server.js: ${serverModulePath}`);

    // 讀取 HTML 模板
    const template = fs.readFileSync(templatePath, "utf-8");

    // 載入 SSR render 函數（使用動態 import 支援 ES modules）
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
    let headTags = "";
    try {
      const renderResult = render(url);
      appHtml = renderResult.html;
      headTags = renderResult.head || "";
    } catch (renderError) {
      console.error("❌ React render error:", renderError.message);
      console.error("Falling back to CSR...");
      // 渲染失敗，返回空的 SSR outlet 讓客戶端渲染接管
      appHtml = "";
    }

    // 注入 head 標籤和 body 內容
    let html = template.replace("<!--ssr-outlet-->", appHtml);
    html = html.replace("<!--ssr-head-->", headTags);

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
    console.error("process.cwd():", process.cwd());

    // 如果 SSR 失敗，返回基礎 HTML 讓 CSR 接管
    try {
      // 嘗試找到 index.html
      const fallbackPaths = [
        path.resolve(process.cwd(), ".vercel_build_output/index.html"),
        path.resolve(process.cwd(), "index.html"),
      ];

      let fallbackTemplate = null;
      for (const p of fallbackPaths) {
        if (fs.existsSync(p)) {
          fallbackTemplate = fs.readFileSync(p, "utf-8");
          break;
        }
      }

      if (fallbackTemplate) {
        res
          .status(200)
          .setHeader("Content-Type", "text/html")
          .setHeader("X-SSR-Fallback", "true")
          .end(fallbackTemplate);
        return;
      }
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError.message);
    }

    res.status(500).json({
      error: "SSR Failed",
      message: e.message,
      details:
        process.env.NODE_ENV === "development"
          ? { __dirname, cwd: process.cwd(), stack: e.stack }
          : undefined,
    });
  }
};
