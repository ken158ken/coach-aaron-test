/**
 * usePageviewBeacon — 公開頁瀏覽量 beacon
 *
 * 目的：用最低成本（不建 serverless function 連線池、不設 cookie、不送個資）
 * 記錄「公開頁被看了幾次、從哪來」。送到 `POST /api/track/pageview`，
 * body `{ path, referrer, lang }`，後端回 204。
 *
 * 設計取捨：
 *   - `navigator.sendBeacon` 優先：浏覽器在背景排程送出，不卡 render、
 *     也不會因為使用者立刻關頁／切頁而被取消。不支援時退回
 *     `fetch(..., { keepalive: true })`。
 *   - **同源相對路徑** `/api/track/pageview`：services/api.ts 的 getBaseURL()
 *     在 production 一律回空字串走 Vercel rewrites，所以這裡直接寫相對路徑
 *     即可，不需要（也不應該）把 VITE_API_URL 烤進 beacon —— 2026-09-01
 *     換網域事故就是 bundle 裡烤死舊網域造成的。
 *   - 同一個 pathname 在同一個 tab（同一份 JS 模組實例）只送一次，避免
 *     來回切頁把數字灌水；模組層 Set 會隨著 reload 自然清空。
 *   - `document.referrer` 只在「進站的第一發」送（那才是真的外部來源）。
 *     之後 SPA 切頁的 referrer 會是站內自己的頁，沒有意義，送空字串。
 *   - 自動化流量（Playwright / Lighthouse / prerender）一律不送，
 *     避免我們自己的 E2E 把統計灌爛。
 *   - 只送公開頁；登入後專屬路由（/admin、/member…）完全不送，
 *     這些路徑在 vercel.json 已 rewrite 成靜態 app-shell，不該產生流量紀錄。
 *
 * @module hooks/usePageviewBeacon
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** 需要登入才看得到的路由前綴 —— 不做瀏覽統計 */
const PRIVATE_PREFIXES = [
  "/admin",
  "/member",
  "/dashboard",
  "/notes",
  "/chat",
  "/booking",
  "/my-bookings",
  "/coach",
  "/notifications",
  "/checkout",
  "/login",
  "/register",
];

/** 本 tab 已送過的 pathname（模組層 → reload 自然重置） */
const sentPaths = new Set<string>();

/** 是否已送出「進站第一發」（決定還要不要帶 document.referrer） */
let firstBeaconSent = false;

/** 私有路由（含 /admin、/admin/、/admin/xxx，但不含 /administrators） */
function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** 自動化／預渲染流量偵測 —— 任何一項命中就不送 */
function isAutomated(): boolean {
  const nav = navigator as Navigator & { webdriver?: boolean };
  if (nav.webdriver === true) return true;
  // Chrome 的 prerender / Lighthouse 預載：document.prerendering 或舊式 visibilityState
  const doc = document as Document & { prerendering?: boolean };
  if (doc.prerendering === true) return true;
  if ((document.visibilityState as string) === "prerender") return true;
  return false;
}

function sendPageview(pathname: string): void {
  const body = JSON.stringify({
    path: pathname,
    // 只有進站第一發的 referrer 是真的外部來源
    referrer: firstBeaconSent ? "" : document.referrer || "",
    lang: document.documentElement.lang || "",
  });

  const url = "/api/track/pageview";

  try {
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      // sendBeacon 回 false = 瀏覽器拒絕排程（通常是 payload 太大），退回 fetch
      if (navigator.sendBeacon(url, blob)) return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      // 不需要 cookie；統計不綁身分
      credentials: "omit",
    }).catch(() => {
      /* 統計失敗不影響使用者，安靜吞掉 */
    });
  } catch {
    /* 統計永遠不該讓頁面壞掉 */
  }
}

/**
 * 掛在公開/會員共用 Layout 與獨立的 LP 檢視頁各一次。
 * SSR 期不執行（整個 effect 只在 client 跑）。
 */
export function usePageviewBeacon(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      if (typeof window === "undefined" || typeof document === "undefined") return;
      if (isAutomated()) return;
      if (isPrivatePath(pathname)) return;
      if (sentPaths.has(pathname)) return;

      sentPaths.add(pathname);
      sendPageview(pathname);
      firstBeaconSent = true;
    } catch {
      /* 同上：絕不往外丟錯 */
    }
  }, [pathname]);
}

export default usePageviewBeacon;
