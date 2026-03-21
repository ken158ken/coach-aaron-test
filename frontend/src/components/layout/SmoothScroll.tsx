import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AOS from "aos";

/**
 * SmoothScroll 元件 - 提供全站 Lenis 平滑捲動
 * 整合 GSAP ScrollTrigger + AOS
 *
 * 修正：
 *   - Lenis 攔截原生 scroll 事件，AOS 收不到通知 → 在 Lenis scroll 回調中
 *     節流呼叫 AOS.refresh()（50ms throttle，約 20fps）
 *   - 使用 ResizeObserver 監聽 body 高度變化（LazySection 渲染後頁面撐高），
 *     自動呼叫 ScrollTrigger.refresh() 修正觸發位置
 */
const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    let lenis: any;
    let aosThrottle: ReturnType<typeof setTimeout> | null = null;
    let ro: ResizeObserver | null = null;

    const initLenis = async () => {
      try {
        const Lenis = (await import("lenis")).default;
        lenis = new Lenis({
          duration: 1.0,            // 原 1.2，縮短惰性殘留（往上捲更跟手）
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 2,
          infinite: false,
        });

        lenisRef.current = lenis;

        // ── GSAP ScrollTrigger 整合 ──────────────────────────
        lenis.on("scroll", ScrollTrigger.update);

        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);

        // ── AOS 整合：throttle 50ms，避免每 RAF 都 refresh ──
        // 因為 Lenis 攔截原生 scroll，AOS 的 scroll listener 不會觸發，
        // 必須在此手動通知 AOS 更新。
        lenis.on("scroll", () => {
          if (aosThrottle !== null) return;
          aosThrottle = setTimeout(() => {
            AOS.refresh();
            aosThrottle = null;
          }, 50);
        });

        // ── ResizeObserver：LazySection 渲染後頁面高度改變時，
        //    自動刷新 ScrollTrigger 的觸發位置 ──────────────────
        let roThrottle: ReturnType<typeof setTimeout> | null = null;
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
      if (aosThrottle !== null) clearTimeout(aosThrottle);
      if (lenis) {
        lenis.destroy();
        gsap.ticker.remove(lenis.raf);
      }
      if (ro) ro.disconnect();
    };
  }, []);

  // 路由切換時回到頂部 + 刷新 AOS（新頁面可能有新的 data-aos 元素）
  useEffect(() => {
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
