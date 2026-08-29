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

/**
 * 推導 API 根位址（供 SSR 資料預抓使用）
 *
 * 預設同源（Vercel rewrites 會把 /api/* 導到 api/server），
 * 可用 SSR_API_BASE 覆寫（例如 API 部署在其他網域時）。
 *
 * @param {import('http').IncomingMessage} req
 * @returns {string} 例如 https://coach-aaron-test.vercel.app
 */
function resolveApiBase(req) {
  if (process.env.SSR_API_BASE) return process.env.SSR_API_BASE;
  const host =
    req.headers["x-forwarded-host"] ||
    req.headers.host ||
    process.env.VERCEL_URL;
  if (!host) return "";
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
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

    // ===== 3. 路由層資料預抓 =====
    // 失敗只會讓 initialData 為 {}，SSR 仍照常進行（優雅降級）
    let initialData = {};
    const prefetch = serverModule.prefetch || serverModule.default?.prefetch;
    if (typeof prefetch === "function") {
      try {
        // 逾時放寬：後端 API 為另一個 serverless function，冷啟動 + 查詢
        // 實測熱機仍需 ~2s，預設 3.5s/5s 會讓預抓幾乎必定逾時、退回
        // slug 推導的 fallback meta（內頁 SEO 形同未修）。
        // vercel.json 給 api/ssr.js 的 maxDuration 為 10s，此處預留約 2s 給渲染與注入。
        initialData = await prefetch(url, {
          apiBase: resolveApiBase(req),
          timeoutMs: 6000,
          budgetMs: 7500,
        });
        const keys = Object.keys(initialData);
        if (keys.length > 0) {
          console.log(`📦 Prefetched for ${url}: ${keys.join(", ")}`);
        }
      } catch (prefetchError) {
        console.error("⚠️ Prefetch failed (continuing):", prefetchError.message);
        initialData = {};
      }
    }

    // ===== 4. 渲染 HTML =====
    let appHtml = "";
    let headTags = "";
    let initialDataScript = "";

    try {
      const renderResult = render(url, initialData);
      appHtml = renderResult.html || "";
      headTags = renderResult.head || "";
      initialDataScript = renderResult.initialDataScript || "";
    } catch (renderError) {
      console.error("❌ React render error:", renderError.message);
      console.error("Falling back to CSR...");
    }

    // 初始資料 script 必須在 client bundle 執行前出現 → 併入 head 注入點
    if (initialDataScript) {
      headTags = `${headTags}\n${initialDataScript}`;
    }

    // ===== 5. 注入 head 標籤和 body 內容 =====
    // ⚠️ replacement 一律用 function 形式：字串形式會解析 $&、$`、$' 等
    //    替換樣式，文案裡若出現這些字元會把模板炸出重複內容
    let html = template;

    if (html.includes("<!--ssr-outlet-->")) {
      html = html.replace("<!--ssr-outlet-->", () => appHtml);
    } else {
      html = html.replace(
        '<div id="root"></div>',
        () => `<div id="root">${appHtml}</div>`,
      );
    }

    if (html.includes("<!--ssr-head-->")) {
      html = html.replace("<!--ssr-head-->", () => headTags);
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
        // s-maxage 由 10s 拉長到 60s：每次 MISS 都要付一次「SSR 呼叫後端 API」
        // 的成本（實測 2~4s），10s 幾乎等於每個請求都重算。
        // stale-while-revalidate 讓過期後仍先回舊頁再背景更新，使用者不會等。
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=600",
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
