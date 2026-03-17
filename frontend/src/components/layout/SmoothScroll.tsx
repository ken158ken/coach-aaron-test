import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * SmoothScroll 元件 - 提供全站 Lenis 平滑捲動
 * 整合 GSAP ScrollTrigger
 */
const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    // 動態載入 Lenis，避免 SSR 錯誤
    let lenis: any;
    
    const initLenis = async () => {
      try {
        const Lenis = (await import("lenis")).default;
        lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 2,
          infinite: false,
        });

        lenisRef.current = lenis;

        // 整合 GSAP ScrollTrigger
        lenis.on("scroll", ScrollTrigger.update);

        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
      } catch (e) {
        console.warn("Lenis not found, falling back to native scroll.");
      }
    };

    initLenis();

    return () => {
      if (lenis) {
        lenis.destroy();
        gsap.ticker.remove(lenis.raf);
      }
    };
  }, []);

  // 路由切換時回到頂部
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return <>{children}</>;
};

export default SmoothScroll;
