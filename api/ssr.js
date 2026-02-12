/**
 * Vercel Serverless SSR Handler
 * 處理所有前端 SSR 請求
 *
 * @module api/ssr
 * @description
 *   SSR bundle (_ssr_bundle.cjs) 在 build 階段從 frontend/dist/server/entry-server.cjs
 *   複製到 api/ 目錄。這確保 @vercel/nft 從 api/ 解析 require()，
 *   永遠找不到 frontend/node_modules/（~630MB），有效控制函數大小。
 *
 *   _ssr_bundle.cjs 使用 CJS 格式 + noExternal:true，所有 React/GSAP 等依賴
 *   已內嵌到 bundle 中，不需要任何 node_modules。
 */

const fs = require("node:fs");
const path = require("node:path");

/**
 * 載入 SSR entry module（惰性載入，僅執行一次）
 * 使用同目錄下的 _ssr_bundle.cjs，NFT 會追蹤但只在 api/ 上下文解析
 *
 * @returns {{ render: Function }} SSR module
 */
let _cachedModule = null;
function loadSSRModule() {
  if (_cachedModule) return _cachedModule;
  _cachedModule = require("./_ssr_bundle.cjs");
  console.log("✅ Loaded _ssr_bundle.cjs");
  return _cachedModule;
}

module.exports = async function handler(req, res) {
  const url = req.url;

  try {
    console.log(`📥 SSR Request: ${url}`);

    // ===== 1. 尋找 HTML 模板 =====
    const projectRoot = process.cwd();
    const templateCandidates = [
      path.resolve(projectRoot, "frontend/dist/client/index.html"),
      path.resolve(__dirname, "../frontend/dist/client/index.html"),
      path.resolve(projectRoot, "index.html"),
    ];

    let templatePath = null;
    for (const p of templateCandidates) {
      if (fs.existsSync(p)) {
        templatePath = p;
        break;
      }
    }

    if (!templatePath) {
      throw new Error("Cannot find index.html template");
    }

    // ===== 2. 讀取 HTML 模板 =====
    const template = fs.readFileSync(templatePath, "utf-8");

    // ===== 3. 載入 SSR render 函數 =====
    const serverModule = loadSSRModule();
    const render = serverModule.render || serverModule.default?.render;

    if (!render || typeof render !== "function") {
      throw new Error(
        `_ssr_bundle.cjs does not export a 'render' function. Exports: ${Object.keys(serverModule).join(", ")}`,
      );
    }

    // ===== 4. 渲染 HTML =====
    let appHtml = "";
    let headTags = "";

    try {
      const renderResult = render(url);
      appHtml = renderResult.html || "";
      headTags = renderResult.head || "";
    } catch (renderError) {
      console.error("❌ React render error:", renderError.message);
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

    // SSR 失敗時返回純靜態 HTML (CSR fallback)
    try {
      const fallbackCandidates = [
        path.resolve(process.cwd(), "frontend/dist/client/index.html"),
        path.resolve(__dirname, "../frontend/dist/client/index.html"),
      ];

      for (const p of fallbackCandidates) {
        if (fs.existsSync(p)) {
          let fallbackHtml = fs.readFileSync(p, "utf-8");
          fallbackHtml = fallbackHtml.replace(
            '<script type="module" src="/src/entry-client.tsx"></script>',
            "",
          );
          console.log(`📄 CSR fallback from: ${p}`);
          res
            .status(200)
            .setHeader("Content-Type", "text/html; charset=utf-8")
            .setHeader("X-SSR-Fallback", "true")
            .end(fallbackHtml);
          return;
        }
      }
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError.message);
    }

    res.status(500).json({
      error: "SSR Failed",
      message: e.message,
    });
  }
};
