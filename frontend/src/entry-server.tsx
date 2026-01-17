/**
 * 服務端渲染入口點
 * @module entry-server
 */

import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";

/**
 * 伺服器端渲染函數
 *
 * @param url - 請求的 URL
 * @returns 渲染後的 HTML 字串
 */
export function render(url: string): { html: string } {
  try {
    // Remove query string and hash for routing
    const pathname = url.split("?")[0].split("#")[0];

    console.log(`[SSR] Rendering: ${pathname}`);

    const html = renderToString(
      <StrictMode>
        <StaticRouter
          location={pathname}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <App />
        </StaticRouter>
      </StrictMode>,
    );

    console.log(`[SSR] Success: ${html.length} bytes`);
    return { html };
  } catch (error) {
    console.error("[SSR] Render error:", error);
    // 返回空字串讓客戶端接管
    return { html: "" };
  }
}
