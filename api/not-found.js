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
  /* 品牌 mark 墊淺色底片（同 app icon 處理）：酒紅直接放在 #0b0b0d 上對比僅約 1.75:1 */
  .brand {
    width: 72px; height: 72px; margin: 0 auto 20px;
    display: flex; align-items: center; justify-content: center;
    background: #f6f4f0; border-radius: 16px;
  }
  .brand svg { width: 56px; height: 56px; display: block; }
</style>
</head>
<body>
  <main>
    <!--
      品牌 mark：本頁刻意不載入任何外部資源（連 /favicon.svg 都不引用），
      因此 path 直接內嵌。原始資產的 path 為 30KB，這裡是用 Douglas-Peucker
      以 1.0 單位（viewBox 660 的 0.15%）簡化後的版本，約 3.7KB，
      在本頁的 56px 呈現尺寸下與原圖無法分辨。
      要重新產生請以 public/logo/logo-mark.svg 為來源。
    -->
    <div class="brand" aria-hidden="true">
      <svg viewBox="164 29 660 660" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <path fill="#771f1e" fill-rule="evenodd" d="M513,63L505,67L500,72L497,77L496,84L493,87L421,108L414,103L404,104L398,112L398,119L401,124L365,193L364,194L359,192L352,192L342,196L334,205L332,211L332,222L337,232L347,239L354,240L356,246L362,333L355,336L349,342L346,349L346,360L349,366L359,374L372,375L376,373L379,376L424,444L422,451L424,458L432,464L438,464L442,462L447,456L531,453L533,461L536,466L544,473L553,476L566,474L576,466L580,457L580,445L578,441L580,438L633,407L642,412L652,412L657,410L665,401L667,389L754,341L763,349L772,352L778,352L787,349L793,344L797,338L799,324L795,314L789,308L780,304L770,304L768,301L742,224L749,210L748,199L741,190L735,187L727,187L725,185L690,116L692,111L692,105L687,98L678,97L671,102L666,102L545,86L543,78L537,69L526,63ZM479,373L538,435L531,446L448,450L444,441L473,384ZM482,365L497,336L499,334L504,334L535,382L536,385L534,388L534,396L538,402L546,405L551,404L558,397L628,398L630,402L575,434L561,427L551,427L543,431L482,366ZM463,332L491,334L478,361L458,340L461,334ZM751,325L752,335L750,337L664,383L659,377L678,318L685,317L691,313L695,308L698,308L749,323ZM671,318L655,373L645,373L635,377L630,383L627,390L560,390L553,381L548,379L542,380L516,340L514,336L515,335L551,337L556,345L560,347L568,347L573,344L578,333L659,308L666,314ZM464,255L497,267L504,271L503,273L505,283L513,293L501,315L463,256ZM505,323L519,296L525,298L535,297L543,293L548,288L552,279L551,263L568,253L658,294L657,303L577,327L574,327L567,322L561,322L555,325L551,331L509,329ZM443,248L451,251L454,254L497,323L494,327L463,326L459,317L452,311L446,309L436,310L426,318L423,327L426,339L432,345L439,348L446,348L453,345L475,367L439,437L437,439L430,440L426,436L382,370L388,359L388,349L385,342L381,338L441,248ZM727,226L736,227L763,306L757,311L752,318L700,303L697,301L696,292L693,287L725,229ZM380,225L430,243L435,246L375,334L369,333L367,326L361,241L370,236L379,225ZM488,219L490,218L560,250L547,258L539,251L533,249L523,249L513,254L491,223ZM468,208L476,212L509,258L505,263L503,263L457,247L455,245L450,235L465,212ZM421,188L455,202L461,206L446,229L444,228L420,189ZM613,203L609,209L608,223L567,246L478,206L472,198L478,190L491,191L497,188L504,179L506,169L567,149L572,152L577,152L581,156L613,201ZM586,146L710,201L709,208L711,215L720,225L692,277L688,282L680,279L675,279L667,282L662,287L660,287L576,249L578,246L611,227L623,235L636,234L644,228L648,219L648,212L644,203L634,196L619,197L584,148ZM406,128L415,127L417,129L466,198L464,199L426,182L424,180L424,173L420,168L416,166L408,166L404,168L400,173L400,183L405,189L413,191L416,194L442,235L438,240L381,220L378,206L371,196L400,139ZM420,124L422,121L428,121L561,140L563,142L562,146L507,164L504,164L496,155L491,153L480,153L474,156L468,163L466,170L468,181L474,188L470,192L425,130ZM592,143L669,117L678,121L683,120L719,189L712,196L593,144ZM538,103L541,100L543,94L546,93L661,108L668,110L588,137L585,131L579,127L571,127L568,129L566,128L538,104ZM425,114L495,93L500,102L508,109L513,111L526,111L533,108L557,128L562,133L560,134L426,115ZM359,79L328,96L307,112L281,139L269,156L256,180L247,204L240,238L239,310L191,412L189,418L189,427L193,437L201,445L205,447L239,449L239,575L241,583L245,590L252,597L263,602L325,603L347,605L352,609L355,614L355,652L357,658L362,662L625,662L628,660L631,656L631,648L618,613L612,583L611,556L616,527L620,516L630,497L636,489L666,458L692,423L710,389L713,380L684,396L680,409L669,420L656,425L647,425L637,422L596,446L596,460L591,472L583,481L571,488L556,490L544,487L537,483L527,473L524,467L455,469L449,474L438,478L428,477L419,472L411,461L410,446L371,387L359,387L349,383L338,373L334,366L332,360L332,345L338,332L348,323L343,255L342,247L333,243L324,234L320,227L317,215L318,204L323,192L331,183L341,177L357,174L386,118L385,104L387,98L396,88L405,84L416,84L422,87L426,87L481,71L486,69L488,63L493,57L452,56L433,58L388,68L361,79Z"/>
      </svg>
    </div>
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
