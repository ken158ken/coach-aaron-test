/**
 * 真正回傳 HTTP 404 的 catch-all 處理器（修正 soft 404）
 *
 * @module api/not-found
 * @description
 *   問題：`vercel.json` 原本只有一條 catch-all rewrite `/(.*) → /api/ssr`，
 *   而 `api/ssr.js` 一律回傳 200。因此任何不存在的路徑（含 /sitemap.xml）
 *   都會得到「HTTP 200 + 空白 React 骨架」，也就是典型的 soft 404：
 *   Google 會把無限多的不存在 URL 當成有效薄頁面索引，浪費抓取預算。
 *
 *   解法：`vercel.json` 改為「已知路由白名單 → /api/ssr」，其餘 → 本函式，
 *   本函式一律回傳 **HTTP 404**。正常的 SPA 路由完全不受影響，因為它們
 *   都在白名單內；只有真正不存在的路徑才會走到這裡。
 *
 *   渲染策略（向前相容）：
 *   目前 `App.tsx` 沒有定義 `*` catch-all 路由，所以 SSR 對未知路徑會渲染出
 *   空的 app。因此本函式會先嘗試 SSR：
 *     - 若 SSR 產出有意義的內容（代表日後有人在 App.tsx 加了 NotFound 路由），
 *       就使用它，只是把狀態碼改成 404 並補上 noindex。
 *     - 否則回退到一個自帶樣式的極簡 404 頁面（不載入 3.4 MB 的主 bundle）。
 *   如此一來，等 App.tsx 補上 NotFound 路由後，本檔不需要任何修改即會自動升級。
 */

const fs = require("node:fs");
const path = require("node:path");

/** SSR 產出低於此字元數即視為「空骨架」，改用內建 404 頁面 */
const MEANINGFUL_HTML_THRESHOLD = 200;

/**
 * 內建的極簡 404 頁面（不依賴前端 bundle，無 JS，無外部資源）
 *
 * @returns {string} 完整 HTML 文件
 */
function fallbackHtml() {
  return `<!doctype html>
<html lang="zh-TW">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, follow" />
<title>找不到頁面 | 阿倫教官 Coach Aaron</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: #0b0b0d; color: #e8e6e3;
    font-family: system-ui, -apple-system, "Noto Sans TC", "Microsoft JhengHei", sans-serif;
    text-align: center; padding: 24px; line-height: 1.7;
  }
  .code { font-size: clamp(56px, 12vw, 96px); font-weight: 700; letter-spacing: .04em; margin: 0 0 8px; color: #c9a227; }
  h1 { font-size: clamp(20px, 4vw, 26px); font-weight: 600; margin: 0 0 12px; }
  p { margin: 0 0 28px; color: #a09d99; font-size: 15px; }
  a {
    display: inline-block; padding: 12px 28px; border-radius: 999px;
    border: 1px solid #c9a227; color: #c9a227; text-decoration: none;
    font-size: 15px; transition: background .2s, color .2s;
  }
  a:hover { background: #c9a227; color: #0b0b0d; }
</style>
</head>
<body>
  <main>
    <p class="code">404</p>
    <h1>找不到這個頁面</h1>
    <p>這個網址可能已經變更或不存在。</p>
    <a href="/">回到首頁</a>
  </main>
</body>
</html>
`;
}

/**
 * 嘗試以既有 SSR bundle 渲染頁面
 *
 * @param {string} url - 請求路徑
 * @returns {string|null} 完整 HTML；無法產出有意義內容時回傳 null
 */
function trySsr(url) {
  try {
    const templatePath = path.resolve(__dirname, "_ssr_template.html");
    if (!fs.existsSync(templatePath)) return null;

    // 與 api/ssr.js 使用同一份 build artifact
    const serverModule = require("./_ssr_bundle.cjs");
    const render = serverModule.render || serverModule.default?.render;
    if (typeof render !== "function") return null;

    const result = render(url);
    const appHtml = result?.html || "";
    if (appHtml.replace(/<[^>]*>/g, "").trim().length < MEANINGFUL_HTML_THRESHOLD)
      return null;

    let html = fs.readFileSync(templatePath, "utf-8");
    html = html.includes("<!--ssr-outlet-->")
      ? html.replace("<!--ssr-outlet-->", appHtml)
      : html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

    if (html.includes("<!--ssr-head-->")) {
      // 補上 noindex，避免 404 頁面本身被索引
      html = html.replace(
        "<!--ssr-head-->",
        `<meta name="robots" content="noindex, follow" />${result?.head || ""}`,
      );
    }

    return html.replace(
      '<script type="module" src="/src/entry-client.tsx"></script>',
      "",
    );
  } catch (err) {
    console.error("not-found: SSR attempt failed:", err.message);
    return null;
  }
}

module.exports = async function handler(req, res) {
  console.log(`🚫 404: ${req.url}`);

  const html = trySsr(req.url) || fallbackHtml();

  res
    .status(404)
    .setHeader("Content-Type", "text/html; charset=utf-8")
    .setHeader("X-Robots-Tag", "noindex")
    // 404 不做長時間邊緣快取，避免日後新增路由後仍被快取住
    .setHeader("Cache-Control", "public, max-age=0, s-maxage=60")
    .end(html);
};
