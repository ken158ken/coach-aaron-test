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

    // 列出當前目錄內容以便調試
    const cwdContents = fs.readdirSync(process.cwd());
    console.log(`📋 CWD contents: ${cwdContents.join(", ")}`);

    // Vercel 傳統 Functions: index.html 應該在根目錄（從 outputDirectory 複製）
    const possibleTemplatePaths = [
      path.resolve(process.cwd(), "index.html"), // Vercel 傳統模式
      path.resolve(__dirname, "../frontend/dist/client/index.html"), // 本地開發
      path.resolve(process.cwd(), ".vercel_build_output/index.html"), // 舊的 Build Output API
    ];

    let templatePath = null;
    for (const p of possibleTemplatePaths) {
      if (fs.existsSync(p)) {
        templatePath = p;
        console.log(`✓ Found template: ${templatePath}`);
        break;
      }
    }

    if (!templatePath) {
      const errorMsg = `❌ Cannot find index.html.\nTried paths:\n${possibleTemplatePaths
        .map((p) => `  - ${p} (exists: ${fs.existsSync(p)})`)
        .join("\n")}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // entry-server.js 路徑
    const possiblePaths = [
      // Vercel 傳統模式：需要通過 includeFiles 複製
      path.resolve(process.cwd(), "server/entry-server.js"),
      // 本地開發
      path.resolve(__dirname, "../frontend/dist/server/entry-server.js"),
      // Build Output API 模式
      path.resolve(__dirname, "../.vercel_build_output/server/entry-server.js"),
    ];

    console.log("🔍 Checking possible paths:");
    let serverModulePath = null;
    for (const p of possiblePaths) {
      const exists = fs.existsSync(p);
      console.log(`  ${exists ? "✓" : "✗"} ${p}`);
      if (exists && !serverModulePath) {
        serverModulePath = p;
      }
    }

    if (!serverModulePath) {
      // 檢查 server 目錄是否存在
      const serverDir = path.resolve(process.cwd(), "server");
      const serverExists = fs.existsSync(serverDir);
      console.error(`❌ server/ directory exists: ${serverExists}`);

      if (serverExists) {
        const serverContents = fs.readdirSync(serverDir);
        console.error(`📋 server/ contents: ${serverContents.join(", ")}`);
      }

      const errorMsg = `❌ Cannot find entry-server.js.\nTried paths:\n${possiblePaths
        .map((p) => `  - ${p} (exists: ${fs.existsSync(p)})`)
        .join("\n")}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log(`✓ Using entry-server.js: ${serverModulePath}`);

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
