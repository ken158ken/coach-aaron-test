import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ command, isSsrBuild }) => {
  const isDevServer = command === "serve";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      open: true,
    },
    build: isSsrBuild
      ? {
          // SSR 構建配置
          outDir: "dist/server",
          ssr: true,
          rollupOptions: {
            input: path.resolve(__dirname, "src/entry-server.tsx"),
            output: {
              format: "esm",
              entryFileNames: "[name].js",
              // 所有動態 import 內聯到單一檔案，避免 chunk 依賴追蹤
              inlineDynamicImports: true,
            },
          },
        }
      : {
          // 客戶端構建配置
          outDir: "dist/client",
          sourcemap: true,
          rollupOptions: {
            input: {
              main: path.resolve(__dirname, "index.html"),
            },
          },
        },
    ssr: {
      /**
       * SSR 執行時配置
       *
       * Dev 模式 (serve): 僅打包 ESM-only 套件，其他保持 external
       *   → React CJS 模組需要 external 才能正常運作
       *
       * Build 模式 (build): noExternal: true 打包所有套件
       *   → entry-server.js 自包含，不需要 node_modules
       *   → Vercel 函式不追蹤依賴，大幅縮減大小
       */
      noExternal: isDevServer
        ? ["react-icons", "gsap", "react-helmet-async"]
        : true,
    },
  };
});
