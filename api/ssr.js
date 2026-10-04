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
 * 預抓資料裡的保留鍵（與 frontend/src/ssr/initialData.ts 的 NOT_FOUND_KEY 同值）
 *
 * prefetch 在「該路由的主實體 API 回 HTTP 404」時設定它（逾時/5xx 不會），
 * 本函式據此回 HTTP 404 —— 修正軟 404：舊行為是 200 + 畫面寫「找不到」，
 * Google 會判定為 soft 404 並照樣收錄。
 */
const NOT_FOUND_KEY = "__notFound";
/**
 * 主實體預抓失敗（逾時 / 5xx / 超出預算）的保留鍵（與 initialData.ts 同值）。
 * 這種情況頁面仍會渲染（客戶端 hydrate 後自行抓資料），但 HTML 沒有本文、
 * 沒有 Article/Course JSON-LD —— 絕不能讓這份空殼進邊緣快取。
 */
const PREFETCH_FAILED_KEY = "__prefetchFailed";

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

    // ===== 3.5 軟 404 判定 =====
    // sentinel 只用來決定狀態碼，render / 序列化都不該看到它
    let isNotFound = false;
    if (initialData && initialData[NOT_FOUND_KEY]) {
      isNotFound = true;
      delete initialData[NOT_FOUND_KEY];
      console.log(`🚫 Primary entity 404 for ${url} → responding 404`);
    }

    // ===== 3.6 主實體預抓失敗 → 本次回應不可快取 =====
    let prefetchFailed = false;
    if (initialData && initialData[PREFETCH_FAILED_KEY]) {
      prefetchFailed = true;
      delete initialData[PREFETCH_FAILED_KEY];
      console.warn(`⚠️ Primary prefetch failed for ${url} → serving uncached shell`);
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

    // 404 時額外補 X-Robots-Tag（頁面本身也會輸出 noindex meta；
    // 正常頁不設此標頭，避免與頁面層 noIndex 判斷互相干擾）
    if (isNotFound) res.setHeader("X-Robots-Tag", "noindex");
    if (prefetchFailed) res.setHeader("X-SSR-Prefetch", "failed");

    res
      .status(isNotFound ? 404 : 200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .setHeader("X-Rendered-By", "ssr")
      .setHeader(
        // 2026-09-11 由 60s 拉長到 600s：每次 MISS = 1 次 SSR 冷啟動（載入 10MB
        // bundle ≈ 300ms+ CPU）+ 6 次後端 API 呼叫；60s 在低流量站等於每位訪客
        // 都是 MISS，是 Vercel Fluid Active CPU 額度爆表的主因之一。
        // 代價：後台改內容後，公開訪客最多 10 分鐘看到舊 HTML（hydrate 後
        // 客戶端仍會重抓 API 覆蓋畫面，所以實際只影響首屏與爬蟲看到的版本）。
        // stale-while-revalidate=1 天：過期後先回舊頁、背景重算，訪客不用等。
        // 急需立即生效：Vercel 專案設定 → Purge Cache。
        // 注意：這份 HTML 對所有人一致、不含任何登入者資料，快取多久都不影響登入。
        "Cache-Control",
        // 404 不加 stale-while-revalidate：否則文章剛發布時，先前被爬到的
        // 404 可能被當 stale 再回送最多一天，讓新頁面遲遲進不了索引。
        prefetchFailed
          ? // 空殼：禁止 CDN 與瀏覽器快取，下一個請求（或爬蟲重抓）會拿到完整渲染
            "no-store"
          : isNotFound
            ? "public, s-maxage=600"
            : "public, s-maxage=600, stale-while-revalidate=86400",
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
