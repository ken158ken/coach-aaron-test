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
 *   1. #app-loader 遮罩蓋住畫面（HTML 內置）
 *   2. await initAuth() → 呼叫 /api/auth/me，結果存入 auth-init 模組變數
 *   3. hydrateRoot / createRoot — React 用已知 auth 狀態直接渲染正確畫面
 *   4. App 掛載後 useEffect 移除 #app-loader（淡出 0.35s）
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
    // SSR hydration — onRecoverableError 靜默 auth 狀態差異造成的 hydration mismatch
    hydrateRoot(container, appElement, {
      onRecoverableError: (error: unknown) => {
        if (
          error instanceof Error &&
          (error.message.includes("#418") ||
            error.message.includes("#423") ||
            error.message.includes("Hydration"))
        ) {
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

bootstrap();
