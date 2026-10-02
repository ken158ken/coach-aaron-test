/**
 * gsap 動態載入器（模組層單例）
 * @module lib/gsapLoader
 *
 * 為什麼存在：
 *   gsap 打成 `vendor-gsap` 約 114 KB（45 KB gzip），但全站只有 4 個地方用到，
 *   而且**全都在 effect / 滑鼠事件裡**（進場動畫、視差、磁吸、ScrollTrigger）。
 *   以前是靜態 import，於是 `SmoothScroll`（Layout 全站掛載）把它拉成
 *   main chunk 的靜態依賴 → `index.html` 直接 modulepreload，首頁開場就得先
 *   下載 45 KB 才能跑第一幀，PageSpeed 實測 29 KB 根本沒被執行到。
 *
 * 改法：這支檔案**只有 type-only import**（`typeof import("gsap")` 不會產生
 *   runtime require），真正的 `import("gsap")` 都在函式體內 → rollup 判定為
 *   async chunk，`vendor-gsap` 從 modulepreload 清單消失，改成動畫真的要跑時
 *   才抓。vite.config 的 `id.includes("gsap")` 分組規則不用改（它在
 *   `!id.includes("node_modules") return` 之後，碰不到本檔）。
 *
 * ⚠️ 請勿在本檔頂層 `import { gsap } from "gsap"` —— 那會讓整個優化失效。
 * ⚠️ promise 做模組層快取：多個元件同時呼叫只會下載／註冊 plugin 一次。
 */

/** gsap 主體的型別（type-only，無 runtime 依賴） */
export type Gsap = (typeof import("gsap"))["gsap"];
/** ScrollTrigger plugin 的型別 */
export type ScrollTriggerType =
  (typeof import("gsap/ScrollTrigger"))["ScrollTrigger"];
/** `gsap.context()` 的回傳值（cleanup 時 `ctx.revert()` 用） */
export type GsapContext = ReturnType<Gsap["context"]>;

let gsapPromise: Promise<Gsap> | null = null;

/**
 * 載入 gsap 主體（單例快取）。
 * @returns gsap 實例
 */
export const loadGsap = (): Promise<Gsap> => {
  if (!gsapPromise) {
    gsapPromise = import("gsap").then((m) => m.gsap);
  }
  return gsapPromise;
};

let scrollTriggerPromise: Promise<{
  gsap: Gsap;
  ScrollTrigger: ScrollTriggerType;
}> | null = null;

/**
 * 載入 gsap + ScrollTrigger 並完成 registerPlugin（單例快取，只註冊一次）。
 * @returns gsap 與 ScrollTrigger
 */
export const loadScrollTrigger = (): Promise<{
  gsap: Gsap;
  ScrollTrigger: ScrollTriggerType;
}> => {
  if (!scrollTriggerPromise) {
    scrollTriggerPromise = Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]).then(([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      // 兩個 loader 共用同一份快取，避免之後 loadGsap() 又多一次 import
      if (!gsapPromise) gsapPromise = Promise.resolve(gsap);
      return { gsap, ScrollTrigger };
    });
  }
  return scrollTriggerPromise;
};
