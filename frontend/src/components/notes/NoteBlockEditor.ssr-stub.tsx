/**
 * `NoteBlockEditor` 的 SSR 替身
 * @module components/notes/NoteBlockEditor.ssr-stub
 *
 * SSR 建置用 `inlineDynamicImports: true`（api/ssr.js 需要單一
 * `entry-server.cjs`，見 REPORTS/VERCEL_SSR_SIZE_FIX_*），所以
 * `React.lazy(() => import("./NoteBlockEditor"))` 在伺服器端會被**攤平成靜態
 * import** —— 整包 @blocknote + @mantine + emoji-mart（未壓縮約 3 MB）
 * 會在 `require("entry-server.cjs")` 當下就執行。
 *
 * 那有兩個代價：
 *   1. 體積與冷啟動：全站每一次 SSR 都得先 parse 這 3 MB，即使訪客根本沒去
 *      /notes。CLAUDE.md 記過同類事故（sanitize-html 選 dompurify 時，jsdom
 *      被打進單檔 SSR bundle 後 runtime crash）。
 *   2. 風險：BlockNote 只要有一版開始在 module scope 摸 `document`，掛掉的
 *      不是 /notes 一頁，而是**整站 SSR**。
 *
 * 因此 SSR 建置時由 `vite.config.ts` 的 `ssrStubNoteEditor` plugin 把
 * `./NoteBlockEditor` 換成這支空殼。這不影響行為：`PageEditor` 有 `mounted`
 * gate，伺服器端本來就不會渲染編輯器，只會吐 Suspense fallback。
 */

import type React from "react";
import type { NoteBlockEditorProps } from "./NoteBlockEditor";

const NoteBlockEditorSsrStub: React.FC<NoteBlockEditorProps> = () => null;

export default NoteBlockEditorSsrStub;
