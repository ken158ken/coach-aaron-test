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
  // 開發模式下 Vite 不會進行 SSR，直接使用 CSR
  // 檢查是否有實際的 SSR 內容（不只是空的 root div）
  const hasSSRContent =
    container.innerHTML.trim() &&
    container.children.length > 0 &&
    !container.innerHTML.includes("<!--$-->");

  if (hasSSRContent) {
    // SSR hydration
    hydrateRoot(
      container,
      <React.StrictMode>
        <HelmetProvider>
          <BrowserRouter {...routerFutureFlags}>
            <App />
          </BrowserRouter>
        </HelmetProvider>
      </React.StrictMode>,
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
