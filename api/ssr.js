/**
 * Vercel Serverless SSR Handler
 * 處理所有前端 SSR 請求
 *
 * @module api/ssr
 * @description
 *   Build 階段將以下檔案複製/移動到 api/ 目錄：
 *   - _ssr_bundle.cjs: SSR 渲染 bundle (CJS, 自包含所有依賴)
 *   - _ssr_template.html: HTML 模板 (從 frontend/dist/client/index.html 移出)
 *
 *   移出 index.html 是因為 Vercel 靜態檔案優先於 rewrites，
 *   若 index.html 留在 outputDirectory 中，會被直接返回而不觸發 SSR。
 */

const fs = require("node:fs");
const path = require("node:path");

/**
 * 載入 SSR entry module（惰性載入，僅執行一次）
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

/**
 * 讀取 HTML 模板（惰性載入，僅執行一次）
 *
 * @returns {string} HTML 模板內容
 */
let _cachedTemplate = null;
function loadTemplate() {
  if (_cachedTemplate) return _cachedTemplate;
  const templatePath = path.resolve(__dirname, "_ssr_template.html");
  _cachedTemplate = fs.readFileSync(templatePath, "utf-8");
  console.log(`✅ Loaded template from: ${templatePath}`);
  return _cachedTemplate;
}

module.exports = async function handler(req, res) {
  const url = req.url;

  try {
    console.log(`📥 SSR Request: ${url}`);

    // ===== 1. 讀取 HTML 模板 =====
    const template = loadTemplate();

    // ===== 2. 載入 SSR render 函數 =====
    const serverModule = loadSSRModule();
    const render = serverModule.render || serverModule.default?.render;

    if (!render || typeof render !== "function") {
      throw new Error(
        `_ssr_bundle.cjs does not export a 'render' function. Exports: ${Object.keys(serverModule).join(", ")}`,
      );
    }

    // ===== 3. 渲染 HTML =====
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

    // ===== 4. 注入 head 標籤和 body 內容 =====
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
      .setHeader("X-Rendered-By", "ssr")
      .setHeader(
        "Cache-Control",
        "public, s-maxage=10, stale-while-revalidate=60",
      )
      .end(html);
  } catch (e) {
    console.error("❌ SSR Error:", e.message);

    // SSR 失敗時返回模板 HTML 作為 CSR fallback
    try {
      const fallbackPath = path.resolve(__dirname, "_ssr_template.html");
      if (fs.existsSync(fallbackPath)) {
        let fallbackHtml = fs.readFileSync(fallbackPath, "utf-8");
        fallbackHtml = fallbackHtml.replace(
          '<script type="module" src="/src/entry-client.tsx"></script>',
          "",
        );
        console.log("📄 CSR fallback served");
        res
          .status(200)
          .setHeader("Content-Type", "text/html; charset=utf-8")
          .setHeader("X-SSR-Fallback", "true")
          .end(fallbackHtml);
        return;
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
