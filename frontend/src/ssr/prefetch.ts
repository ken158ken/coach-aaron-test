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
import { NOT_FOUND_KEY, PREFETCH_FAILED_KEY, type InitialDataMap } from "./initialData";

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

/**
 * 單筆 fetch 的結果
 *   - ok       ：成功取得 JSON
 *   - notFound ：API 明確回 HTTP 404（實體不存在）
 *   - fail     ：逾時 / 網路錯誤 / 5xx / 非 JSON ——「不確定」，一律當暫時性故障
 */
type FetchOutcome =
  | { kind: "ok"; value: unknown }
  | { kind: "notFound" }
  | { kind: "fail" };

/** 單筆 fetch，絕不 throw；只有 HTTP 404 會回報 notFound */
async function fetchOne(
  url: string,
  timeoutMs: number,
): Promise<FetchOutcome> {
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
    // 404 = 實體確定不存在（軟 404 修正的唯一依據）；其餘非 2xx 視為暫時性故障
    if (res.status === 404) return { kind: "notFound" };
    if (!res.ok) return { kind: "fail" };
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) return { kind: "fail" };
    return { kind: "ok", value: await res.json() };
  } catch {
    return { kind: "fail" };
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
        primary: spec.primary === true,
        // spec 可自帶較短逾時（例如首頁的次要區塊），避免拖長整頁 TTFB
        outcome: await fetchOne(
          `${apiBase}${spec.path}`,
          spec.timeoutMs ?? timeoutMs,
        ),
      })),
    );

    const settled = await withBudget(work, budgetMs, []);

    const result: InitialDataMap = {};
    let primaryNotFound = false;
    let primaryOk = false;
    for (const item of settled) {
      if (item.status !== "fulfilled") continue;
      const { key, primary, outcome } = item.value;
      if (outcome.kind === "ok") {
        result[key] = outcome.value;
        if (primary) primaryOk = true;
      } else if (outcome.kind === "notFound" && primary) {
        // 只有「主實體」的 404 才算整頁不存在；列表類次要資料 404 不算
        primaryNotFound = true;
      }
    }
    // sentinel：api/ssr.js 讀到就回 HTTP 404（頁面仍照常渲染「找不到」＋noindex）。
    // serializeInitialData 會把它濾掉，不會外洩到 window.__INITIAL_DATA__。
    if (primaryNotFound) result[NOT_FOUND_KEY] = true;
    // 主實體既非 ok 也非 404（逾時 / 5xx / 超出 budget 整批被放棄）→ 標記預抓失敗，
    // api/ssr.js 會讓這次「空殼」回應不可快取，下一個請求重新渲染。
    const hasPrimary = specs.some((spec) => spec.primary === true);
    if (hasPrimary && !primaryOk && !primaryNotFound) {
      result[PREFETCH_FAILED_KEY] = true;
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
