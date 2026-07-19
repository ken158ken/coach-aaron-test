/**
 * SSR 伺服器端入口
 * @module entry-server
 */

import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import {
  setServerInitialData,
  clearServerInitialData,
  serializeInitialData,
  type InitialDataMap,
} from "./ssr/initialData";
import { prefetchRouteData, type PrefetchOptions } from "./ssr/prefetch";

interface RenderResult {
  html: string;
  head: string;
  /** 要內嵌進 HTML 的 `window.__INITIAL_DATA__` script（無資料時為空字串） */
  initialDataScript: string;
}

export { prefetchRouteData };
export type { InitialDataMap, PrefetchOptions };

/**
 * 資料預抓 — 在 render 之前呼叫，取得該路由所需資料
 *
 * 失敗時回傳 `{}`，render 仍會正常進行（退回 loading 骨架），
 * 絕不會讓整頁 SSR 掛掉。
 *
 * @param {string} url - 請求的 URL
 * @param {PrefetchOptions} options - 預抓選項（apiBase / timeoutMs）
 * @returns {Promise<InitialDataMap>} 預抓資料
 */
export async function prefetch(
  url: string,
  options: PrefetchOptions,
): Promise<InitialDataMap> {
  return prefetchRouteData(url, options);
}

/**
 * 伺服器端渲染函數
 * 包含完整的錯誤處理機制，確保 SSR 失敗時不會崩潰整個請求
 *
 * @param {string} url - 請求的 URL
 * @param {InitialDataMap} [initialData] - 預抓資料（由 `prefetch()` 取得，可省略）
 * @returns {RenderResult} 渲染結果 (包含 body HTML、head 標籤與初始資料 script)
 */
export function render(url: string, initialData?: InitialDataMap): RenderResult {
  const data = initialData && typeof initialData === "object" ? initialData : {};
  const hasData = Object.keys(data).length > 0;

  try {
    // 將預抓資料放進伺服器端 store，頁面元件的 useState 初值會讀取它
    setServerInitialData(data);

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

    return {
      html,
      head,
      initialDataScript: hasData ? serializeInitialData(data) : "",
    };
  } catch (error) {
    console.error("❌ [entry-server] SSR render error:", error);
    // 回傳空 HTML 讓客戶端渲染接管
    return { html: "", head: "", initialDataScript: "" };
  } finally {
    // 避免跨請求殘留
    clearServerInitialData();
  }
}
