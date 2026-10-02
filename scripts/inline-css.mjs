/**
 * 建置後處理：把 index.html 內「同步 stylesheet」改成內嵌 <style>
 *
 * 用法：node scripts/inline-css.mjs frontend/dist/client/index.html
 *
 * 為什麼：
 *   公開頁是 SSR，首屏只需要 CSS；PSI 行動版「會阻斷算繪的要求」主要就是
 *   /assets/main-*.css（42KB gzip，慢速 4G 約 770ms）。內嵌後省掉一次往返與
 *   一個 render-blocking 請求。代價是 HTML 變大（gzip 後約 +45KB），但 SPA
 *   路由切換不會重抓 HTML，CSS 跨頁快取在這個站幾乎沒有價值。
 *
 * 範圍：只處理 href 以 /assets/ 開頭、檔案存在於 outputDir 的 <link rel="stylesheet">；
 *   其他 link（字型 preload、manifest…）不動。CSS 檔本身保留（lazy chunk 仍可能引用）。
 *
 * 注意：這份 index.html 之後會被 vercel-build.sh 複製成 SSR 模板與 app-shell，
 *   所以內嵌必須在那一步之前執行。CSS 內含 </style> 的機率為零，但仍防禦性逸出。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error("usage: node scripts/inline-css.mjs <dist/client/index.html>");
  process.exit(1);
}
const outDir = dirname(htmlPath);
let html = readFileSync(htmlPath, "utf-8");
let inlined = 0;
let bytes = 0;

html = html.replace(
  /<link\s+rel="stylesheet"([^>]*?)href="(\/assets\/[^"]+\.css)"([^>]*)>/g,
  (tag, _pre, href, _post) => {
    const file = join(outDir, href);
    if (!existsSync(file)) return tag;
    const css = readFileSync(file, "utf-8").replace(/<\/style/gi, "<\\/style");
    inlined += 1;
    bytes += css.length;
    return `<style data-inlined="${href}">${css}</style>`;
  },
);

writeFileSync(htmlPath, html);
console.log(`inline-css: ${inlined} stylesheet(s) inlined, ${bytes} bytes → ${htmlPath}`);
if (inlined === 0) {
  console.warn("inline-css: ⚠️ 沒有任何 stylesheet 被內嵌，請檢查 index.html 的 link 格式");
}
