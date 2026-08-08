/**
 * SSR 資料預抓（僅在伺服器端執行）
 * @module ssr/prefetch
 *
 * @description
 * 設計原則：**資料抓取失敗絕不能讓整頁 SSR 掛掉。**
 *   - 每筆請求獨立逾時（AbortController）
 *   - 使用 `Promise.allSettled`，任一筆失敗只是該 key 缺席
 *   - 整個函式包在 try/catch，最壞情況回傳 `{}` → 頁面退回原本的 loading 骨架
 *     （等同修改前的行為，不會比現況更差）
 */

import { getPrefetchSpecs } from "./routeData";
import type { InitialDataMap } from "./initialData";

export interface PrefetchOptions {
  /** API 根位址，例如 `https://example.com` 或 `http://localhost:5000` */
  apiBase: string;
  /** 單筆請求逾時（毫秒），預設 3500 */
  timeoutMs?: number;
  /** 整批預抓的總預算（毫秒），預設 5000 */
  budgetMs?: number;
}

const DEFAULT_TIMEOUT_MS = 3500;
const DEFAULT_BUDGET_MS = 5000;

/** 單筆 fetch，逾時或失敗一律回傳 undefined（不 throw） */
async function fetchOne(
  url: string,
  timeoutMs: number,
): Promise<unknown | undefined> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "coach-aaron-ssr/1.0",
      },
    });
    if (!res.ok) return undefined;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) return undefined;
    return await res.json();
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/** 總預算保護：超過 budgetMs 就放棄剩餘結果 */
function withBudget<T>(promise: Promise<T>, budgetMs: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), budgetMs);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

/**
 * 依 URL 預抓該路由所需資料
 *
 * @param url 請求 URL
 * @param options 預抓選項
 * @returns `{ key: data }`；無需預抓或全部失敗時為 `{}`
 */
export async function prefetchRouteData(
  url: string,
  options: PrefetchOptions,
): Promise<InitialDataMap> {
  try {
    const specs = getPrefetchSpecs(url);
    if (specs.length === 0) return {};

    const apiBase = (options.apiBase || "").replace(/\/+$/, "");
    if (!apiBase) return {};

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS;

    const work = Promise.allSettled(
      specs.map(async (spec) => ({
        key: spec.key,
        // spec 可自帶較短逾時（例如首頁的次要區塊），避免拖長整頁 TTFB
        value: await fetchOne(`${apiBase}${spec.path}`, spec.timeoutMs ?? timeoutMs),
      })),
    );

    const settled = await withBudget(work, budgetMs, []);

    const result: InitialDataMap = {};
    for (const item of settled) {
      if (item.status === "fulfilled" && item.value.value !== undefined) {
        result[item.value.key] = item.value.value;
      }
    }
    return result;
  } catch (err) {
    console.error(
      "[ssr/prefetch] 預抓失敗，降級為客戶端渲染：",
      (err as Error)?.message,
    );
    return {};
  }
}
