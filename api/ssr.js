/**
 * Vercel Serverless SSR Handler
 * 處理所有前端 SSR 請求
 *
 * @module api/ssr
 * @description
 *   在 Vercel 部署時：
 *   - __dirname = /var/task/api
 *   - process.cwd() = /var/task
 *   - includeFiles 將 frontend/dist/server/** 和 frontend/dist/client/index.html
 *     複製到 /var/task/frontend/dist/server/** 和 /var/task/frontend/dist/client/index.html
 *   - outputDirectory (frontend/dist/client) 的內容會作為靜態檔案供 CDN 分發
 */

const fs = require("node:fs");
const path = require("node:path");

/**
 * 嘗試從多個候選路徑中找到存在的檔案
 *
 * @param {string[]} candidates - 候選路徑陣列
 * @param {string} label - 檔案描述標籤（用於日誌）
 * @returns {string|null} 找到的路徑，若無則回傳 null
 */
function findFile(candidates, label) {
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      console.log(`✓ Found ${label}: ${p}`);
      return p;
    }
  }
  console.error(`❌ ${label} not found in any of:`);
  candidates.forEach((p) => console.error(`   - ${p}`));
  return null;
}

/**
 * 列出目錄內容（輔助偵錯）
 *
 * @param {string} dir - 目錄路徑
 * @param {number} depth - 遞迴深度
 * @returns {string[]} 檔案清單
 */
function listDir(dir, depth = 2) {
  const result = [];
  try {
    if (!fs.existsSync(dir)) return [`(not found: ${dir})`];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      result.push(fullPath);
      if (entry.isDirectory() && depth > 1) {
        result.push(...listDir(fullPath, depth - 1));
      }
    }
  } catch (err) {
    result.push(`(error reading ${dir}: ${err.message})`);
  }
  return result;
}

module.exports = async function handler(req, res) {
  const url = req.url;

  try {
    console.log(`📥 SSR Request: ${url}`);
    console.log(`📂 CWD: ${process.cwd()}`);
    console.log(`📂 __dirname: ${__dirname}`);

    // 專案根目錄 (Vercel: /var/task)
    const projectRoot = process.cwd();

    // ===== 1. 尋找 HTML 模板 =====
    // index.html 由 Vite client build 產生在 frontend/dist/client/index.html
    // 透過 includeFiles 複製到 serverless 函數可存取的路徑
    const templateCandidates = [
      path.resolve(projectRoot, "frontend/dist/client/index.html"),
      path.resolve(__dirname, "../frontend/dist/client/index.html"),
      path.resolve(projectRoot, "index.html"),
      path.resolve(__dirname, "../index.html"),
    ];

    const templatePath = findFile(templateCandidates, "index.html");
    if (!templatePath) {
      console.error("📋 Project root contents:", listDir(projectRoot));
      console.error(
        "📋 Frontend dir:",
        listDir(path.resolve(projectRoot, "frontend"), 3),
      );
      throw new Error("Cannot find index.html template");
    }

    // ===== 2. 尋找 SSR entry module =====
    // entry-server.js 由 Vite SSR build 產生在 frontend/dist/server/
    const serverModuleCandidates = [
      path.resolve(projectRoot, "frontend/dist/server/entry-server.js"),
      path.resolve(__dirname, "../frontend/dist/server/entry-server.js"),
    ];

    const serverModulePath = findFile(
      serverModuleCandidates,
      "entry-server.js",
    );
    if (!serverModulePath) {
      console.error("📋 Project root contents:", listDir(projectRoot));
      console.error(
        "📋 Server dist dir:",
        listDir(path.resolve(projectRoot, "frontend/dist/server")),
      );
      throw new Error("Cannot find entry-server.js SSR module");
    }

    // ===== 3. 讀取 HTML 模板 =====
    const template = fs.readFileSync(templatePath, "utf-8");

    // ===== 4. 載入 SSR render 函數 =====
    console.log("📦 Loading entry-server module...");
    // 使用運行時拼接路徑，防止 @vercel/nft 追蹤 entry-server.js 內部的依賴
    // entry-server.js 已是完全打包的 bundle (noExternal: true)，不需要 node_modules
    const moduleUrl = ["file://", serverModulePath.replace(/\\/g, "/")].join(
      "",
    );
    const serverModule = await import(/* @vite-ignore */ moduleUrl);
    const { render } = serverModule;

    if (!render || typeof render !== "function") {
      throw new Error(
        `entry-server.js does not export a 'render' function. Exports: ${Object.keys(serverModule).join(", ")}`,
      );
    }

    // ===== 5. 渲染 HTML =====
    console.log("🎨 Rendering HTML...");
    let appHtml = "";
    let headTags = "";

    try {
      const renderResult = render(url);
      appHtml = renderResult.html || "";
      headTags = renderResult.head || "";
    } catch (renderError) {
      console.error("❌ React render error:", renderError.message);
      console.error("Stack:", renderError.stack);
      console.error("Falling back to CSR...");
      // 渲染失敗，appHtml 保持空字串讓客戶端渲染接管
    }

    // ===== 6. 注入 head 標籤和 body 內容 =====
    let html = template;

    // 替換 SSR outlet (支援 client build 後的 HTML)
    if (html.includes("<!--ssr-outlet-->")) {
      html = html.replace("<!--ssr-outlet-->", appHtml);
    } else {
      // client build 後 index.html 中的 <div id="root"></div> 可能沒有 ssr-outlet
      // 直接在 <div id="root"> 後面注入
      html = html.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`,
      );
    }

    // 替換 SSR head
    if (html.includes("<!--ssr-head-->")) {
      html = html.replace("<!--ssr-head-->", headTags);
    }

    // 將開發時的 entry-client 腳本路徑移除（已由 Vite client build 處理）
    html = html.replace(
      '<script type="module" src="/src/entry-client.tsx"></script>',
      "",
    );

    console.log(`✅ SSR complete for: ${url} (${appHtml.length} chars)`);

    res
      .status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .setHeader(
        "Cache-Control",
        "public, s-maxage=10, stale-while-revalidate=60",
      )
      .end(html);
  } catch (e) {
    console.error("❌ SSR Error:", e.message);
    console.error("Stack:", e.stack);
    console.error("__dirname:", __dirname);
    console.error("process.cwd():", process.cwd());

    // SSR 失敗時嘗試返回純靜態 HTML (CSR fallback)
    try {
      const fallbackCandidates = [
        path.resolve(process.cwd(), "frontend/dist/client/index.html"),
        path.resolve(__dirname, "../frontend/dist/client/index.html"),
        path.resolve(process.cwd(), "index.html"),
      ];

      let fallbackTemplate = null;
      for (const p of fallbackCandidates) {
        if (fs.existsSync(p)) {
          fallbackTemplate = fs.readFileSync(p, "utf-8");
          console.log(`📄 CSR fallback from: ${p}`);
          break;
        }
      }

      if (fallbackTemplate) {
        // 移除開發腳本引用
        fallbackTemplate = fallbackTemplate.replace(
          '<script type="module" src="/src/entry-client.tsx"></script>',
          "",
        );

        res
          .status(200)
          .setHeader("Content-Type", "text/html; charset=utf-8")
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
