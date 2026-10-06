/**
 * 爬蟲／渲染器偵測 — 只用來「跳過純視覺動畫」，不改變任何內容
 * @module utils/crawler
 *
 * 背景（2026-10-06 GSC 實測）：Google 的渲染器（WRS）不會捲動、常不觸發
 * IntersectionObserver / 連續的 requestAnimationFrame。AOS 一 init 就把所有
 * `[data-aos]` 區塊設成 opacity:0 等捲動才淡入 → 在 WRS 裡教練介紹、學員評價、
 * 證照等整區永遠透明；GSAP 進場動畫也可能卡在 opacity:0 的第一格。
 * 文字雖仍在 DOM，但 Google 會把「視覺上隱藏」的文字降權，GSC 的渲染截圖也是空白。
 *
 * 對策：已知爬蟲 UA 直接拿「最終靜態狀態」（不跑進場動畫、不換字、不啟用 AOS）。
 * 這不是 cloaking：內容、結構、連結完全相同，只是少了動畫。
 *
 * ⚠️ 刻意不含 Lighthouse（`Chrome-Lighthouse`）：PSI 分數要反映真人體驗。
 */

const CRAWLER_UA =
  /Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|Mediapartners-Google|Google-Extended|bingbot|BingPreview|DuckDuckBot|DuckAssistBot|Applebot|YandexBot|Baiduspider|PetalBot|Bytespider|Amazonbot|CCBot|facebookexternalhit|meta-externalagent|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|WhatsApp|Pinterestbot|GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|anthropic-ai|PerplexityBot|Perplexity-User|cohere-ai|YouBot|SemrushBot|AhrefsBot|MJ12bot/i;

let cached: boolean | null = null;

/** 目前的瀏覽器是否為已知爬蟲／搜尋渲染器（SSR 期一律 false） */
export function isCrawler(): boolean {
  if (cached !== null) return cached;
  if (typeof navigator === "undefined") return false;
  try {
    cached = CRAWLER_UA.test(navigator.userAgent || "");
  } catch {
    cached = false;
  }
  return cached;
}

/**
 * 是否應停用「等捲動才顯示」類的動畫（AOS）。
 * 爬蟲之外，也涵蓋沒有 IntersectionObserver 的環境（極舊瀏覽器／部分渲染器），
 * 這些環境永遠等不到觸發，內容會一直透明。
 */
export function shouldDisableScrollAnimations(): boolean {
  if (typeof window === "undefined") return false;
  return isCrawler() || typeof window.IntersectionObserver === "undefined";
}
