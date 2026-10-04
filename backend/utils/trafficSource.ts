/**
 * @fileoverview referrer → 來源分類（AEO/GEO 成效量測用）
 *
 * 純函式、無相依、可單測。只看 referrer 的 **host**（+ 必要時路徑），
 * 不存 IP / UA / cookie，所以沒有個資問題（見 migration 041 檔頭）。
 *
 * 分類：
 *   ai      — AI 聊天／答案引擎（ChatGPT、Perplexity、Claude、Copilot、Gemini…）
 *   search  — 傳統搜尋引擎
 *   social  — 社群／論壇／短連結
 *   direct  — 無 referrer 或來自本站自己
 *   other   — 其他網站（外部連結、電子報…）
 *
 * @module utils/trafficSource
 */

export type SourceClass = "ai" | "search" | "social" | "direct" | "other";

/** 本站自己的網域（含 preview 部署）→ 站內跳轉算 direct，不算外部來源 */
const OWN_HOST_PATTERNS: RegExp[] = [
  /(^|\.)aaron-coach\.com$/i,
  /(^|\.)vercel\.app$/i,
  /^localhost$/i,
  /^127\.0\.0\.1$/,
];

/** 完整 host 比對（含子網域）：'chatgpt.com' 同時匹配 www.chatgpt.com */
const AI_HOSTS: string[] = [
  "chatgpt.com",
  "chat.openai.com",
  "openai.com",
  "perplexity.ai",
  "claude.ai",
  "copilot.microsoft.com",
  "gemini.google.com",
  "you.com",
];

/**
 * 需要看路徑才算 AI 的來源：
 *   - search.brave.com/answers → Brave 的 AI 答案
 *   - bing.com/chat           → Copilot in Bing
 * 不符路徑時往下落到一般搜尋分類。
 */
const AI_HOST_WITH_PATH: Array<{ host: RegExp; pathPrefix: string }> = [
  { host: /(^|\.)search\.brave\.com$/i, pathPrefix: "/answers" },
  { host: /(^|\.)bing\.[a-z0-9.-]+$/i, pathPrefix: "/chat" },
];

/** 搜尋引擎：base 名稱 + 任意 TLD（google.com / google.com.tw / google.co.jp…） */
const SEARCH_BASES: string[] = [
  "google",
  "bing",
  "yahoo",
  "duckduckgo",
  "baidu",
  "yandex",
  "ecosia",
];

/** Brave 本身是搜尋引擎（非 /answers 路徑時歸 search） */
const SEARCH_HOSTS: string[] = ["search.brave.com", "brave.com"];

/** 社群：base 名稱 + 任意 TLD */
const SOCIAL_BASES: string[] = [
  "instagram",
  "facebook",
  "threads",
  "youtube",
  "linkedin",
  "twitter",
  "dcard",
  "reddit",
];

/** 社群：完整 host（無 TLD 變體） */
const SOCIAL_HOSTS: string[] = [
  "line.me",
  "youtu.be",
  "t.co",
  "x.com",
  "ptt.cc",
  "fb.com",
  "m.me",
];

/** host 等於或結尾為 `.domain` */
function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/** host 是 `base.<任意 TLD>` 或其子網域（www.google.com.tw → true for 'google'） */
function hostMatchesBase(host: string, base: string): boolean {
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\.)${escaped}\\.[a-z0-9.-]+$`, "i").test(host);
}

/**
 * 從 referrer 取出 host（小寫、去 www.）。
 * 取不到（空值 / 非法 URL）回 null —— 呼叫端視為 direct。
 * **只回 host**，刻意丟掉路徑與查詢字串，避免把別人的搜尋關鍵字寫進 DB。
 */
export function referrerHost(referrer: unknown): string | null {
  if (typeof referrer !== "string") return null;
  const raw = referrer.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

/** 從 referrer 取出路徑（僅供 AI_HOST_WITH_PATH 判定，不入庫） */
export function referrerPath(referrer: unknown): string {
  if (typeof referrer !== "string") return "";
  try {
    return new URL(referrer.trim()).pathname || "";
  } catch {
    return "";
  }
}

/** host 是否屬於本站自己 */
export function isOwnHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return OWN_HOST_PATTERNS.some((re) => re.test(host));
}

/**
 * 來源分類主函式。
 *
 * @param host       referrer 的 host（可為 null / 空 → direct）
 * @param path       referrer 的路徑（可省略；只有 brave/bing 需要）
 */
export function classify(
  host: string | null | undefined,
  path?: string | null,
): SourceClass {
  if (!host) return "direct";

  const h = host.toLowerCase().replace(/^www\./, "");
  const p = (path || "").toLowerCase();

  // 本站自己（含 preview 網域）→ direct
  if (isOwnHost(h)) return "direct";

  // 1. AI 答案引擎（要先於 search —— gemini.google.com 也符合 google.*）
  if (AI_HOSTS.some((d) => hostMatches(h, d))) return "ai";
  for (const rule of AI_HOST_WITH_PATH) {
    if (rule.host.test(h) && p.startsWith(rule.pathPrefix)) return "ai";
  }

  // 2. 傳統搜尋
  if (SEARCH_HOSTS.some((d) => hostMatches(h, d))) return "search";
  if (SEARCH_BASES.some((b) => hostMatchesBase(h, b))) return "search";

  // 3. 社群
  if (SOCIAL_HOSTS.some((d) => hostMatches(h, d))) return "social";
  if (SOCIAL_BASES.some((b) => hostMatchesBase(h, b))) return "social";

  return "other";
}

/**
 * 便利包裝：referrer 字串 → { host, sourceClass }。
 * host 為 null 時代表 direct（或本站自己）。
 */
export function classifyReferrer(referrer: unknown): {
  host: string | null;
  sourceClass: SourceClass;
} {
  const host = referrerHost(referrer);
  const sourceClass = classify(host, referrerPath(referrer));
  // 本站自己的 host 不入庫（視同直接進站），避免 byReferrer 被自己洗榜
  return { host: isOwnHost(host) ? null : host, sourceClass };
}
