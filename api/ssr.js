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

    // Vercel 上，frontend/dist/server 會被 includeFiles 複製到函數目錄
    const serverDir = path.resolve(__dirname, "../frontend/dist/server");
    const clientDir = path.resolve(__dirname, "../frontend/dist/client");
    
    console.log(`📂 Server dir: ${serverDir}`);
    console.log(`📂 Client dir: ${clientDir}`);

    // 檢查目錄是否存在
    if (fs.existsSync(serverDir)) {
      const serverContents = fs.readdirSync(serverDir);
      console.log(`📋 Server contents: ${serverContents.join(", ")}`);
    } else {
      console.error(`❌ Server directory not found: ${serverDir}`);
    }

    if (fs.existsSync(clientDir)) {
      const clientContents = fs.readdirSync(clientDir);
      console.log(`📋 Client contents: ${clientContents.slice(0, 10).join(", ")}...`);
    } else {
      console.error(`❌ Client directory not found: ${clientDir}`);
    }

    // 找 index.html
    const templatePath = path.resolve(clientDir, "index.html");
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`❌ Cannot find index.html at ${templatePath}`);
    }
    
    console.log(`✓ Found template: ${templatePath}`);

    // 找 entry-server.js
    const serverModulePath = path.resolve(serverDir, "entry-server.js");
    
    if (!fs.existsSync(serverModulePath)) {
      throw new Error(`❌ Cannot find entry-server.js at ${serverModulePath}`);
    }
    
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
