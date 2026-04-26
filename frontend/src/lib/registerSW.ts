/**
 * Service Worker 註冊
 * @module lib/registerSW
 *
 * 在 entry-client bootstrap 結束後呼叫一次。
 * 偵測到新 SW 待 activate 時，會自動 postMessage SKIP_WAITING + reload，
 * 確保用戶下次重整就拿到新版（避免老 SW 卡住）。
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

    // controller 換人 → reload 讓新 SW 正式接管
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  };

  if ("requestIdleCallback" in window) {
    (window as Window & {
      requestIdleCallback: (cb: () => void) => void;
    }).requestIdleCallback(register);
  } else {
    setTimeout(register, 1000);
  }
}
