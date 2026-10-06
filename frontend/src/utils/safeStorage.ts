/**
 * 安全的 localStorage / sessionStorage 包裝 — 絕不拋錯
 * @module utils/safeStorage
 *
 * 背景（2026-10-06）：部分環境存取 `window.localStorage` 本身就會拋
 * `SecurityError: Access is denied for this document.`（隱私模式、第三方 iframe、
 * 封鎖站台資料、某些搜尋/預覽渲染器）。只要任何一個 Provider 或元件在 render /
 * effect 期直接呼叫就會炸進 ErrorBoundary，整站變成「頁面載入發生錯誤」——
 * 模擬 Google 渲染器時實測重現。
 *
 * 規則：前台所有 storage 存取一律經由這裡；失敗時 getItem 回 null、set/remove 靜默。
 * SSR 期（無 window）同樣回 null。
 */

type StorageKind = "localStorage" | "sessionStorage";

function getStore(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const store = window[kind];
    return store ?? null;
  } catch {
    return null;
  }
}

function make(kind: StorageKind) {
  return {
    getItem(key: string): string | null {
      try {
        return getStore(kind)?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        getStore(kind)?.setItem(key, value);
      } catch {
        /* 配額滿 / 被拒：靜默 */
      }
    },
    removeItem(key: string): void {
      try {
        getStore(kind)?.removeItem(key);
      } catch {
        /* 靜默 */
      }
    },
  };
}

/** 安全版 localStorage（getItem 失敗回 null） */
export const safeLocal = make("localStorage");
/** 安全版 sessionStorage（getItem 失敗回 null） */
export const safeSession = make("sessionStorage");
