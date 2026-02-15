/**
 * CSR 客戶端入口
 * @module entry-client
 */

import React from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";

const container = document.getElementById("root");

// React Router v7 future flags 消除警告
const routerFutureFlags = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
};

if (container) {
  // 檢查是否有實際的 SSR 內容
  // SSR 產生的 HTML 會包含真正的 DOM 節點（非空白），才進行 hydration
  const containerContent = container.innerHTML.trim();
  const hasSSRContent =
    containerContent.length > 0 && container.children.length > 0;

  if (hasSSRContent) {
    // SSR hydration — 使用 onRecoverableError 忽略非關鍵的 hydration mismatch
    hydrateRoot(
      container,
      <React.StrictMode>
        <HelmetProvider>
          <BrowserRouter {...routerFutureFlags}>
            <App />
          </BrowserRouter>
        </HelmetProvider>
      </React.StrictMode>,
      {
        onRecoverableError: (error: unknown) => {
          // 靜默處理 hydration mismatch 錯誤（#418, #423）
          // 這些通常由 auth 狀態差異（SSR=null, CSR=user）造成，屬於預期行為
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
      },
    );
  } else {
    // 純 CSR 模式（開發環境）
    createRoot(container).render(
      <React.StrictMode>
        <HelmetProvider>
          <BrowserRouter {...routerFutureFlags}>
            <App />
          </BrowserRouter>
        </HelmetProvider>
      </React.StrictMode>,
    );
  }
}
