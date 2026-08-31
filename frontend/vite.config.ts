import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ command, isSsrBuild }) => {
  const isDevServer = command === "serve";

  return {
    plugins: [tailwindcss(), react()],
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
              // 使用 CJS 格式，讓 api/ssr.js 用 require() 載入
              // 避免 ESM dynamic import() 被 @vercel/nft 追蹤依賴
              format: "cjs",
              entryFileNames: "[name].cjs",
              // 所有動態 import 內聯到單一檔案，避免 chunk 依賴追蹤
              inlineDynamicImports: true,
            },
          },
        }
      : {
          // 客戶端構建配置
          outDir: "dist/client",
          // 產出的 .map 約 12 MB，會被部署到 Vercel 並公開完整原始碼。
          // 需要線上除錯時改回 "hidden"（仍產生 map 但不寫入 //# sourceMappingURL）。
          sourcemap: false,
          cssCodeSplit: true,
          chunkSizeWarningLimit: 600,
          rollupOptions: {
            input: {
              main: path.resolve(__dirname, "index.html"),
            },
            output: {
              /**
               * 依套件用途分組。
               *
               * ⚠️ 只能存在於「客戶端」分支：SSR 分支使用 `inlineDynamicImports: true`
               *    （api/ssr.js 需要單一 _ssr_bundle.cjs，見 REPORTS/VERCEL_SSR_SIZE_FIX_*），
               *    而 manualChunks 與 inlineDynamicImports 互斥，同時設定會直接建置失敗。
               *    現有的 isSsrBuild 三元分岔天然隔離了兩者，請維持這個結構。
               *
               * React.lazy 決定「何時載入」，manualChunks 決定「怎麼分組與快取」。
               * 兩者要一起做：只切 lazy 不分組，vendor 會被重複打進多個 chunk。
               */
              manualChunks(id: string) {
                if (!id.includes("node_modules")) return;

                // React 核心：版本最穩定，快取命中率最高
                if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id))
                  return "vendor-react";
                if (id.includes("react-router") || id.includes("@remix-run"))
                  return "vendor-router";

                // 富文本編輯器：純後台，必須與前台隔離
                if (
                  id.includes("@tiptap") ||
                  id.includes("prosemirror") ||
                  id.includes("lowlight") ||
                  id.includes("highlight.js") ||
                  id.includes("linkifyjs")
                )
                  return "vendor-editor";

                // 頭像產生器：只有 AvatarPicker（MemberCenter）用得到
                if (
                  id.includes("@dicebear") ||
                  id.includes("boring-avatars") ||
                  id.includes("react-easy-crop")
                )
                  return "vendor-avatar";

                // 聊天室 realtime
                if (id.includes("@supabase")) return "vendor-supabase";

                // 日期處理
                if (id.includes("react-day-picker") || id.includes("date-fns"))
                  return "vendor-date";

                // 動畫：首屏會用，但體積大，獨立以利長期快取
                if (id.includes("framer-motion") || id.includes("motion-dom"))
                  return "vendor-motion";
                if (id.includes("gsap")) return "vendor-gsap";

                // 圖示
                if (id.includes("react-icons")) return "vendor-icons";

                /*
                 * 新手教學引導（driver.js）：只有使用者在後台／會員頁按下「?」
                 * 才會被 `tours/useTour.ts` 動態 import 進來。
                 * 不獨立成一塊的話會落進 vendor-misc —— 而 vendor-misc 是
                 * index.html 直接 preload 的共用 chunk，等於讓每位前台訪客都
                 * 下載一份用不到的導覽引擎。切開後它就是純 async chunk。
                 */
                if (/[\\/]node_modules[\\/]driver\.js[\\/]/.test(id))
                  return "vendor-tour";

                /*
                 * FullCalendar：只有 /admin/google-calendar 這一頁用得到，
                 * 但約 250 KB。理由同 driver.js —— 落進 vendor-misc 就等於
                 * 讓每位前台訪客 preload 一份完全用不到的日曆引擎。
                 * 切開後只會被 AdminGoogleCalendar 的 async chunk 引用。
                 *
                 * ⚠️ preact 也要一起切：`@fullcalendar/core` 內部是用 preact
                 *    渲染的（`dependencies: { preact }`），它的模組 id 不含
                 *    "@fullcalendar"，漏掉就會有 ~18 KB 掉進 vendor-misc ——
                 *    而 vendor-misc 是 index.html 直接 preload 的共用 chunk。
                 *    全站只有 FullCalendar 依賴 preact（`npm ls preact` 可驗），
                 *    所以整包歸到這裡是安全的。
                 */
                if (
                  id.includes("@fullcalendar") ||
                  /[\\/]node_modules[\\/]preact[\\/]/.test(id)
                )
                  return "vendor-calendar";

                return "vendor-misc";
              },
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
        ? ["gsap", "react-helmet-async"]
        : true,
    },
  };
});
