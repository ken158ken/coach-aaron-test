/**
 * SSR 伺服器端入口
 * @module entry-server
 */

import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";

interface RenderResult {
  html: string;
  head: string;
}

/**
 * 伺服器端渲染函數
 *
 * @param {string} url - 請求的 URL
 * @returns {RenderResult} 渲染結果 (包含 body HTML 和 head 標籤)
 */
export function render(url: string): RenderResult {
  // 建立 Helmet context 來收集 head 標籤
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const helmetContext: any = {};

  const html = renderToString(
    <React.StrictMode>
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>
    </React.StrictMode>,
  );

  // 從 helmet context 擷取所有 head 標籤
  const { helmet } = helmetContext;
  const head = helmet
    ? [
        helmet.title?.toString() || "",
        helmet.meta?.toString() || "",
        helmet.link?.toString() || "",
        helmet.script?.toString() || "",
      ].join("\n")
    : "";

  return { html, head };
}
