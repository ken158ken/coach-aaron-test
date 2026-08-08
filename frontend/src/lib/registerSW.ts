/**
 * Service Worker 註冊
 * @module lib/registerSW
 *
 * 在 entry-client bootstrap 結束後呼叫一次。
 * 偵測到新 SW 待 activate 時，會自動 postMessage SKIP_WAITING 讓新版
 * 靜默接管（不 reload——見下方 controllerchange 註解）。
 */

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      !window.location.hostname.startsWith("127.")) {
    // SW 只在 https / localhost 下能跑
    return;
  }

  // 用 idle callback 延後註冊，不擋首次渲染
  const register = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // 偵測新版本
        reg.addEventListener("updatefound", () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener("statechange", () => {
            if (
              newSW.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // 已有舊 SW 在跑 → 通知它讓位
              newSW.postMessage("SKIP_WAITING");
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[SW] 註冊失敗", err);
      });

    // ⚠️ 這裡「絕不」監聽 controllerchange 做 window.location.reload()：
    //   sw.js 的 install 會 skipWaiting、activate 會 clients.claim()，
    //   所以「首次造訪」與「每次部署後的第一次造訪」都必然觸發 controllerchange。
    //   舊版在此 reload 造成使用者正在往下閱讀 SSR 內容時整頁重載、被拉回頂部
    //  （首頁 SSR bug 的主因之一）。新 SW 靜默接管即可：
    //   HTML 走 networkFirst、hash 化資源 cache miss 時直接走網路，都不需要 reload。
    //   舊部署 chunk 被清掉的極端情況由 entry-client 的 vite:preloadError 處理。
  };

  if ("requestIdleCallback" in window) {
    (window as Window & {
      requestIdleCallback: (cb: () => void) => void;
    }).requestIdleCallback(register);
  } else {
    setTimeout(register, 1000);
  }
}
