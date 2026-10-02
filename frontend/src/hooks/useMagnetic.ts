import { useRef, useEffect } from "react";
import { loadGsap } from "@/lib/gsapLoader";
import type { Gsap } from "@/lib/gsapLoader";

/**
 * useMagnetic Hook - 讓元素產生磁吸滑鼠的效果
 *
 * gsap 走動態載入（見 lib/gsapLoader.ts）：**第一次滑鼠移進元素**才開始抓
 * vendor-gsap chunk，載入完成前的 mousemove 直接忽略（純 hover 特效，
 * 掉幾幀無感）。滑鼠從沒碰過按鈕的訪客完全不會下載 gsap。
 *
 * @param {number} power - 磁吸強度 (預設 0.3)
 * @returns {React.RefObject<any>} 元素的 Ref
 */
export const useMagnetic = (power = 0.3) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    let gsapRef: Gsap | null = null;
    let requested = false;

    /** 首次互動時觸發載入；已載入／載入中就什麼都不做 */
    const ensureGsap = () => {
      if (gsapRef || requested) return;
      requested = true;
      loadGsap().then((gsap) => {
        if (!cancelled) gsapRef = gsap;
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      ensureGsap();
      if (!gsapRef) return; // gsap 還在路上，這幾幀不做位移

      const { clientX, clientY } = e;
      const { left, top, width, height } = el.getBoundingClientRect();

      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const x = (clientX - centerX) * power;
      const y = (clientY - centerY) * power;

      gsapRef.to(el, {
        x: x,
        y: y,
        duration: 0.5,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      // 沒載入過 gsap 就沒做過位移，不需要歸位
      if (!gsapRef) return;
      gsapRef.to(el, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.3)",
      });
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelled = true;
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      // 元素即將消失，殺掉還在跑的補間（避免對著 detached node 做動畫）
      if (gsapRef) gsapRef.killTweensOf(el);
    };
  }, [power]);

  return ref;
};
