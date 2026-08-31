import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

/**
 * SSR 建置時把 BlockNote 編輯器換成空殼。
 *
 * SSR 分支用 `inlineDynamicImports: true`，會把
 * `React.lazy(() => import("./NoteBlockEditor"))` 攤平成靜態 import ——
 * 於是 @blocknote + @mantine + emoji-mart（未壓縮約 3 MB）會在
 * `require("entry-server.cjs")` 當下就執行，即使訪客根本沒去 /notes。
 * 除了體積與冷啟動，更麻煩的是風險面：BlockNote 只要有一版開始在
 * module scope 摸 `document`，掛掉的就是**整站 SSR** 而不只是筆記本頁。
 *
 * 換成空殼不影響行為 —— `PageEditor` 有 `mounted` gate，伺服器端本來就
 * 只會吐 Suspense fallback，編輯器一律等到瀏覽器 hydrate 後才載入。
 *
 * ⚠️ 只在 SSR 建置掛這顆 plugin；client 建置必須拿到真的編輯器。
 */
function ssrStubNoteEditor(rootDir: string): Plugin {
  const stub = path.resolve(
    rootDir,
    "src/components/notes/NoteBlockEditor.ssr-stub.tsx",
  );
  return {
    name: "ssr-stub-note-editor",
    enforce: "pre",
    resolveId(source, importer) {
      if (
        source === "./NoteBlockEditor" &&
        importer &&
        importer.includes(`components${path.sep}notes${path.sep}`)
      ) {
        return stub;
      }
      return null;
    },
  };
}

export default defineConfig(({ command, isSsrBuild }) => {
  const isDevServer = command === "serve";

  return {
    plugins: [
      tailwindcss(),
      react(),
      ...(isSsrBuild ? [ssrStubNoteEditor(__dirname)] : []),
    ],
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
                /*
                 * Vite 的執行期 helper（虛擬模組，id 開頭是 \0，不含
                 * node_modules）—— 必須明確釘在共用 chunk。
                 *
                 * ⚠️ 這條看似多餘，其實是踩過的坑：不釘的話它由 rollup 的
                 *    預設分組決定落點，而落點會隨「有幾個 manual chunk」浮動。
                 *    加入 vendor-notes 之後，`preload-helper` 就被丟進
                 *    vendor-notes —— 而 main 需要這顆 helper，於是 main 變成
                 *    **靜態** import vendor-notes，index.html 直接 preload 了
                 *    整包 BlockNote（500 KB）給每一位前台訪客，連帶把
                 *    vendor-editor 也拖成首屏 preload。釘死在 vendor-misc
                 *    （本來就是 preload 的共用 chunk）才不會再飄。
                 */
                if (id.includes("vite/preload-helper") ||
                    id.includes("vite/modulepreload-polyfill"))
                  return "vendor-misc";

                if (!id.includes("node_modules")) return;

                // React 核心：版本最穩定，快取命中率最高
                if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id))
                  return "vendor-react";
                if (id.includes("react-router") || id.includes("@remix-run"))
                  return "vendor-router";

                /*
                 * 客戶筆記本編輯器（BlockNote + Mantine）：只有 /admin/notes
                 * 與 /notes 用得到，約 1 MB，由 PageEditor 的 React.lazy
                 * 動態載入 → 純 async chunk，前台訪客不會下載。
                 *
                 * ⚠️ 這條**必須排在下面 `@tiptap` 那條之前**：
                 *    @blocknote/core 依賴 @tiptap/core ^3.29，npm 有可能把它
                 *    巢狀裝在 `node_modules/@blocknote/core/node_modules/@tiptap/…`
                 *    ——那種模組 id 同時含 "@blocknote" 與 "@tiptap"。順序反過來
                 *    的話整包 BlockNote 會被吸進 vendor-editor（後台富文本用的
                 *    chunk），把它從 ~660 KB 撐成 1.6 MB，而且會被 AdminCourses /
                 *    ArticleEditor 這些頁面一起拉下來。
                 *
                 * ⚠️ @mantine/* 也要一起切：`@blocknote/mantine` 把 Mantine 列為
                 *    peerDependency（模組 id 不含 "@blocknote"），漏掉的話約
                 *    400 KB 會掉進 vendor-misc —— 那是 index.html 直接 preload
                 *    的共用 chunk。全站只有 BlockNote 依賴 Mantine
                 *    （`npm ls @mantine/core` 可驗）。
                 *
                 * ⚠️ 下面那串「間接相依」同理，而且是實測抓出來的：只切兩個
                 *    scope 的話，emoji-mart 的表情資料（約 500 KB！）等
                 *    傳遞相依會落進 vendor-misc，等於每位前台訪客都下載一份
                 *    emoji 資料庫。名單全部用 `npm ls <pkg>` 驗過「只有
                 *    @blocknote/* 或 @mantine/* 依賴它」——
                 *    刻意排除 use-sync-external-store / fast-equals /
                 *    orderedmap / w3c-keyname 等，那些 @tiptap 也在用，
                 *    移走會把後台富文本編輯器的相依也一起拖進來。
                 *    日後升級 BlockNote 若又長出新的傳遞相依，用
                 *    `vite.config` 同款分析（比對 vendor-misc 大小）再補。
                 */
                if (
                  id.includes("@blocknote") ||
                  id.includes("@mantine") ||
                  /[\\/]node_modules[\\/](@emoji-mart[\\/]data|emoji-mart|lib0|fast-deep-equal|tabbable|clsx|@floating-ui[\\/]react|@floating-ui[\\/]react-dom|react-remove-scroll|react-remove-scroll-bar|react-style-singleton|use-sidecar|use-callback-ref|get-nonce|detect-node-es|react-number-format|react-textarea-autosize|use-latest|use-composed-ref|use-isomorphic-layout-effect)[\\/]/.test(
                    id,
                  )
                )
                  return "vendor-notes";

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
