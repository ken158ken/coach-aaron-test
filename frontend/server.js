/**
 * SSR 開發/生產伺服器
 * @module server
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

/** SSR 資料預抓的 API 根位址（本機開發預設指向 Express 後端） */
const API_BASE = process.env.SSR_API_BASE || "http://localhost:5000";

async function createServer() {
  const app = express();

  let vite;
  if (!isProduction) {
    // Development mode - use Vite dev server as middleware
    const { createServer } = await import("vite");
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode - serve static files
    app.use(
      express.static(path.resolve(__dirname, "dist/client"), { index: false }),
    );
  }

  app.use("/{*splat}", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      let template, render, prefetch;

      if (!isProduction) {
        // Dev: read template and transform with Vite
        template = fs.readFileSync(
          path.resolve(__dirname, "index.html"),
          "utf-8",
        );
        template = await vite.transformIndexHtml(url, template);
        const mod = await vite.ssrLoadModule("/src/entry-server.tsx");
        render = mod.render;
        prefetch = mod.prefetch;
      } else {
        // Prod: use built assets (CJS format for Vercel compatibility)
        template = fs.readFileSync(
          path.resolve(__dirname, "dist/client/index.html"),
          "utf-8",
        );
        const serverModule = await import("./dist/server/entry-server.cjs");
        render = serverModule.render || serverModule.default?.render;
        prefetch = serverModule.prefetch || serverModule.default?.prefetch;
      }

      // ── 路由層資料預抓（失敗時降級為空物件，不中斷 SSR） ──
      let initialData = {};
      if (typeof prefetch === "function") {
        try {
          initialData = await prefetch(url, { apiBase: API_BASE });
        } catch (prefetchError) {
          console.error("⚠️ Prefetch failed (continuing):", prefetchError.message);
          initialData = {};
        }
      }

      const {
        html: appHtml,
        head,
        initialDataScript,
      } = render(url, initialData);

      // 注入 SSR 內容和 head 標籤
      // replacement 用 function 形式，避免文案含 $&、$' 等替換樣式時炸模板
      let html = template.replace("<!--ssr-outlet-->", () => appHtml);

      // head 標籤 + 初始資料 script 一併注入到 <!--ssr-head--> 位置
      const headBlock = [head || "", initialDataScript || ""]
        .filter(Boolean)
        .join("\n");
      if (headBlock) {
        html = html.replace("<!--ssr-head-->", () => headBlock);
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(e);
      }
      console.error(e.stack);
      res.status(500).end(e.stack);
    }
  });

  const port = process.env.PORT || 5173;
  app.listen(port, () => {
    console.log(`SSR Server running at http://localhost:${port}`);
  });
}

createServer();
