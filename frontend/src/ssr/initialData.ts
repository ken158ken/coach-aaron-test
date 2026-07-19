/**
 * SSR 初始資料存取層（同構）
 * @module ssr/initialData
 *
 * @description
 * SSR 端：`entry-server.tsx` 在 `renderToString` 前呼叫 `setServerInitialData()`，
 *          頁面元件透過 `getInitialData(key)` 取得預抓資料，
 *          因此 `loading` 初值可為 `false`，`<SEOHead>` 與內文都能在伺服器端輸出。
 *
 * Client 端：`api/ssr.js` / `frontend/server.js` 會把同一份資料序列化成
 *            `window.__INITIAL_DATA__`，hydrate 時 `getInitialData()` 讀到相同內容，
 *            初始 render 樹與伺服器完全一致 → 不會 hydration mismatch。
 *
 * key 一律帶上路由參數（例如 `article:sales-04`），
 * 這樣 client-side 換頁到另一篇文章時不會誤用上一頁的 SSR 資料。
 */

/** 序列化到 window 的全域變數名稱 */
export const INITIAL_DATA_GLOBAL = "__INITIAL_DATA__";

export type InitialDataMap = Record<string, unknown>;

/** 伺服器端暫存（單次 render 期間有效；Vercel 函式為單一請求單執行緒，安全） */
let serverStore: InitialDataMap = {};

/** 設定伺服器端本次 render 的預抓資料 */
export function setServerInitialData(
  data: InitialDataMap | null | undefined,
): void {
  serverStore = data || {};
}

/** 清除伺服器端暫存（render 完成後呼叫，避免跨請求殘留） */
export function clearServerInitialData(): void {
  serverStore = {};
}

/**
 * 取得預抓資料
 *
 * @param key 資料鍵（例如 `article:sales-04`）
 * @returns 資料，或 `undefined`（無預抓 / 預抓失敗）
 */
export function getInitialData<T = unknown>(key: string): T | undefined {
  try {
    if (typeof window !== "undefined") {
      const store = (
        window as unknown as Record<string, InitialDataMap | undefined>
      )[INITIAL_DATA_GLOBAL];
      return store ? (store[key] as T | undefined) : undefined;
    }
    return serverStore[key] as T | undefined;
  } catch {
    return undefined;
  }
}

/** U+2028 / U+2029 — 合法 JSON 字元但會讓行內 script 解析失敗 */
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);
const UNSAFE_RE = new RegExp(`[<>${LS}${PS}]`, "g");
const UNSAFE_MAP: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  [LS]: "\\u2028",
  [PS]: "\\u2029",
};

/**
 * 將初始資料序列化為可安全內嵌於 `<script>` 的字串
 * 逃逸 `<` / `>` 以避免 `</script>` 提前結束標籤（XSS 防護）
 */
export function serializeInitialData(data: InitialDataMap): string {
  let json: string;
  try {
    json = JSON.stringify(data ?? {});
  } catch {
    json = "{}";
  }
  const safe = json.replace(UNSAFE_RE, (c) => UNSAFE_MAP[c] || c);
  return `<script>window.${INITIAL_DATA_GLOBAL}=${safe};</script>`;
}
