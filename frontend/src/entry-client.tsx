/**
 * CSR 客戶端入口
 * @module entry-client
 */

import React from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { initAuth } from "./lib/auth-init";
import { registerServiceWorker } from "./lib/registerSW";
import "./index.css";

// React Router v7 future flags 消除警告
const routerFutureFlags = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
};

const appElement = (
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter {...routerFutureFlags}>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

/**
 * bootstrap — 渲染前先完成 auth 預載，再交給 React
 *
 * 流程：
 *   1. SSR 內容已直接可見（無載入遮罩，不阻擋首屏繪製）
 *   2. await initAuth() → 呼叫 /api/auth/me，結果存入 auth-init 模組變數
 *   3. hydrateRoot / createRoot — React 用已知 auth 狀態直接渲染正確畫面
 */
async function bootstrap() {
  // 渲染前先跑完 auth 預載（OAuth 回呼頁面也會快速完成）
  await initAuth();

  const container = document.getElementById("root");
  if (!container) return;

  // 是否有 SSR 產生的真實 DOM 節點
  const hasSSRContent =
    container.innerHTML.trim().length > 0 && container.children.length > 0;

  if (hasSSRContent) {
    // SSR hydration — hydration mismatch 降級為 warn（不靜默：mismatch 代表
    // 某元件 server / client 首次 render 不一致，會造成整棵樹 client 重建，必須看得到）
    hydrateRoot(container, appElement, {
      onRecoverableError: (error: unknown) => {
        if (
          error instanceof Error &&
          (error.message.includes("#418") ||
            error.message.includes("#423") ||
            error.message.includes("Hydration"))
        ) {
          console.warn("[hydration mismatch]", error.message);
          return;
        }
        console.error("React recoverable error:", error);
      },
    });
  } else {
    // 純 CSR 模式（開發環境）
    createRoot(container).render(appElement);
  }
}

// Vite 動態 import 失敗（多半是新部署後舊 hash chunk 已不存在）→ 重整一次拿新版。
// 這是移除 SW controllerchange 自動 reload 後，唯一需要 reload 的情境；
// 以 sessionStorage 防呆避免無限重整循環（bootstrap 成功後即清除，
// 讓下一次真正的部署替換仍可觸發一次 reload）。
const PRELOAD_RELOAD_KEY = "__preload_error_reloaded__";
window.addEventListener("vite:preloadError", (event) => {
  if (sessionStorage.getItem(PRELOAD_RELOAD_KEY)) return; // 重整過仍失敗 → 交給 ErrorBoundary
  sessionStorage.setItem(PRELOAD_RELOAD_KEY, "1");
  event.preventDefault();
  window.location.reload();
});

bootstrap().then(() => {
  sessionStorage.removeItem(PRELOAD_RELOAD_KEY);
});

// PWA service worker — 註冊在 React 渲染後（不擋首次渲染）
registerServiceWorker();
