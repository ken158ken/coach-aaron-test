/**
 * @fileoverview IndexNow 即時收錄通知（Bing / Yandex / Seznam / Naver 共用協定）
 *
 * 文章／課程發布、更新、下架時主動 ping 搜尋引擎，讓 AI 搜尋與傳統搜尋
 * 更快抓到新內容（AEO 的「被收錄速度」是前置條件）。
 *
 * 設計原則：
 *   - **絕不影響主流程**：任何失敗只 console.warn，不 throw、不改 HTTP 狀態。
 *   - serverless 在回應送出後會立刻凍結 → 真正的 fire-and-forget 會被殺掉，
 *     所以改成「回應前最多等 1.5 秒」（pingIndexNowBounded），逾時就放生。
 *   - key 檔必須放在站台根目錄：`/{key}.txt`（見 frontend/public/）。
 *
 * @module utils/indexNow
 */

/** 預設 IndexNow key（可用 env INDEXNOW_KEY 覆寫；key 檔名必須同值） */
export const DEFAULT_INDEXNOW_KEY = "5e6b152fc507c3cdaadcd8ce73f9c12b";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const HARD_TIMEOUT_MS = 3000;
const RESPONSE_BUDGET_MS = 1500;

/** 站台網址（去尾斜線）：SITE_URL → FRONTEND_URL → 正式站 */
export function getSiteUrl(): string {
  const raw =
    process.env.SITE_URL || process.env.FRONTEND_URL || "https://aaron-coach.com";
  return raw.replace(/\/+$/, "");
}

export function getIndexNowKey(): string {
  return process.env.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY;
}

/** 文章的正式網址（有 slug 用 slug，否則用 id） */
export function articleUrl(slug: unknown, id: unknown): string {
  const seg = typeof slug === "string" && slug.trim() ? slug.trim() : String(id);
  return `${getSiteUrl()}/articles/${seg}`;
}

/** 課程的正式網址 */
export function courseUrl(id: unknown): string {
  return `${getSiteUrl()}/courses/${String(id)}`;
}

export function sitemapUrl(): string {
  return `${getSiteUrl()}/sitemap.xml`;
}

/**
 * 送出 IndexNow 通知。永不 reject。
 *
 * @returns 是否成功送達（false = 跳過或失敗，呼叫端不需理會）
 */
export async function pingIndexNow(urls: string[]): Promise<boolean> {
  try {
    const site = getSiteUrl();
    const host = new URL(site).hostname;

    // 本機 / preview 不要通知搜尋引擎（會被判定 host 不符而失敗）
    if (/localhost|127\.0\.0\.1|\.vercel\.app$/i.test(host)) return false;
    if (process.env.INDEXNOW_DISABLED === "true") return false;

    const urlList = [...new Set(urls.filter((u) => typeof u === "string" && u))];
    if (urlList.length === 0) return false;

    const key = getIndexNowKey();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);

    try {
      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host,
          key,
          keyLocation: `${site}/${key}.txt`,
          urlList,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        console.warn(`[indexnow] ping 失敗 ${res.status}`, urlList.length);
        return false;
      }
      return true;
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.warn("[indexnow] ping 異常（已忽略）", (err as Error)?.message);
    return false;
  }
}

/**
 * 回應前呼叫這支：最多等 `budgetMs`（預設 1.5 秒），逾時就不等了。
 * serverless 回應後會凍結，所以不能真的 fire-and-forget；但也不該讓
 * 後台儲存被第三方 API 拖慢，折衷成有上限的等待。永不 reject。
 */
export async function pingIndexNowBounded(
  urls: string[],
  budgetMs: number = RESPONSE_BUDGET_MS,
): Promise<void> {
  let budgetTimer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      pingIndexNow(urls),
      new Promise<void>((resolve) => {
        budgetTimer = setTimeout(resolve, budgetMs);
      }),
    ]);
  } catch {
    // pingIndexNow 已自行吞錯，這裡只是最後一道保險
  } finally {
    // 回應送出後別留著計時器（serverless 會多算執行時間）
    if (budgetTimer) clearTimeout(budgetTimer);
  }
}
