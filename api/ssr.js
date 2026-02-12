/**
 * Vercel Serverless SSR Handler
 * 處理所有前端 SSR 請求
 *
 * @module api/ssr
 * @description
 *   在 Vercel 部署時：
 *   - __dirname = /var/task/api
 *   - process.cwd() = /var/task
 *   - includeFiles 將 entry-server.cjs 和 index.html 複製到函數可存取的路徑
 *   - outputDirectory (frontend/dist/client) 的內容會作為靜態檔案供 CDN 分發
 *
 *   SSR bundle 使用 CJS 格式 + noExternal:true，所有依賴已內嵌到 entry-server.cjs，
 *   無需 node_modules，透過 require() 載入以阻斷 @vercel/nft 追蹤。
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

// ===== 預先用 runtime 拼接路徑載入 SSR module =====
// 使用字串拼接阻斷 @vercel/nft 的靜態分析追蹤
// entry-server.cjs 已是完全自包含的 bundle (noExternal: true)，不需要 node_modules
let _serverModule = null;
let _loadError = null;

/**
 * 載入 SSR entry module（惰性載入，僅執行一次）
 *
 * @returns {{ render: Function }} SSR module
 */
function loadServerModule() {
  if (_serverModule) return _serverModule;
  if (_loadError) throw _loadError;

  const projectRoot = process.cwd();
  const candidates = [
    path.resolve(projectRoot, "frontend", "dist", "server", "entry-server.cjs"),
    path.resolve(
      __dirname,
      "..",
      "frontend",
      "dist",
      "server",
      "entry-server.cjs",
    ),
  ];

  const modulePath = findFile(candidates, "entry-server.cjs");
  if (!modulePath) {
    _loadError = new Error("Cannot find entry-server.cjs SSR module");
    console.error("📋 Project root contents:", listDir(projectRoot));
    console.error(
      "📋 Server dist dir:",
      listDir(path.resolve(projectRoot, "frontend/dist/server")),
    );
    throw _loadError;
  }

  try {
    // 使用運行時拼接的變數路徑呼叫 require()
    // @vercel/nft 無法靜態分析此路徑，不會追蹤 entry-server.cjs 的依賴
    const resolvedPath = path["resolve"](modulePath);
    _serverModule = require(resolvedPath);
    console.log(`✅ Loaded entry-server.cjs from: ${resolvedPath}`);
    return _serverModule;
  } catch (err) {
    _loadError = err;
    console.error(`❌ Failed to load entry-server.cjs:`, err.message);
    throw err;
  }
}

module.exports = async function handler(req, res) {
  const url = req.url;

  try {
    console.log(`📥 SSR Request: ${url}`);

    // 專案根目錄 (Vercel: /var/task)
    const projectRoot = process.cwd();

    // ===== 1. 尋找 HTML 模板 =====
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

    // ===== 2. 讀取 HTML 模板 =====
    const template = fs.readFileSync(templatePath, "utf-8");

    // ===== 3. 載入 SSR render 函數 =====
    const serverModule = loadServerModule();
    const render = serverModule.render || serverModule.default?.render;

    if (!render || typeof render !== "function") {
      throw new Error(
        `entry-server.cjs does not export a 'render' function. Exports: ${Object.keys(serverModule).join(", ")}`,
      );
    }

    // ===== 4. 渲染 HTML =====
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
    }

    // ===== 5. 注入 head 標籤和 body 內容 =====
    let html = template;

    if (html.includes("<!--ssr-outlet-->")) {
      html = html.replace("<!--ssr-outlet-->", appHtml);
    } else {
      html = html.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`,
      );
    }

    if (html.includes("<!--ssr-head-->")) {
      html = html.replace("<!--ssr-head-->", headTags);
    }

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
