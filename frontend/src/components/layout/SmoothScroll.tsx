import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import AOS from "aos";
import { setLenisInstance } from "@/lib/lenisInstance";
import { loadScrollTrigger } from "@/lib/gsapLoader";
import type { Gsap, ScrollTriggerType } from "@/lib/gsapLoader";

/**
 * SmoothScroll 元件 - 提供全站 Lenis 平滑捲動
 * 整合 GSAP ScrollTrigger + AOS
 *
 * 修正：
 *   - Lenis 攔截原生 scroll 事件，AOS 收不到通知 → 在 Lenis scroll 回調中
 *     節流呼叫 AOS.refresh()（50ms throttle，約 20fps）
 *   - 使用 ResizeObserver 監聽 body 高度變化（LazySection 渲染後頁面撐高），
 *     自動呼叫 ScrollTrigger.refresh() 修正觸發位置
 *   - gsap 改為動態載入（見 lib/gsapLoader.ts）：Lenis 先用原生
 *     requestAnimationFrame 驅動，等 gsap 到位才換手到 gsap.ticker，
 *     所以**捲動永遠不用等 gsap 下載完**。
 */
const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    let lenis: any;
    let aosThrottle: ReturnType<typeof setTimeout> | null = null;
    let roThrottle: ReturnType<typeof setTimeout> | null = null;
    let ro: ResizeObserver | null = null;
    // 兩種 raf 驅動來源，同一時間只會有一個活著（避免 lenis.raf 被呼叫兩次）
    let rafId: number | null = null;
    let tick: ((time: number) => void) | null = null;
    let gsapRef: Gsap | null = null;
    let stUpdate: ScrollTriggerType["update"] | null = null;
    // cleanup 可能在 dynamic import 完成前就執行（StrictMode / 快速換頁），
    // 屆時什麼都還沒建立；用 cancelled 讓 initLenis 中止，避免洩漏整組實例
    let cancelled = false;

    const initLenis = async () => {
      try {
        const Lenis = (await import("lenis")).default;
        if (cancelled) return;
        lenis = new Lenis({
          duration: 1.0,            // 原 1.2，縮短惰性殘留（往上捲更跟手）
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 2,
          infinite: false,
          /*
           * ⚠️ 內層捲動容器（必開）
           *
           * Lenis 是掛在 window 上的 `wheel` 監聽（passive:false）：預設它會對
           * 「頁面上任何位置」的滾輪事件 preventDefault()，然後改捲 window。
           * 結果是全站所有 `overflow-y:auto` 的內層容器 —— 後台側邊欄選單、
           * modal 內容區、聊天訊息列 —— 通通吃不到滾輪，等於那些 CSS 是死的。
           *
           * 實測（2026-08-31，正式站 /admin）：側邊欄 nav 需要 865px 但只有
           * 634px（1280×800），末端 4 個項目（意見反饋／表單報名／匯出／
           * Google 日曆）滾輪完全捲不到 —— 這就是業主回報的「滑鼠在左邊
           * 滑不下來」。commit 1912234 把 nav 改成正規 flex 捲動區是對的，
           * 但只要 Lenis 還在攔截滾輪，那個 CSS 就永遠不會生效。
           *
           * allowNestedScroll 讓 Lenis 每次滾輪都先問 hasNestedScroll()：
           *   - 游標下的容器「這個方向還捲得動」→ Lenis 放手，交給瀏覽器原生捲
           *   - 已經到底／根本不能捲        → Lenis 接手捲頁面
           * 所以側邊欄捲到底之後，繼續滾仍然會帶動整頁，兩種行為都保住。
           *
           * ⚠️ 內層容器若設 `overscroll-behavior: contain`（例如 .modal-scroll），
           *    到底時 Lenis 會刻意「不」接手 —— 那是 contain 的語意（切斷捲動鏈），
           *    modal 要的正是這個。但一般的內層容器請維持 overscroll-behavior:auto，
           *    否則捲到底就再也交不回頁面，會重演這次的 bug。
           */
          allowNestedScroll: true,
        });

        lenisRef.current = lenis;
        setLenisInstance(lenis);

        // ── 原生 rAF 驅動（過渡期）────────────────────────────
        // gsap 是 async chunk，可能要幾十～幾百 ms 才到；這段時間若沒人呼叫
        // lenis.raf()，整頁滾輪會完全沒反應。先用瀏覽器原生 rAF 頂著，
        // gsap 到位後再換手（下方會 cancelAnimationFrame，不會雙驅動）。
        const rafLoop = (time: number) => {
          lenis.raf(time);
          rafId = requestAnimationFrame(rafLoop);
        };
        rafId = requestAnimationFrame(rafLoop);

        // ── AOS 整合：throttle 50ms，避免每 RAF 都 refresh ──
        // 因為 Lenis 攔截原生 scroll，AOS 的 scroll listener 不會觸發，
        // 必須在此手動通知 AOS 更新。（與 gsap 無關，立刻接上）
        lenis.on("scroll", () => {
          if (aosThrottle !== null) return;
          aosThrottle = setTimeout(() => {
            AOS.refresh();
            aosThrottle = null;
          }, 50);
        });

        // ── GSAP ScrollTrigger 整合（動態載入後才接）───────────
        const { gsap, ScrollTrigger } = await loadScrollTrigger();
        if (cancelled || !lenis) return;
        gsapRef = gsap;
        stUpdate = ScrollTrigger.update;
        lenis.on("scroll", stUpdate);

        // 換手：停掉原生 rAF，交給 gsap.ticker（單一時間軸，避免 lag 疊加）
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        tick = (time: number) => {
          lenis.raf(time * 1000);
        };
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        // ── ResizeObserver：LazySection 渲染後頁面高度改變時，
        //    自動刷新 ScrollTrigger 的觸發位置 ──────────────────
        ro = new ResizeObserver(() => {
          if (roThrottle !== null) return;
          roThrottle = setTimeout(() => {
            ScrollTrigger.refresh();
            roThrottle = null;
          }, 150);
        });
        ro.observe(document.body);

      } catch (e) {
        console.warn("Lenis not found, falling back to native scroll.");
      }
    };

    initLenis();

    return () => {
      cancelled = true;
      if (aosThrottle !== null) clearTimeout(aosThrottle);
      if (roThrottle !== null) clearTimeout(roThrottle);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (lenis) {
        if (stUpdate) lenis.off("scroll", stUpdate);
        lenis.destroy();
      }
      if (tick && gsapRef) gsapRef.ticker.remove(tick);
      setLenisInstance(null);
      if (ro) ro.disconnect();
    };
  }, []);

  // 路由切換時回到頂部 + 刷新 AOS（新頁面可能有新的 data-aos 元素）
  // 首次 mount（= SSR hydration 完成）不捲頂：使用者可能已經在往下閱讀 SSR 內容
  const isFirstRouteEffect = useRef(true);
  useEffect(() => {
    if (isFirstRouteEffect.current) {
      isFirstRouteEffect.current = false;
      const t = setTimeout(() => AOS.refresh(), 200);
      return () => clearTimeout(t);
    }
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    // 路由切換後頁面重渲染，需刷新 AOS 的元素清單
    const t = setTimeout(() => AOS.refresh(), 200);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return <>{children}</>;
};

export default SmoothScroll;
